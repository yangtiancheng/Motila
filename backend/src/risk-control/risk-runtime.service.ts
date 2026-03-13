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

@Injectable()
export class RiskRuntimeService {
  private readonly logger = new Logger(RiskRuntimeService.name);
  private readonly redisEnabled: boolean;
  private readonly redis: Redis | null;

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

  async preCheck(input: RiskCheckInput) {
    const config = await this.riskControlService.getConfig();
    const sceneConfig = config.content.scenes[input.scene];

    if (!config.enabled || !config.content.enabled || !sceneConfig?.enabled) {
      return;
    }

    const account = input.account?.trim().toLowerCase();
    const ip = input.ip?.trim();

    if (config.content.whitelist.ips.includes(ip || '') || config.content.whitelist.accounts.includes(account || '')) {
      return;
    }

    if (config.content.blacklist.ips.includes(ip || '') || config.content.blacklist.accounts.includes(account || '')) {
      throw new HttpException('请求过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    }

    const redis = await this.getRedisOrHandle(config.content.degradePolicy.redisUnavailable);
    if (!redis) return;

    const keys = this.buildKeys(input.scene, ip, account);

    for (const key of [keys.blockIp, keys.blockAccount]) {
      if (!key) continue;
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        throw new HttpException(`请求过于频繁，请在 ${ttl} 秒后再试`, HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    await this.bumpCounter(redis, keys.reqIpMinute ?? undefined, 60);
    await this.bumpCounter(redis, keys.reqAccountMinute ?? undefined, 60);

    const ipMinute = keys.reqIpMinute ? Number((await redis.get(keys.reqIpMinute)) || '0') : 0;
    const accountMinute = keys.reqAccountMinute ? Number((await redis.get(keys.reqAccountMinute)) || '0') : 0;

    if ((sceneConfig.thresholds.perMinute && ipMinute > sceneConfig.thresholds.perMinute) ||
        (sceneConfig.thresholds.perMinute && accountMinute > sceneConfig.thresholds.perMinute)) {
      if (keys.blockIp) await redis.set(keys.blockIp, '1', 'EX', sceneConfig.retryAfterSec);
      if (keys.blockAccount) await redis.set(keys.blockAccount, '1', 'EX', sceneConfig.retryAfterSec);
      throw new HttpException(`请求过于频繁，请在 ${sceneConfig.retryAfterSec} 秒后再试`, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async recordResult(input: RiskRecordInput) {
    const config = await this.riskControlService.getConfig();
    const sceneConfig = config.content.scenes[input.scene];

    if (!config.enabled || !config.content.enabled || !sceneConfig?.enabled) {
      return;
    }

    const account = input.account?.trim().toLowerCase();
    const ip = input.ip?.trim();
    const redis = await this.getRedisOrHandle(config.content.degradePolicy.redisUnavailable, false);
    if (!redis) return;

    const keys = this.buildKeys(input.scene, ip, account);

    if (input.success) {
      for (const key of [keys.failIpHour, keys.failAccountHour, keys.blockIp, keys.blockAccount]) {
        if (key) await redis.del(key);
      }
      return;
    }

    await this.bumpCounter(redis, keys.failIpHour ?? undefined, 3600);
    await this.bumpCounter(redis, keys.failAccountHour ?? undefined, 3600);

    const ipFails = keys.failIpHour ? Number((await redis.get(keys.failIpHour)) || '0') : 0;
    const accountFails = keys.failAccountHour ? Number((await redis.get(keys.failAccountHour)) || '0') : 0;

    if (sceneConfig.blockAfterFailures > 0) {
      if (keys.blockIp && ipFails >= sceneConfig.blockAfterFailures) {
        await redis.set(keys.blockIp, '1', 'EX', sceneConfig.blockTtlSec);
      }
      if (keys.blockAccount && accountFails >= sceneConfig.blockAfterFailures) {
        await redis.set(keys.blockAccount, '1', 'EX', sceneConfig.blockTtlSec);
      }
    }
  }

  private async getRedisOrHandle(policy: 'ALLOW_WITH_CAPTCHA' | 'BLOCK_REQUESTS', throwOnBlock = true) {
    if (!this.redisEnabled || !this.redis) {
      if (policy === 'BLOCK_REQUESTS' && throwOnBlock) {
        throw new ServiceUnavailableException('风控服务不可用，请稍后再试');
      }
      return null;
    }

    try {
      if (this.redis.status !== 'ready') {
        await this.redis.connect();
      }
      return this.redis;
    } catch (error) {
      this.logger.warn(`Redis unavailable: ${error instanceof Error ? error.message : String(error)}`);
      if (policy === 'BLOCK_REQUESTS' && throwOnBlock) {
        throw new ServiceUnavailableException('风控服务不可用，请稍后再试');
      }
      return null;
    }
  }

  private async bumpCounter(redis: Redis, key?: string, ttlSec = 60) {
    if (!key) return;
    const value = await redis.incr(key);
    if (value === 1) {
      await redis.expire(key, ttlSec);
    }
  }

  private buildKeys(scene: RiskScene, ip?: string | null, account?: string | null) {
    const safeScene = scene;
    const safeIp = ip ? this.normalize(ip) : null;
    const safeAccount = account ? this.normalize(account) : null;

    return {
      reqIpMinute: safeIp ? `risk:req:${safeScene}:ip:${safeIp}:m1` : null,
      reqAccountMinute: safeAccount ? `risk:req:${safeScene}:acct:${safeAccount}:m1` : null,
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
