import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuditAction, AuditLogDto } from './audit.types';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(payload: {
    action: AuditAction;
    targetId: string;
    targetName: string;
    targetEmail: string;
    actorId: string;
    actorEmail: string;
    actorRole: UserRole;
    detail?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: payload.action,
        entity: 'USER',
        targetId: payload.targetId,
        targetName: payload.targetName,
        targetEmail: payload.targetEmail,
        actorId: payload.actorId,
        actorEmail: payload.actorEmail,
        actorRole: payload.actorRole,
        detail: payload.detail,
      },
    });
  }

  async list(limit = 100): Promise<AuditLogDto[]> {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }
}
