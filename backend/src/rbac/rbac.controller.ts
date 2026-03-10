import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RequireModule, RequirePermission } from './rbac.decorator';
import { RbacGuard } from './rbac.guard';
import {
  UpdateRoleModulesDto,
  UpdateRolePermissionsDto,
  UpdateUserRolesDto,
} from './dto/rbac-manage.dto';
import { RbacService } from './rbac.service';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RbacGuard)
@RequireModule('core')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @RequirePermission('rbac.read')
  listRoles() {
    return this.rbacService.listRoles();
  }

  @Get('permissions')
  @RequirePermission('rbac.read')
  listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Get('users/:userId/access')
  @RequirePermission('rbac.read')
  getUserAccess(@Param('userId') userId: string) {
    return this.rbacService.getUserAccess(userId);
  }

  @Put('users/:userId/roles')
  @RequirePermission('rbac.update')
  updateUserRoles(@Param('userId') userId: string, @Body() dto: UpdateUserRolesDto) {
    return this.rbacService.updateUserRoles(userId, dto.roleCodes);
  }

  @Put('roles/:roleCode/permissions')
  @RequirePermission('rbac.update')
  updateRolePermissions(
    @Param('roleCode') roleCode: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rbacService.updateRolePermissions(roleCode, dto.permissionCodes);
  }

  @Put('roles/:roleCode/modules')
  @RequirePermission('rbac.update')
  updateRoleModules(@Param('roleCode') roleCode: string, @Body() dto: UpdateRoleModulesDto) {
    return this.rbacService.updateRoleModules(roleCode, dto.moduleCodes);
  }
}
