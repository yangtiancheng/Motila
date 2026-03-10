import { AppstoreOutlined, BgColorsOutlined, DashboardOutlined, SafetyCertificateOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { auditMenuItem } from './audit/audit-menu-item';
import { hrMenuItem } from './hr-menu-item';
import { projectMenuItem } from './projects-menu-item';

export type MenuItemConfig = {
  key: string;
  label: string;
  path?: string;
  icon?: ReactNode;
  requiredPermissions?: string[];
  moduleCode?: string;
  children?: MenuItemConfig[];
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
    key: 'settings',
    label: '配置',
    icon: <SettingOutlined />,
    children: [
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
    ],
  },
];

export function buildMenuByAccess(permissions: string[] = [], modules: string[] = []) {
  const permissionSet = new Set(permissions);
  const moduleSet = new Set(modules);

  const applyFilter = (item: MenuItemConfig): MenuItemConfig | null => {
    if (item.children && item.children.length > 0) {
      const nextChildren = item.children.map(applyFilter).filter(Boolean) as MenuItemConfig[];
      if (nextChildren.length === 0) return null;
      return { ...item, children: nextChildren };
    }

    if (item.moduleCode && !moduleSet.has(item.moduleCode)) {
      return null;
    }

    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return item;
    return item.requiredPermissions.every((perm) => permissionSet.has(perm)) ? item : null;
  };

  return menuConfig.map(applyFilter).filter(Boolean) as MenuItemConfig[];
}
