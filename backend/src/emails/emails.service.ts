import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as nodemailer from 'nodemailer';
import type { JwtUser } from '../common/jwt-user.type';
import { EmailConfigService } from '../email-config/email-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListInboxQueryDto, ListSendLogsQueryDto, SendEmailDto } from './dto/emails.dto';

@Injectable()
export class EmailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailConfigService: EmailConfigService,
  ) {}

  async send(user: JwtUser | undefined, dto: SendEmailDto) {
    if (!user?.sub) throw new NotFoundException('用户不存在');

    const config = await this.emailConfigService.getConfigWithSecret(user.sub);
    if (!config) throw new BadRequestException('请先在个人信息中配置可用邮箱');

    const toList = dto.to
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    if (!toList.length) throw new BadRequestException('收件人不能为空');

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      auth: {
        user: config.emailAddress,
        pass: config.secret,
      },
    });

    try {
      await transporter.sendMail({
        from: config.emailAddress,
        to: toList.join(','),
        subject: dto.subject,
        text: dto.content,
      });

      const log = await this.prisma.emailSendLog.create({
        data: {
          userId: user.sub,
          to: toList.join(','),
          subject: dto.subject,
          content: dto.content,
          status: 'SUCCESS',
          sentAt: new Date(),
        },
      });

      return { ok: true, message: '发送成功', id: log.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.slice(0, 500) : '发送失败';
      await this.prisma.emailSendLog.create({
        data: {
          userId: user.sub,
          to: toList.join(','),
          subject: dto.subject,
          content: dto.content,
          status: 'FAILED',
          error: errorMessage,
          sentAt: new Date(),
        },
      });
      throw new BadRequestException(errorMessage);
    }
  }

  async logs(user: JwtUser | undefined, query: ListSendLogsQueryDto) {
    if (!user?.sub) throw new NotFoundException('用户不存在');

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.emailSendLog.count({ where: { userId: user.sub } }),
      this.prisma.emailSendLog.findMany({
        where: { userId: user.sub },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { data, total, page, pageSize };
  }

  async syncInbox(user: JwtUser | undefined, limit = 20) {
    if (!user?.sub) throw new NotFoundException('用户不存在');

    const config = await this.emailConfigService.getConfigWithSecret(user.sub);
    if (!config) throw new BadRequestException('请先在个人信息中配置可用邮箱');

    const client = new ImapFlow({
      host: config.imapHost,
      port: config.imapPort,
      secure: config.imapSecure,
      auth: {
        user: config.emailAddress,
        pass: config.secret,
      },
    });

    let inserted = 0;
    try {
      await client.connect();
      await client.mailboxOpen('INBOX');
      const messages = await client.fetchAll('1:*', {
        envelope: true,
        uid: true,
        source: true,
        internalDate: true,
      });

      const slice = messages.slice(-Math.min(Math.max(limit, 1), 100));
      for (const msg of slice) {
        const source = msg.source ? Buffer.from(msg.source) : null;
        const parsed = source ? await simpleParser(source) : null;

        const messageId =
          parsed?.messageId ||
          msg.envelope?.messageId ||
          `uid-${msg.uid}`;

        await this.prisma.emailInbox.upsert({
          where: {
            userId_messageId: {
              userId: user.sub,
              messageId,
            },
          },
          update: {
            folder: 'INBOX',
            fromAddress: parsed?.from?.text || msg.envelope?.from?.map((v) => v.address).join(',') || null,
            toAddress: parsed?.to?.text || msg.envelope?.to?.map((v) => v.address).join(',') || null,
            subject: parsed?.subject || msg.envelope?.subject || null,
            textBody: parsed?.text || null,
            htmlBody: typeof parsed?.html === 'string' ? parsed.html : null,
            receivedAt: msg.internalDate ?? null,
            syncedAt: new Date(),
          },
          create: {
            userId: user.sub,
            messageId,
            folder: 'INBOX',
            fromAddress: parsed?.from?.text || msg.envelope?.from?.map((v) => v.address).join(',') || null,
            toAddress: parsed?.to?.text || msg.envelope?.to?.map((v) => v.address).join(',') || null,
            subject: parsed?.subject || msg.envelope?.subject || null,
            textBody: parsed?.text || null,
            htmlBody: typeof parsed?.html === 'string' ? parsed.html : null,
            receivedAt: msg.internalDate ?? null,
            syncedAt: new Date(),
          },
        });
        inserted += 1;
      }

      return { ok: true, synced: inserted };
    } catch (error) {
      const message = error instanceof Error ? error.message : '收件箱同步失败';
      throw new BadRequestException(message);
    } finally {
      await client.logout().catch(() => {
        client.close();
      });
    }
  }

  async inbox(user: JwtUser | undefined, query: ListInboxQueryDto) {
    if (!user?.sub) throw new NotFoundException('用户不存在');
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.emailInbox.count({ where: { userId: user.sub } }),
      this.prisma.emailInbox.findMany({
        where: { userId: user.sub },
        orderBy: { receivedAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { data, total, page, pageSize };
  }

  async detail(user: JwtUser | undefined, id: string) {
    if (!user?.sub) throw new NotFoundException('用户不存在');
    const row = await this.prisma.emailInbox.findFirst({ where: { id, userId: user.sub } });
    if (!row) throw new NotFoundException('邮件不存在');
    return row;
  }
}
