import { BgColorsOutlined, DashboardOutlined, TeamOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { auditMenuItem } from './audit/audit-menu-item';

export type AppRole = 'ADMIN' | 'USER';

export type MenuItemConfig = {
  key: string;
  label: string;
  path: string;
  icon?: ReactNode;
  roles?: AppRole[];
};

export const menuConfig: MenuItemConfig[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    path: '/dashboard',
    icon: <DashboardOutlined />,
    roles: ['ADMIN', 'USER'],
  },
  {
    key: 'users',
    label: '用户管理',
    path: '/users',
    icon: <TeamOutlined />,
    roles: ['ADMIN'],
  },
  {
    key: 'theme-settings',
    label: '主题设置',
    path: '/settings/theme',
    icon: <BgColorsOutlined />,
    roles: ['ADMIN', 'USER'],
  },
  auditMenuItem,
];

export function buildMenuByRole(role?: AppRole) {
  return menuConfig.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });
}
