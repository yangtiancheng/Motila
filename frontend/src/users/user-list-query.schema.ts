import type { QueryField } from '../shared/list/query.types';

type UserRole = 'ADMIN' | 'USER';

export type UserListQueryValues = {
  keyword: string;
  role?: UserRole;
};

export const userListQueryInitialValues: UserListQueryValues = {
  keyword: '',
  role: undefined,
};

export const userListQueryFields: QueryField<UserListQueryValues>[] = [
  {
    name: 'keyword',
    type: 'input',
    placeholder: '按用户名/昵称/邮箱搜索',
    width: 240,
  },
  {
    name: 'role',
    type: 'select',
    placeholder: '角色筛选',
    width: 140,
    options: [
      { label: 'USER', value: 'USER' },
      { label: 'ADMIN', value: 'ADMIN' },
    ],
  },
];
