import { Injectable, NotFoundException } from '@nestjs/common';
import { RiskConfigVersionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  type RiskControlConfigContent,
  PublishRiskControlConfigDto,
  RollbackRiskControlConfigDto,
  UpdateRiskControlConfigDto,
} from './risk-control.dto';

const DEFAULT_RISK_CONTROL_CONFIG: RiskControlConfigContent = {
  enabled: true,
  scenes: {
    login: {
      enabled: true,
      thresholds: { perMinute: 20, perHour: 100 },
      captchaAfterFailures: 5,
      captchaTtlSec: 1800,
      blockAfterFailures: 20,
      blockTtlSec: 3600,
      retryAfterSec: 60,
    },
    register: {
      enabled: true,
      thresholds: { perMinute: 5, perHour: 20 },
      captchaAfterFailures: 2,
      captchaTtlSec: 1800,
      blockAfterFailures: 10,
      blockTtlSec: 3600,
      retryAfterSec: 120,
    },
    forgotPassword: {
      enabled: true,
      thresholds: { perMinute: 1, perHour: 5, perDay: 10 },
      captchaAfterFailures: 3,
      captchaTtlSec: 1800,
      blockAfterFailures: 10,
      blockTtlSec: 86400,
      retryAfterSec: 300,
    },
  },
  whitelist: {
    ips: [],
    accounts: [],
  },
  blacklist: {
    ips: [],
    accounts: [],
  },
  degradePolicy: {
    redisUnavailable: 'ALLOW_WITH_CAPTCHA',
  },
};

@Injectable()
export class RiskControlService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeeded() {
    const existing = await this.prisma.riskControlConfig.findFirst();
    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.riskControlConfig.create({
        data: {
          enabled: DEFAULT_RISK_CONTROL_CONFIG.enabled,
          version: 1,
          contentJson: JSON.stringify(DEFAULT_RISK_CONTROL_CONFIG),
        },
      });

      await tx.riskControlConfigVersion.create({
        data: {
          version: 1,
          status: RiskConfigVersionStatus.PUBLISHED,
          contentJson: JSON.stringify(DEFAULT_RISK_CONTROL_CONFIG),
          comment: '初始化默认风控配置',
          createdBy: 'system',
          publishedBy: 'system',
          publishedAt: new Date(),
        },
      });

      return created;
    });
  }

  async getConfig() {
    const current = await this.ensureSeeded();
    return this.mapCurrentConfig(current);
  }

  async updateDraft(dto: UpdateRiskControlConfigDto) {
    const current = await this.ensureSeeded();
    const nextVersion = (await this.getMaxVersion()) + 1;

    const created = await this.prisma.riskControlConfigVersion.create({
      data: {
        version: nextVersion,
        status: RiskConfigVersionStatus.DRAFT,
        contentJson: JSON.stringify(dto.content),
        comment: dto.comment ?? '保存风控配置草稿',
      },
    });

    return {
      currentVersion: current.version,
      draftVersion: created.version,
      status: created.status,
      content: dto.content,
      comment: created.comment,
      updatedAt: created.updatedAt,
    };
  }

  async publish(dto: PublishRiskControlConfigDto) {
    const current = await this.ensureSeeded();
    const draft = await this.prisma.riskControlConfigVersion.findFirst({
      where: { status: RiskConfigVersionStatus.DRAFT },
      orderBy: [{ version: 'desc' }],
    });

    if (!draft) {
      throw new NotFoundException('没有待发布的风控配置草稿');
    }

    const publishedAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.riskControlConfig.update({
        where: { id: current.id },
        data: {
          enabled: this.parseContent(draft.contentJson).enabled,
          version: draft.version,
          contentJson: draft.contentJson,
        },
      });

      await tx.riskControlConfigVersion.update({
        where: { id: draft.id },
        data: {
          status: RiskConfigVersionStatus.PUBLISHED,
          comment: dto.comment ?? draft.comment,
          createdBy: dto.createdBy ?? draft.createdBy ?? null,
          publishedBy: dto.publishedBy ?? null,
          publishedAt,
        },
      });

      await tx.riskControlConfigVersion.updateMany({
        where: {
          status: RiskConfigVersionStatus.PUBLISHED,
          NOT: { id: draft.id },
        },
        data: {
          status: RiskConfigVersionStatus.ROLLED_BACK,
        },
      });

      return tx.riskControlConfig.findUniqueOrThrow({ where: { id: current.id } });
    });

    return this.mapCurrentConfig(result);
  }

  async rollback(dto: RollbackRiskControlConfigDto) {
    const current = await this.ensureSeeded();
    const target = await this.prisma.riskControlConfigVersion.findUnique({
      where: { version: dto.version },
    });

    if (!target) {
      throw new NotFoundException('指定版本不存在');
    }

    const content = this.parseContent(target.contentJson);
    const nextVersion = (await this.getMaxVersion()) + 1;
    const publishedAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.riskControlConfig.update({
        where: { id: current.id },
        data: {
          enabled: content.enabled,
          version: nextVersion,
          contentJson: target.contentJson,
        },
      });

      await tx.riskControlConfigVersion.create({
        data: {
          version: nextVersion,
          status: RiskConfigVersionStatus.PUBLISHED,
          contentJson: target.contentJson,
          comment: dto.comment ?? `回滚到版本 ${dto.version}`,
          publishedBy: dto.publishedBy ?? null,
          rolledBackFromVersion: dto.version,
          publishedAt,
        },
      });

      await tx.riskControlConfigVersion.updateMany({
        where: {
          status: RiskConfigVersionStatus.PUBLISHED,
          NOT: { version: nextVersion },
        },
        data: {
          status: RiskConfigVersionStatus.ROLLED_BACK,
        },
      });

      return tx.riskControlConfig.findUniqueOrThrow({ where: { id: current.id } });
    });

    return this.mapCurrentConfig(result);
  }

  async listVersions() {
    await this.ensureSeeded();
    const rows = await this.prisma.riskControlConfigVersion.findMany({
      orderBy: [{ version: 'desc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      version: row.version,
      status: row.status,
      comment: row.comment,
      createdBy: row.createdBy,
      publishedBy: row.publishedBy,
      rolledBackFromVersion: row.rolledBackFromVersion,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      content: this.parseContent(row.contentJson),
    }));
  }

  private async getMaxVersion() {
    const aggregate = await this.prisma.riskControlConfigVersion.aggregate({
      _max: { version: true },
    });
    return aggregate._max.version ?? 0;
  }

  private parseContent(contentJson: string): RiskControlConfigContent {
    return JSON.parse(contentJson) as RiskControlConfigContent;
  }

  private mapCurrentConfig(row: {
    id: string;
    enabled: boolean;
    version: number;
    contentJson: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const content = this.parseContent(row.contentJson);
    return {
      id: row.id,
      enabled: row.enabled,
      version: row.version,
      content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
