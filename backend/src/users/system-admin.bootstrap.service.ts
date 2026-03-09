import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_SUPER_ADMIN } from './system-admin.constants';

@Injectable()
export class SystemAdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SystemAdminBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: SYSTEM_SUPER_ADMIN.username },
          { email: SYSTEM_SUPER_ADMIN.email },
        ],
      },
      select: { id: true, username: true, email: true, role: true },
    });

    if (!existing) {
      const passwordHash = await bcrypt.hash(SYSTEM_SUPER_ADMIN.password, 10);
      await this.prisma.user.create({
        data: {
          username: SYSTEM_SUPER_ADMIN.username,
          name: SYSTEM_SUPER_ADMIN.name,
          email: SYSTEM_SUPER_ADMIN.email,
          passwordHash,
          role: UserRole.ADMIN,
        },
      });
      this.logger.log(`已初始化系统超级管理员: ${SYSTEM_SUPER_ADMIN.username}`);
      return;
    }

    if (existing.role !== UserRole.ADMIN) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.ADMIN },
      });
      this.logger.warn(`检测到系统超级管理员角色异常，已自动修复为 ADMIN: ${existing.username}`);
    }
  }
}
