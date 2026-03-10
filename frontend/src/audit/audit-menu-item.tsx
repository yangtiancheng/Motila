import { FileSearchOutlined } from '@ant-design/icons';
import type { MenuItemConfig } from '../menu.config';

export const auditMenuItem: MenuItemConfig = {
  key: 'audit-logs',
  label: '审计日志',
  path: '/audit-logs',
  icon: <FileSearchOutlined />,
  requiredPermissions: ['audit.read'],
  moduleCode: 'audit',
};
