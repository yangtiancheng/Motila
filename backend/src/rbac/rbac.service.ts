import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
