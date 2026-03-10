import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SYSTEM_PERMISSIONS, SYSTEM_ROLE_CODES } from './rbac.constants';

export type UserAccessContext = {
  userId: string;
  roleCodes: string[];
  permissions: string[];
  modules: string[];
};

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedSystemRbac();
  }

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { code: 'asc' }],
      include: {
        userRoles: { select: { userId: true } },
        permissions: { include: { permission: true } },
        grants: true,
      },
    });

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role.userRoles.length,
      permissions: role.permissions.map((item) => item.permission.code),
      modules: role.grants.map((item) => item.moduleCode),
    }));
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ moduleCode: 'asc' }, { code: 'asc' }],
      select: {
        code: true,
        name: true,
        moduleCode: true,
      },
    });
  }

  async getUserAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) throw new NotFoundException('用户不存在');

    const access = await this.buildAccessContext(userId);
    return {
      ...user,
      roles: access.roleCodes,
      permissions: access.permissions,
      modules: access.modules,
    };
  }

  async updateUserRoles(userId: string, roleCodes: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });
    if (!user) throw new NotFoundException('用户不存在');

    const uniqCodes = Array.from(new Set(roleCodes.map((item) => item.trim()).filter(Boolean)));
    if (uniqCodes.length === 0) throw new BadRequestException('至少分配一个角色');

    const roles = await this.prisma.role.findMany({ where: { code: { in: uniqCodes } } });
    if (roles.length !== uniqCodes.length) {
      throw new BadRequestException('存在无效角色编码');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRoleMap.deleteMany({ where: { userId } });
      for (const role of roles) {
        await tx.userRoleMap.create({ data: { userId, roleId: role.id } });
      }
    });

    return this.getUserAccess(userId);
  }

  async updateRolePermissions(roleCode: string, permissionCodes: string[]) {
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new NotFoundException('角色不存在');

    const uniqCodes = Array.from(new Set(permissionCodes.map((item) => item.trim()).filter(Boolean)));
    const permissions = uniqCodes.length
      ? await this.prisma.permission.findMany({ where: { code: { in: uniqCodes } } })
      : [];

    if (permissions.length !== uniqCodes.length) {
      throw new BadRequestException('存在无效权限编码');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
      for (const permission of permissions) {
        await tx.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    });

    return this.listRoles();
  }

  async updateRoleModules(roleCode: string, moduleCodes: string[]) {
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new NotFoundException('角色不存在');

    const uniqCodes = Array.from(new Set(moduleCodes.map((item) => item.trim()).filter(Boolean)));
    const modules = uniqCodes.length
      ? await this.prisma.featureModule.findMany({ where: { code: { in: uniqCodes } } })
      : [];

    if (modules.length !== uniqCodes.length) {
      throw new BadRequestException('存在无效模块编码');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.roleModuleGrant.deleteMany({ where: { roleId: role.id } });
      for (const module of modules) {
        await tx.roleModuleGrant.create({
          data: {
            roleId: role.id,
            moduleCode: module.code,
          },
        });
      }
    });

    return this.listRoles();
  }

  async buildAccessContext(userId: string): Promise<UserAccessContext> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('用户不存在');

    const roleMaps = await this.prisma.userRoleMap.findMany({
      where: { userId },
      include: { role: true },
    });

    const roleCodes = roleMaps.map((item) => item.role.code);

    const permissionRows = await this.prisma.rolePermission.findMany({
      where: {
        roleId: {
          in: roleMaps.map((item) => item.roleId),
        },
      },
      include: { permission: true },
    });

    const permissions = Array.from(new Set(permissionRows.map((row) => row.permission.code)));

    const roleModuleRows = await this.prisma.roleModuleGrant.findMany({
      where: {
        roleId: {
          in: roleMaps.map((item) => item.roleId),
        },
      },
    });

    const modules = Array.from(new Set(roleModuleRows.map((row) => row.moduleCode)));

    return {
      userId,
      roleCodes,
      permissions,
      modules,
    };
  }

  async assertHasPermission(userId: string, permissionCode: string) {
    const ctx = await this.buildAccessContext(userId);
    if (ctx.roleCodes.includes(SYSTEM_ROLE_CODES.SUPER_ADMIN)) return;

    if (!ctx.permissions.includes(permissionCode)) {
      throw new ForbiddenException(`缺少权限：${permissionCode}`);
    }
  }

  async assertHasModule(userId: string, moduleCode: string) {
    const ctx = await this.buildAccessContext(userId);
    if (ctx.roleCodes.includes(SYSTEM_ROLE_CODES.SUPER_ADMIN)) return;

    if (!ctx.modules.includes(moduleCode)) {
      throw new ForbiddenException(`模块未授权：${moduleCode}`);
    }
  }

  private async seedSystemRbac() {
    const superAdminRole = await this.prisma.role.upsert({
      where: { code: SYSTEM_ROLE_CODES.SUPER_ADMIN },
      update: { name: '超级管理员', isSystem: true },
      create: {
        code: SYSTEM_ROLE_CODES.SUPER_ADMIN,
        name: '超级管理员',
        description: '系统内置超级管理员角色',
        isSystem: true,
      },
    });

    const defaultUserRole = await this.prisma.role.upsert({
      where: { code: SYSTEM_ROLE_CODES.DEFAULT_USER },
      update: { name: '默认用户', isSystem: true },
      create: {
        code: SYSTEM_ROLE_CODES.DEFAULT_USER,
        name: '默认用户',
        description: '系统默认普通角色',
        isSystem: true,
      },
    });

    for (const item of SYSTEM_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          moduleCode: item.moduleCode,
        },
        create: {
          code: item.code,
          name: item.name,
          moduleCode: item.moduleCode,
        },
      });
    }

    const allPermissions = await this.prisma.permission.findMany();
    for (const perm of allPermissions) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
    }

    const defaultPerms = ['dashboard.read', 'profile.read'];
    for (const code of defaultPerms) {
      const perm = allPermissions.find((item) => item.code === code);
      if (!perm) continue;
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: defaultUserRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: defaultUserRole.id,
          permissionId: perm.id,
        },
      });
    }

    const allModules = await this.prisma.featureModule.findMany({
      where: { status: 'ENABLED' },
      select: { code: true },
    });

    for (const module of allModules) {
      await this.prisma.roleModuleGrant.upsert({
        where: {
          roleId_moduleCode: {
            roleId: superAdminRole.id,
            moduleCode: module.code,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          moduleCode: module.code,
        },
      });
    }

    await this.prisma.roleModuleGrant.upsert({
      where: {
        roleId_moduleCode: {
          roleId: defaultUserRole.id,
          moduleCode: 'core',
        },
      },
      update: {},
      create: {
        roleId: defaultUserRole.id,
        moduleCode: 'core',
      },
    });

    const users = await this.prisma.user.findMany({
      select: { id: true, role: true },
    });

    for (const user of users) {
      const roleId = user.role === UserRole.ADMIN ? superAdminRole.id : defaultUserRole.id;
      await this.prisma.userRoleMap.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId,
        },
      });
    }

    const adminCount = await this.prisma.userRoleMap.count({
      where: { roleId: superAdminRole.id },
    });

    if (adminCount === 0) {
      throw new BadRequestException('至少需要一个超级管理员');
    }
  }
}
