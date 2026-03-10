import { IdcardOutlined } from '@ant-design/icons';
import type { MenuItemConfig } from './menu.config';

export const hrMenuItem: MenuItemConfig = {
  key: 'hr-employees',
  label: '人员管理',
  path: '/hr/employees',
  icon: <IdcardOutlined />,
  roles: ['ADMIN'],
  moduleCode: 'hr',
};
