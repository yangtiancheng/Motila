import {
  AppstoreOutlined,
  BgColorsOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  FileSearchOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export type MenuItemConfig = {
  key: string;
  label: string;
  path?: string;
  icon?: ReactNode;
  requiredPermissions?: string[];
  moduleCode?: string;
  parentKey?: string;
  sortOrder?: number;
  children?: MenuItemConfig[];
};

const menuConfigRaw: MenuItemConfig[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    path: '/dashboard',
    icon: <DashboardOutlined />,
    requiredPermissions: ['dashboard.read'],
    moduleCode: 'core',
    sortOrder: 10,
  },
  {
    key: 'projects',
    label: '项目管理',
    path: '/projects',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['project.read'],
    moduleCode: 'project',
    sortOrder: 20,
  },
  {
    key: 'hr-employees',
    label: '人员管理',
    path: '/hr/employees',
    icon: <IdcardOutlined />,
    requiredPermissions: ['hr.read'],
    moduleCode: 'hr',
    sortOrder: 30,
  },
  {
    key: 'mail-center',
    label: '发件中心',
    path: '/emails/send',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['dashboard.read'],
    moduleCode: 'core',
    sortOrder: 35,
  },
  {
    key: 'users',
    label: '用户管理',
    path: '/users',
    icon: <TeamOutlined />,
    requiredPermissions: ['users.read'],
    moduleCode: 'users',
    parentKey: 'settings',
    sortOrder: 10,
  },
  {
    key: 'system-settings',
    label: '系统配置',
    path: '/settings/system',
    icon: <SettingOutlined />,
    requiredPermissions: ['settings.read'],
    moduleCode: 'core',
    parentKey: 'settings',
    sortOrder: 20,
  },
  {
    key: 'module-settings',
    label: '模块管理',
    path: '/settings/modules',
    icon: <AppstoreOutlined />,
    requiredPermissions: ['module.read'],
    moduleCode: 'core',
    parentKey: 'settings',
    sortOrder: 30,
  },
  {
    key: 'rbac-settings',
    label: '权限配置',
    path: '/settings/rbac',
    icon: <SafetyCertificateOutlined />,
    requiredPermissions: ['rbac.read'],
    moduleCode: 'core',
    parentKey: 'settings',
    sortOrder: 40,
  },
  {
    key: 'theme-settings',
    label: '主题设置',
    path: '/settings/theme',
    icon: <BgColorsOutlined />,
    requiredPermissions: ['dashboard.read'],
    moduleCode: 'core',
    parentKey: 'settings',
    sortOrder: 50,
  },
  {
    key: 'audit-logs',
    label: '审计日志',
    path: '/audit-logs',
    icon: <FileSearchOutlined />,
    requiredPermissions: ['audit.read'],
    moduleCode: 'audit',
    parentKey: 'settings',
    sortOrder: 60,
  },
];

const sortItems = (a: MenuItemConfig, b: MenuItemConfig) => {
  const aOrder = a.sortOrder ?? 9999;
  const bOrder = b.sortOrder ?? 9999;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return a.key.localeCompare(b.key);
};

function buildMenuTree(items: MenuItemConfig[]) {
  const bucket = new Map<string | undefined, MenuItemConfig[]>();

  items.forEach((item) => {
    const key = item.parentKey;
    const list = bucket.get(key) ?? [];
    list.push({ ...item, children: undefined });
    bucket.set(key, list);
  });

  const walk = (parentKey?: string): MenuItemConfig[] => {
    const list = [...(bucket.get(parentKey) ?? [])].sort(sortItems);
    return list.map((item) => {
      const children = walk(item.key);
      return {
        ...item,
        children: children.length > 0 ? children : undefined,
      };
    });
  };

  return walk(undefined);
}

export const menuConfig: MenuItemConfig[] = buildMenuTree(menuConfigRaw);

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
