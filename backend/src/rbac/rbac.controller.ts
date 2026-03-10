import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RequireModule, RequirePermission } from './rbac.decorator';
import { RbacGuard } from './rbac.guard';
import {
  CreateRoleDto,
  UpdateRoleDto,
  UpdateRoleModulesDto,
  UpdateRolePermissionsDto,
  UpdateRoleUsersDto,
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

  @Post('roles')
  @RequirePermission('rbac.update')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Put('roles/:roleCode')
  @RequirePermission('rbac.update')
  updateRole(@Param('roleCode') roleCode: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(roleCode, dto);
  }

  @Delete('roles/:roleCode')
  @RequirePermission('rbac.update')
  deleteRole(@Param('roleCode') roleCode: string) {
    return this.rbacService.deleteRole(roleCode);
  }

  @Put('roles/:roleCode/users')
  @RequirePermission('rbac.update')
  updateRoleUsers(@Param('roleCode') roleCode: string, @Body() dto: UpdateRoleUsersDto) {
    return this.rbacService.updateRoleUsers(roleCode, dto.userIds ?? []);
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
