import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListLoginHistoryQueryDto } from './dto/login-history.dto';

@Injectable()
export class LoginHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListLoginHistoryQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const keyword = query.keyword?.trim();

    const where = {
      ...(query.username ? { username: { contains: query.username } } : {}),
      ...(keyword
        ? {
            OR: [
              { username: { contains: keyword } },
              { name: { contains: keyword } },
              { ip: { contains: keyword } },
              { status: { contains: keyword } },
              { reason: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.loginHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.loginHistory.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async create(data: {
    userId?: string | null;
    username: string;
    name?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    status: string;
    reason?: string | null;
  }) {
    return this.prisma.loginHistory.create({
      data: {
        userId: data.userId ?? null,
        username: data.username,
        name: data.name ?? null,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        status: data.status,
        reason: data.reason ?? null,
      },
    });
  }
}
