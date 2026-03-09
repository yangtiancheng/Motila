export type AuditAction =
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_ROLE_CHANGE'
  | 'USER_PASSWORD_RESET';

export type AuditItem = {
  id: string;
  action: AuditAction;
  entity: 'USER';
  targetId: string;
  targetName: string;
  targetEmail: string;
  actorId: string;
  actorEmail: string;
  actorRole: 'ADMIN' | 'USER';
  detail?: string;
  createdAt: string;
};
