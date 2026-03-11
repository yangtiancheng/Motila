import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSystemConfigDto, UpdateSystemConfigDto } from './system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.systemConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(payload: CreateSystemConfigDto) {
    const isActive = payload.isActive ?? false;

    return this.prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.systemConfig.updateMany({
          data: { isActive: false },
          where: { isActive: true },
        });
      }

      return tx.systemConfig.create({
        data: {
          name: payload.name,
          title: payload.title,
          logoUrl: payload.logoUrl ?? null,
          logoImage: payload.logoImage ?? null,
          footerText: payload.footerText ?? null,
          isActive,
        },
      });
    });
  }

  async update(id: string, payload: UpdateSystemConfigDto) {
    const existing = await this.prisma.systemConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('系统配置不存在');

    const isActive = payload.isActive ?? existing.isActive;

    return this.prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.systemConfig.updateMany({
          data: { isActive: false },
          where: { isActive: true, NOT: { id } },
        });
      }

      return tx.systemConfig.update({
        where: { id },
        data: {
          name: payload.name ?? existing.name,
          title: payload.title ?? existing.title,
          logoUrl: payload.logoUrl ?? null,
          logoImage: payload.logoImage === undefined ? existing.logoImage : payload.logoImage,
          footerText: payload.footerText ?? null,
          isActive,
        },
      });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.systemConfig.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('系统配置不存在');
    if (existing.isActive) throw new BadRequestException('当前有效配置不可删除');
    await this.prisma.systemConfig.delete({ where: { id } });
  }

  async getActive() {
    return this.prisma.systemConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
