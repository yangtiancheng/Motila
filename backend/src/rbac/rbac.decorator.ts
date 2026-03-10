import { SetMetadata } from '@nestjs/common';

export const RBAC_PERMISSION_KEY = 'rbac_permission';
export const RBAC_MODULE_KEY = 'rbac_module';

export const RequirePermission = (permissionCode: string) =>
  SetMetadata(RBAC_PERMISSION_KEY, permissionCode);

export const RequireModule = (moduleCode: string) =>
  SetMetadata(RBAC_MODULE_KEY, moduleCode);
