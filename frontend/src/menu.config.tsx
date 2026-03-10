import { AppstoreOutlined, BgColorsOutlined, DashboardOutlined, TeamOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { auditMenuItem } from './audit/audit-menu-item';
import { hrMenuItem } from './hr-menu-item';
import { projectMenuItem } from './projects-menu-item';

export type AppRole = 'ADMIN' | 'USER';

export type MenuItemConfig = {
  key: string;
  label: string;
  path: string;
  icon?: ReactNode;
  roles?: AppRole[];
  moduleCode?: string;
};

export const menuConfig: MenuItemConfig[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    path: '/dashboard',
    icon: <DashboardOutlined />,
    roles: ['ADMIN', 'USER'],
    moduleCode: 'core',
  },
  {
    key: 'users',
    label: '用户管理',
    path: '/users',
    icon: <TeamOutlined />,
    roles: ['ADMIN'],
    moduleCode: 'users',
  },
  projectMenuItem,
  hrMenuItem,
  {
    key: 'module-settings',
    label: '模块管理',
    path: '/settings/modules',
    icon: <AppstoreOutlined />,
    roles: ['ADMIN'],
    moduleCode: 'core',
  },
  {
    key: 'theme-settings',
    label: '主题设置',
    path: '/settings/theme',
    icon: <BgColorsOutlined />,
    roles: ['ADMIN', 'USER'],
    moduleCode: 'core',
  },
  auditMenuItem,
];

export function buildMenuByRole(role?: AppRole, enabledModules?: string[]) {
  return menuConfig.filter((item) => {
    if (item.moduleCode && enabledModules && !enabledModules.includes(item.moduleCode)) {
      return false;
    }

    if (!item.roles || item.roles.length === 0) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });
}
