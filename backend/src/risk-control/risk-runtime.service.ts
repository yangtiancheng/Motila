import { HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import Redis from 'ioredis';
import { RiskControlService } from './risk-control.service';

type RiskScene = 'login' | 'register' | 'forgotPassword';

type RiskCheckInput = {
  scene: RiskScene;
  ip?: string | null;
  account?: string | null;
};

type RiskRecordInput = RiskCheckInput & {
  success: boolean;
};

type RiskDecision = {
  needCaptcha: boolean;
};

@Injectable()
export class RiskRuntimeService {
  private readonly logger = new Logger(RiskRuntimeService.name);
  private readonly redisEnabled: boolean;
  private readonly redis: Redis | null;
  private readonly memoryCounters = new Map<string, { value: number; expiresAt: number }>();
  private readonly memoryBlocks = new Map<string, number>();

  constructor(private readonly riskControlService: RiskControlService) {
    const redisUrl = process.env.REDIS_URL?.trim();
    const redisHost = process.env.REDIS_HOST?.trim();

    if (redisUrl) {
      this.redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
      this.redisEnabled = true;
    } else if (redisHost) {
      this.redis = new Redis({
        host: redisHost,
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        db: Number(process.env.REDIS_DB ?? 0),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redisEnabled = true;
    } else {
      this.redis = null;
      this.redisEnabled = false;
    }
  }

  async preCheck(input: RiskCheckInput): Promise<RiskDecision> {
    const config = await this.riskControlService.getConfig();
    const sceneConfig = config.content.scenes[input.scene];

    if (!config.enabled || !config.content.enabled || !sceneConfig?.enabled) {
      return { needCaptcha: false };
    }

    const account = input.account?.trim().toLowerCase();
    const ip = input.ip?.trim();

    if (config.content.whitelist.ips.includes(ip || '') || config.content.whitelist.accounts.includes(account || '')) {
      return { needCaptcha: false };
    }

    if (config.content.blacklist.ips.includes(ip || '') || config.content.blacklist.accounts.includes(account || '')) {
      throw new HttpException('请求过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    }

    const keys = this.buildKeys(input.scene, ip, account);
    const storage = await this.getStorage(config.content.degradePolicy.redisUnavailable);

    const blockIpTtl = await this.readBlockTtl(storage, keys.blockIp);
    const blockAccountTtl = await this.readBlockTtl(storage, keys.blockAccount);
    const blockTtl = Math.max(blockIpTtl, blockAccountTtl);
    if (blockTtl > 0) {
      throw new HttpException(`请求过于频繁，请在 ${blockTtl} 秒后再试`, HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.bumpCounter(storage, keys.reqIpMinute, 60);
    await this.bumpCounter(storage, keys.reqAccountMinute, 60);
    await this.bumpCounter(storage, keys.reqIpHour, 3600);
    await this.bumpCounter(storage, keys.reqAccountHour, 3600);
    await this.bumpCounter(storage, keys.reqIpDay, 86400);
    await this.bumpCounter(storage, keys.reqAccountDay, 86400);

    const ipMinute = await this.readCounter(storage, keys.reqIpMinute);
    const accountMinute = await this.readCounter(storage, keys.reqAccountMinute);
    const ipHour = await this.readCounter(storage, keys.reqIpHour);
    const accountHour = await this.readCounter(storage, keys.reqAccountHour);
    const ipDay = await this.readCounter(storage, keys.reqIpDay);
    const accountDay = await this.readCounter(storage, keys.reqAccountDay);
    const ipFails = await this.readCounter(storage, keys.failIpHour);
    const accountFails = await this.readCounter(storage, keys.failAccountHour);

    const reachLimit =
      this.hitThreshold(ipMinute, accountMinute, sceneConfig.thresholds.perMinute) ||
      this.hitThreshold(ipHour, accountHour, sceneConfig.thresholds.perHour) ||
      this.hitThreshold(ipDay, accountDay, sceneConfig.thresholds.perDay);

    if (reachLimit) {
      if (keys.blockIp) await this.setBlock(storage, keys.blockIp, sceneConfig.retryAfterSec);
      if (keys.blockAccount) await this.setBlock(storage, keys.blockAccount, sceneConfig.retryAfterSec);
      throw new HttpException(`请求过于频繁，请在 ${sceneConfig.retryAfterSec} 秒后再试`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const needCaptcha = sceneConfig.captchaAfterFailures > 0
      && (ipFails >= sceneConfig.captchaAfterFailures || accountFails >= sceneConfig.captchaAfterFailures);

    return { needCaptcha };
  }

  async recordResult(input: RiskRecordInput) {
    const config = await this.riskControlService.getConfig();
    const sceneConfig = config.content.scenes[input.scene];

    if (!config.enabled || !config.content.enabled || !sceneConfig?.enabled) {
      return;
    }

    const account = input.account?.trim().toLowerCase();
    const ip = input.ip?.trim();
    const storage = await this.getStorage(config.content.degradePolicy.redisUnavailable, false);
    const keys = this.buildKeys(input.scene, ip, account);

    if (input.success) {
      for (const key of [keys.failIpHour, keys.failAccountHour, keys.blockIp, keys.blockAccount]) {
        if (key) await this.deleteKey(storage, key);
      }
      return;
    }

    await this.bumpCounter(storage, keys.failIpHour, 3600);
    await this.bumpCounter(storage, keys.failAccountHour, 3600);

    const ipFails = await this.readCounter(storage, keys.failIpHour);
    const accountFails = await this.readCounter(storage, keys.failAccountHour);

    if (sceneConfig.blockAfterFailures > 0) {
      if (keys.blockIp && ipFails >= sceneConfig.blockAfterFailures) {
        await this.setBlock(storage, keys.blockIp, sceneConfig.blockTtlSec);
      }
      if (keys.blockAccount && accountFails >= sceneConfig.blockAfterFailures) {
        await this.setBlock(storage, keys.blockAccount, sceneConfig.blockTtlSec);
      }
    }
  }

  private hitThreshold(ipValue: number, accountValue: number, limit?: number) {
    return !!limit && (ipValue > limit || accountValue > limit);
  }

  private async getStorage(policy: 'ALLOW_WITH_CAPTCHA' | 'BLOCK_REQUESTS', throwOnBlock = true) {
    if (!this.redisEnabled || !this.redis) {
      if (policy === 'BLOCK_REQUESTS' && throwOnBlock) {
        throw new ServiceUnavailableException('风控服务不可用，请稍后再试');
      }
      return { kind: 'memory' as const };
    }

    try {
      if (this.redis.status !== 'ready') {
        await this.redis.connect();
      }
      return { kind: 'redis' as const, client: this.redis };
    } catch (error) {
      this.logger.warn(`Redis unavailable: ${error instanceof Error ? error.message : String(error)}`);
      if (policy === 'BLOCK_REQUESTS' && throwOnBlock) {
        throw new ServiceUnavailableException('风控服务不可用，请稍后再试');
      }
      return { kind: 'memory' as const };
    }
  }

  private async bumpCounter(storage: { kind: 'memory' } | { kind: 'redis'; client: Redis }, key?: string | null, ttlSec = 60) {
    if (!key) return;
    if (storage.kind === 'redis') {
      const value = await storage.client.incr(key);
      if (value === 1) {
        await storage.client.expire(key, ttlSec);
      }
      return;
    }

    const current = this.memoryCounters.get(key);
    const now = Date.now();
    if (!current || current.expiresAt <= now) {
      this.memoryCounters.set(key, { value: 1, expiresAt: now + ttlSec * 1000 });
      return;
    }
    current.value += 1;
  }

  private async readCounter(storage: { kind: 'memory' } | { kind: 'redis'; client: Redis }, key?: string | null) {
    if (!key) return 0;
    if (storage.kind === 'redis') {
      return Number((await storage.client.get(key)) || '0');
    }

    const current = this.memoryCounters.get(key);
    if (!current) return 0;
    if (current.expiresAt <= Date.now()) {
      this.memoryCounters.delete(key);
      return 0;
    }
    return current.value;
  }

  private async setBlock(storage: { kind: 'memory' } | { kind: 'redis'; client: Redis }, key: string, ttlSec: number) {
    if (storage.kind === 'redis') {
      await storage.client.set(key, '1', 'EX', ttlSec);
      return;
    }
    this.memoryBlocks.set(key, Date.now() + ttlSec * 1000);
  }

  private async readBlockTtl(storage: { kind: 'memory' } | { kind: 'redis'; client: Redis }, key?: string | null) {
    if (!key) return 0;
    if (storage.kind === 'redis') {
      const ttl = await storage.client.ttl(key);
      return ttl > 0 ? ttl : 0;
    }
    const expiresAt = this.memoryBlocks.get(key);
    if (!expiresAt) return 0;
    const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
    if (ttl <= 0) {
      this.memoryBlocks.delete(key);
      return 0;
    }
    return ttl;
  }

  private async deleteKey(storage: { kind: 'memory' } | { kind: 'redis'; client: Redis }, key: string) {
    if (storage.kind === 'redis') {
      await storage.client.del(key);
      return;
    }
    this.memoryCounters.delete(key);
    this.memoryBlocks.delete(key);
  }

  private buildKeys(scene: RiskScene, ip?: string | null, account?: string | null) {
    const safeScene = scene;
    const safeIp = ip ? this.normalize(ip) : null;
    const safeAccount = account ? this.normalize(account) : null;

    return {
      reqIpMinute: safeIp ? `risk:req:${safeScene}:ip:${safeIp}:m1` : null,
      reqAccountMinute: safeAccount ? `risk:req:${safeScene}:acct:${safeAccount}:m1` : null,
      reqIpHour: safeIp ? `risk:req:${safeScene}:ip:${safeIp}:h1` : null,
      reqAccountHour: safeAccount ? `risk:req:${safeScene}:acct:${safeAccount}:h1` : null,
      reqIpDay: safeIp ? `risk:req:${safeScene}:ip:${safeIp}:d1` : null,
      reqAccountDay: safeAccount ? `risk:req:${safeScene}:acct:${safeAccount}:d1` : null,
      failIpHour: safeIp ? `risk:fail:${safeScene}:ip:${safeIp}:h1` : null,
      failAccountHour: safeAccount ? `risk:fail:${safeScene}:acct:${safeAccount}:h1` : null,
      blockIp: safeIp ? `risk:block:${safeScene}:ip:${safeIp}` : null,
      blockAccount: safeAccount ? `risk:block:${safeScene}:acct:${safeAccount}` : null,
    };
  }

  private normalize(value: string) {
    return value.replace(/[^a-zA-Z0-9:_@.-]/g, '_');
  }
}
