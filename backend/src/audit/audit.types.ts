import { UserRole } from '@prisma/client';

export type AuditAction =
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_ROLE_CHANGE'
  | 'USER_PASSWORD_RESET';

export type AuditEntity = 'USER';

export class AuditLogDto {
  id!: string;
  action!: AuditAction;
  entity!: AuditEntity;
  targetId!: string;
  targetName!: string;
  targetEmail!: string;
  actorId!: string;
  actorEmail!: string;
  actorRole!: UserRole;
  detail?: string | null;
  createdAt!: Date;
}
