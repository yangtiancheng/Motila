import { AppstoreOutlined, BgColorsOutlined, DashboardOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { auditMenuItem } from './audit/audit-menu-item';
import { hrMenuItem } from './hr-menu-item';
import { projectMenuItem } from './projects-menu-item';

export type MenuItemConfig = {
  key: string;
  label: string;
  path: string;
  icon?: ReactNode;
  requiredPermissions?: string[];
  moduleCode?: string;
};

export const menuConfig: MenuItemConfig[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    path: '/dashboard',
    icon: <DashboardOutlined />,
    requiredPermissions: ['dashboard.read'],
    moduleCode: 'core',
  },
  {
    key: 'users',
    label: '用户管理',
    path: '/users',
    icon: <TeamOutlined />,
    requiredPermissions: ['users.read'],
    moduleCode: 'users',
  },
  projectMenuItem,
  hrMenuItem,
  {
    key: 'module-settings',
    label: '模块管理',
    path: '/settings/modules',
    icon: <AppstoreOutlined />,
    requiredPermissions: ['module.read'],
    moduleCode: 'core',
  },
  {
    key: 'rbac-settings',
    label: '权限配置',
    path: '/settings/rbac',
    icon: <SafetyCertificateOutlined />,
    requiredPermissions: ['rbac.read'],
    moduleCode: 'core',
  },
  {
    key: 'theme-settings',
    label: '主题设置',
    path: '/settings/theme',
    icon: <BgColorsOutlined />,
    requiredPermissions: ['dashboard.read'],
    moduleCode: 'core',
  },
  auditMenuItem,
];

export function buildMenuByAccess(permissions: string[] = [], modules: string[] = []) {
  const permissionSet = new Set(permissions);
  const moduleSet = new Set(modules);

  return menuConfig.filter((item) => {
    if (item.moduleCode && !moduleSet.has(item.moduleCode)) {
      return false;
    }

    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    return item.requiredPermissions.every((perm) => permissionSet.has(perm));
  });
}
