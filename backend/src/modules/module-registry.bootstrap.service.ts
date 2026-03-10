import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleLifecycleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SeedModuleDef = {
  code: string;
  name: string;
  description: string;
  isCore?: boolean;
  sortOrder: number;
  status?: ModuleLifecycleStatus;
  dependencies?: string[];
};

const DEFAULT_MODULES: SeedModuleDef[] = [
  {
    code: 'core',
    name: '系统核心',
    description: '认证、用户、权限等基础能力',
    isCore: true,
    sortOrder: 0,
    status: ModuleLifecycleStatus.ENABLED,
  },
  {
    code: 'audit',
    name: '审计日志',
    description: '操作日志追踪与审计能力',
    isCore: true,
    sortOrder: 10,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'users',
    name: '用户管理',
    description: '用户账号与角色管理',
    isCore: true,
    sortOrder: 20,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core', 'audit'],
  },
  {
    code: 'project',
    name: '项目管理',
    description: '项目台账与进度管理（预留模块）',
    sortOrder: 100,
    status: ModuleLifecycleStatus.DISABLED,
    dependencies: ['core'],
  },
  {
    code: 'hr',
    name: '人员管理',
    description: '员工信息与组织能力（预留模块）',
    sortOrder: 110,
    status: ModuleLifecycleStatus.DISABLED,
    dependencies: ['core'],
  },
];

@Injectable()
export class ModuleRegistryBootstrapService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const def of DEFAULT_MODULES) {
      await this.prisma.featureModule.upsert({
        where: { code: def.code },
        update: {
          name: def.name,
          description: def.description,
          isCore: !!def.isCore,
          sortOrder: def.sortOrder,
        },
        create: {
          code: def.code,
          name: def.name,
          description: def.description,
          isCore: !!def.isCore,
          sortOrder: def.sortOrder,
          status: def.status ?? ModuleLifecycleStatus.DISABLED,
        },
      });
    }

    for (const def of DEFAULT_MODULES) {
      const deps = def.dependencies ?? [];
      for (const dep of deps) {
        if (dep === def.code) continue;

        await this.prisma.moduleDependency.upsert({
          where: {
            moduleCode_dependsOnCode: {
              moduleCode: def.code,
              dependsOnCode: dep,
            },
          },
          update: {},
          create: {
            moduleCode: def.code,
            dependsOnCode: dep,
          },
        });
      }
    }
  }
}
