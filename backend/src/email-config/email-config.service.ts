import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EmailProvider } from '@prisma/client';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import type { JwtUser } from '../common/jwt-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { TestMyEmailConfigDto, UpsertMyEmailConfigDto } from './email-config.dto';

type EmailDefaults = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
};

@Injectable()
export class EmailConfigService {
  constructor(private readonly prisma: PrismaService) {}

  providerDefaults() {
    return {
      QQ: {
        smtpHost: 'smtp.qq.com',
        smtpPort: 465,
        smtpSecure: true,
        imapHost: 'imap.qq.com',
        imapPort: 993,
        imapSecure: true,
      },
      NETEASE_163: {
        smtpHost: 'smtp.163.com',
        smtpPort: 465,
        smtpSecure: true,
        imapHost: 'imap.163.com',
        imapPort: 993,
        imapSecure: true,
      },
    } satisfies Record<'QQ' | 'NETEASE_163', EmailDefaults>;
  }

  async getMe(user: JwtUser | undefined) {
    if (!user?.sub) throw new NotFoundException('用户不存在');

    const row = await this.prisma.userEmailConfig.findUnique({
      where: { userId: user.sub },
    });
    if (!row) return null;

    const { secretEncrypted, ...rest } = row;
    return {
      ...rest,
      secretMasked: this.maskSecret(this.decryptSecret(secretEncrypted)),
    };
  }

  async upsertMe(user: JwtUser | undefined, payload: UpsertMyEmailConfigDto) {
    if (!user?.sub) throw new NotFoundException('用户不存在');

    const existing = await this.prisma.userEmailConfig.findUnique({ where: { userId: user.sub } });
    const resolvedSecret = payload.secret ?? (existing ? this.decryptSecret(existing.secretEncrypted) : '');
    if (!resolvedSecret) {
      throw new BadRequestException('授权码/密码不能为空');
    }

    const encrypted = this.encryptSecret(resolvedSecret);
    const row = await this.prisma.userEmailConfig.upsert({
      where: { userId: user.sub },
      update: {
        provider: payload.provider,
        emailAddress: payload.emailAddress,
        authType: payload.authType,
        secretEncrypted: encrypted,
        smtpHost: payload.smtpHost,
        smtpPort: payload.smtpPort,
        smtpSecure: payload.smtpSecure,
        imapHost: payload.imapHost,
        imapPort: payload.imapPort,
        imapSecure: payload.imapSecure,
        popHost: payload.popHost,
        popPort: payload.popPort,
        popSecure: payload.popSecure,
        enabled: payload.enabled ?? true,
      },
      create: {
        userId: user.sub,
        provider: payload.provider,
        emailAddress: payload.emailAddress,
        authType: payload.authType,
        secretEncrypted: encrypted,
        smtpHost: payload.smtpHost,
        smtpPort: payload.smtpPort,
        smtpSecure: payload.smtpSecure,
        imapHost: payload.imapHost,
        imapPort: payload.imapPort,
        imapSecure: payload.imapSecure,
        popHost: payload.popHost,
        popPort: payload.popPort,
        popSecure: payload.popSecure,
        enabled: payload.enabled ?? true,
      },
    });

    const { secretEncrypted: storedSecret, ...rest } = row;
    return {
      ...rest,
      secretMasked: this.maskSecret(resolvedSecret),
    };
  }

  async testMyConfig(user: JwtUser | undefined, payload: TestMyEmailConfigDto) {
    if (!user?.sub) throw new NotFoundException('用户不存在');
    if (!payload.secret) throw new BadRequestException('测试时必须填写授权码/密码');

    const transporter = nodemailer.createTransport({
      host: payload.smtpHost,
      port: payload.smtpPort,
      secure: payload.smtpSecure,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      auth: {
        user: payload.emailAddress,
        pass: payload.secret,
      },
    });

    try {
      await transporter.verify();
      const testTo = payload.testTo ?? payload.emailAddress;
      await transporter.sendMail({
        from: payload.emailAddress,
        to: testTo,
        subject: '[Motila] 邮箱配置测试',
        text: '邮箱配置测试成功：SMTP 连接与认证可用。',
      });

      await this.prisma.userEmailConfig.updateMany({
        where: { userId: user.sub },
        data: {
          lastTestAt: new Date(),
          lastTestStatus: 'SUCCESS',
          lastTestMessage: 'SMTP连接与测试发件成功',
        },
      });

      return { ok: true, message: '邮箱配置可用，测试邮件发送成功' };
    } catch (error) {
      const message = error instanceof Error ? error.message : '邮箱测试失败';
      await this.prisma.userEmailConfig.updateMany({
        where: { userId: user.sub },
        data: {
          lastTestAt: new Date(),
          lastTestStatus: 'FAILED',
          lastTestMessage: message.slice(0, 300),
        },
      });
      return { ok: false, message };
    }
  }

  async getConfigWithSecret(userId: string) {
    const row = await this.prisma.userEmailConfig.findUnique({ where: { userId } });
    if (!row || !row.enabled) return null;
    return {
      ...row,
      secret: this.decryptSecret(row.secretEncrypted),
    };
  }

  private secretKey() {
    const raw = process.env.EMAIL_CONFIG_SECRET ?? process.env.JWT_SECRET ?? 'motila-dev-secret-change-me';
    return crypto.createHash('sha256').update(raw).digest();
  }

  private encryptSecret(value: string) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.secretKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decryptSecret(payload: string) {
    try {
      const [ivB64, tagB64, dataB64] = payload.split('.');
      const iv = Buffer.from(ivB64, 'base64');
      const tag = Buffer.from(tagB64, 'base64');
      const data = Buffer.from(dataB64, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.secretKey(), iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      return '';
    }
  }

  private maskSecret(value: string) {
    if (!value) return '';
    if (value.length <= 4) return '*'.repeat(value.length);
    return `${value.slice(0, 2)}${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
  }
}
