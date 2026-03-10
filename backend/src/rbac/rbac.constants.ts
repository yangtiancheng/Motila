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
] as const;
