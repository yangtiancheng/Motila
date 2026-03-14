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
    code: 'risk-control',
    name: '风控配置',
    description: '登录、注册、忘记密码等风控策略配置中心',
    sortOrder: 30,
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
  {
    code: 'login-history',
    name: '登录历史',
    description: '用户登录行为历史记录',
    sortOrder: 120,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core', 'audit'],
  },
  {
    code: 'blog',
    name: '博客管理',
    description: '文章分类、文章管理与 Markdown 编辑',
    sortOrder: 130,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'salary',
    name: '薪酬管理',
    description: '薪酬管理模块入口',
    sortOrder: 140,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'procurement',
    name: '采购管理',
    description: '采购管理模块入口',
    sortOrder: 150,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'inventory',
    name: '库存管理',
    description: '库存管理模块入口',
    sortOrder: 160,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'asset',
    name: '资产管理',
    description: '资产管理模块入口',
    sortOrder: 170,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'ledger',
    name: '总账管理',
    description: '总账管理模块入口',
    sortOrder: 180,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'department-cost',
    name: '科室成本',
    description: '科室成本模块入口',
    sortOrder: 190,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'project-cost',
    name: '项目成本',
    description: '项目成本模块入口',
    sortOrder: 200,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'disease-cost',
    name: '病种成本',
    description: '病种成本模块入口',
    sortOrder: 210,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'income',
    name: '收入管理',
    description: '收入管理模块入口',
    sortOrder: 220,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'budget',
    name: '预算管理',
    description: '预算管理模块入口',
    sortOrder: 230,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
  {
    code: 'performance',
    name: '绩效管理',
    description: '绩效管理模块入口',
    sortOrder: 240,
    status: ModuleLifecycleStatus.ENABLED,
    dependencies: ['core'],
  },
];

const AUTO_ENABLE_BUSINESS_MODULES = new Set(
  DEFAULT_MODULES.filter((item) => item.status === ModuleLifecycleStatus.ENABLED && !item.isCore).map(
    (item) => item.code,
  ),
);

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
          status: AUTO_ENABLE_BUSINESS_MODULES.has(def.code)
            ? ModuleLifecycleStatus.ENABLED
            : undefined,
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
