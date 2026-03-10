import { DeploymentUnitOutlined } from '@ant-design/icons';
import type { MenuItemConfig } from './menu.config';

export const projectMenuItem: MenuItemConfig = {
  key: 'projects',
  label: '项目管理',
  path: '/projects',
  icon: <DeploymentUnitOutlined />,
  requiredPermissions: ['project.read'],
  moduleCode: 'project',
};
