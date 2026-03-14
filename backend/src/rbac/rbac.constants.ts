export const SYSTEM_ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEFAULT_USER: 'DEFAULT_USER',
} as const;

export const SYSTEM_PERMISSIONS = [
  { code: 'dashboard.read', name: '查看仪表盘', moduleCode: 'core' },
  { code: 'profile.read', name: '查看个人信息', moduleCode: 'core' },

  { code: 'users.read', name: '查看用户', moduleCode: 'users' },
  { code: 'users.create', name: '创建用户', moduleCode: 'users' },
  { code: 'users.update', name: '编辑用户', moduleCode: 'users' },
  { code: 'users.delete', name: '删除用户', moduleCode: 'users' },

  { code: 'audit.read', name: '查看审计日志', moduleCode: 'audit' },

  { code: 'project.read', name: '查看项目', moduleCode: 'project' },
  { code: 'project.create', name: '创建项目', moduleCode: 'project' },
  { code: 'project.update', name: '编辑项目', moduleCode: 'project' },

  { code: 'hr.read', name: '查看员工', moduleCode: 'hr' },
  { code: 'hr.create', name: '创建员工', moduleCode: 'hr' },
  { code: 'hr.update', name: '编辑员工', moduleCode: 'hr' },

  { code: 'module.read', name: '查看模块配置', moduleCode: 'core' },
  { code: 'module.update', name: '修改模块配置', moduleCode: 'core' },

  { code: 'rbac.read', name: '查看权限配置', moduleCode: 'core' },
  { code: 'rbac.update', name: '修改权限配置', moduleCode: 'core' },

  { code: 'settings.read', name: '查看系统配置', moduleCode: 'core' },
  { code: 'settings.update', name: '修改系统配置', moduleCode: 'core' },

  { code: 'risk.read', name: '查看风控配置', moduleCode: 'risk-control' },
  { code: 'risk.update', name: '修改风控配置', moduleCode: 'risk-control' },

  { code: 'login-history.read', name: '查看登录历史', moduleCode: 'login-history' },

  { code: 'blog-category.read', name: '查看文章分类', moduleCode: 'blog' },
  { code: 'blog-category.create', name: '创建文章分类', moduleCode: 'blog' },
  { code: 'blog-category.update', name: '编辑文章分类', moduleCode: 'blog' },
  { code: 'blog-post.read', name: '查看文章', moduleCode: 'blog' },
  { code: 'blog-post.create', name: '创建文章', moduleCode: 'blog' },
  { code: 'blog-post.update', name: '编辑文章', moduleCode: 'blog' },

  { code: 'salary.read', name: '查看薪酬管理', moduleCode: 'salary' },
  { code: 'procurement.read', name: '查看采购管理', moduleCode: 'procurement' },
  { code: 'inventory.read', name: '查看库存管理', moduleCode: 'inventory' },
  { code: 'asset.read', name: '查看资产管理', moduleCode: 'asset' },
  { code: 'ledger.read', name: '查看总账管理', moduleCode: 'ledger' },
  { code: 'department-cost.read', name: '查看科室成本', moduleCode: 'department-cost' },
  { code: 'project-cost.read', name: '查看项目成本', moduleCode: 'project-cost' },
  { code: 'disease-cost.read', name: '查看病种成本', moduleCode: 'disease-cost' },
  { code: 'income.read', name: '查看收入管理', moduleCode: 'income' },
  { code: 'budget.read', name: '查看预算管理', moduleCode: 'budget' },
  { code: 'performance.read', name: '查看绩效管理', moduleCode: 'performance' },
] as const;
