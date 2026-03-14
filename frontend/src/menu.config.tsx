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
    key: 'blog',
    label: '博客管理',
    icon: <DeploymentUnitOutlined />,
    moduleCode: 'blog',
    sortOrder: 25,
  },
  {
    key: 'blog-categories',
    label: '博客分类',
    path: '/blog/categories',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['blog-category.read'],
    moduleCode: 'blog',
    parentKey: 'blog',
    sortOrder: 10,
  },
  {
    key: 'blog-posts',
    label: '博客文章',
    path: '/blog/posts',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['blog-post.read'],
    moduleCode: 'blog',
    parentKey: 'blog',
    sortOrder: 20,
  },
  {
    key: 'login-history',
    label: '登录历史',
    path: '/login-history',
    icon: <FileSearchOutlined />,
    requiredPermissions: ['login-history.read'],
    moduleCode: 'login-history',
    sortOrder: 26,
  },
  {
    key: 'salary',
    label: '薪酬管理',
    path: '/salary',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['salary.read'],
    moduleCode: 'salary',
    sortOrder: 27,
  },
  {
    key: 'procurement',
    label: '采购管理',
    path: '/procurement',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['procurement.read'],
    moduleCode: 'procurement',
    sortOrder: 28,
  },
  {
    key: 'inventory',
    label: '库存管理',
    path: '/inventory',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['inventory.read'],
    moduleCode: 'inventory',
    sortOrder: 29,
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
    key: 'asset',
    label: '资产管理',
    path: '/asset',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['asset.read'],
    moduleCode: 'asset',
    sortOrder: 31,
  },
  {
    key: 'ledger',
    label: '总账管理',
    path: '/ledger',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['ledger.read'],
    moduleCode: 'ledger',
    sortOrder: 32,
  },
  {
    key: 'department-cost',
    label: '科室成本',
    path: '/department-cost',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['department-cost.read'],
    moduleCode: 'department-cost',
    sortOrder: 33,
  },
  {
    key: 'project-cost',
    label: '项目成本',
    path: '/project-cost',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['project-cost.read'],
    moduleCode: 'project-cost',
    sortOrder: 34,
  },
  {
    key: 'disease-cost',
    label: '病种成本',
    path: '/disease-cost',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['disease-cost.read'],
    moduleCode: 'disease-cost',
    sortOrder: 35,
  },
  {
    key: 'income',
    label: '收入管理',
    path: '/income',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['income.read'],
    moduleCode: 'income',
    sortOrder: 36,
  },
  {
    key: 'budget',
    label: '预算管理',
    path: '/budget',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['budget.read'],
    moduleCode: 'budget',
    sortOrder: 37,
  },
  {
    key: 'performance',
    label: '绩效管理',
    path: '/performance',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['performance.read'],
    moduleCode: 'performance',
    sortOrder: 38,
  },
  {
    key: 'mail-center',
    label: '发件中心',
    path: '/emails/send',
    icon: <DeploymentUnitOutlined />,
    requiredPermissions: ['dashboard.read'],
    moduleCode: 'core',
    sortOrder: 39,
  },
  {
    key: 'settings',
    label: '配置',
    icon: <SettingOutlined />,
    sortOrder: 40,
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
    key: 'risk-control',
    label: '风控配置',
    path: '/settings/risk-control',
    icon: <SafetyCertificateOutlined />,
    requiredPermissions: ['risk.read'],
    moduleCode: 'risk-control',
    parentKey: 'settings',
    sortOrder: 55,
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

  if (aOrder === bOrder) {
    return a.label.localeCompare(b.label, 'zh-CN');
  }

  return aOrder - bOrder;
};

const cloneItem = (item: MenuItemConfig): MenuItemConfig => ({
  ...item,
  children: item.children ? item.children.map((child) => cloneItem(child)) : undefined,
});

const buildMenuTree = () => {
  const allItems = menuConfigRaw.map((item) => cloneItem(item));
  const itemMap = new Map(allItems.map((item) => [item.key, item]));
  const roots: MenuItemConfig[] = [];

  allItems.forEach((item) => {
    if (item.parentKey) {
      const parent = itemMap.get(item.parentKey);
      if (!parent) {
        roots.push(item);
        return;
      }
      parent.children = parent.children ?? [];
      parent.children.push(item);
      return;
    }
    roots.push(item);
  });

  const sortRecursive = (items: MenuItemConfig[]) => {
    items.sort(sortItems);
    items.forEach((item) => {
      if (item.children?.length) sortRecursive(item.children);
    });
  };

  sortRecursive(roots);
  return roots;
};

const menuConfig = buildMenuTree();

const hasAllPermissions = (item: MenuItemConfig, permissionSet: Set<string>) => {
  if (!item.requiredPermissions?.length) return true;
  return item.requiredPermissions.every((permission) => permissionSet.has(permission));
};

const isModuleEnabled = (item: MenuItemConfig, moduleSet: Set<string>) => {
  if (!item.moduleCode) return true;
  return moduleSet.has(item.moduleCode);
};

const filterMenuItems = (items: MenuItemConfig[], permissionSet: Set<string>, moduleSet: Set<string>): MenuItemConfig[] => {
  return items
    .map((item) => {
      const filteredChildren = item.children ? filterMenuItems(item.children, permissionSet, moduleSet) : undefined;
      const selfVisible = hasAllPermissions(item, permissionSet) && isModuleEnabled(item, moduleSet);

      if (filteredChildren?.length) {
        return {
          ...item,
          children: filteredChildren,
        };
      }

      if (!selfVisible) return null;

      return {
        ...item,
        children: undefined,
      };
    })
    .filter((item): item is MenuItemConfig => Boolean(item));
};

export const buildMenuByAccess = (permissions: string[], enabledModuleCodes: string[]) => {
  const permissionSet = new Set(permissions);
  const moduleSet = new Set(enabledModuleCodes);
  return filterMenuItems(menuConfig, permissionSet, moduleSet);
};

export const navigationMenuConfig = menuConfig;
