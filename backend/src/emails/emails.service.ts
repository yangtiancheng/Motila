import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { JwtUser } from '../common/jwt-user.type';
import { EmailConfigService } from '../email-config/email-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListSendLogsQueryDto, SendEmailDto } from './dto/emails.dto';

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
}
