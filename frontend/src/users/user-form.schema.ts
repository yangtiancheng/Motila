import { applySchemaTransforms, type SchemaField } from '../shared/form/schema.types';

export type UserFormValues = {
  username: string;
  email: string;
  name: string;
  avatarImage?: string;
  avatarUrl?: string;
  password?: string;
  role: 'ADMIN' | 'USER';
};

export function getUserFormSchema(isEdit: boolean): SchemaField<UserFormValues>[] {
  return [
    {
      name: 'username',
      label: '用户名',
      type: 'input',
      required: true,
      min: 4,
      message: '用户名至少4位，仅支持字母数字下划线',
    },
    {
      name: 'email',
      label: '邮箱',
      type: 'input',
      required: true,
      message: '请输入正确邮箱',
    },
    {
      name: 'name',
      label: '昵称',
      type: 'input',
      required: true,
      min: 2,
      message: '昵称至少2位',
    },
    {
      name: 'avatarImage',
      label: '头像上传',
      type: 'upload',
      required: false,
      placeholder: '也可粘贴 data:image/...;base64,...',
      accept: 'image/png,image/jpeg,image/webp',
      previewFallbackName: 'avatarUrl',
      colSpan: 2,
    },
    {
      name: 'avatarUrl',
      label: '头像地址',
      type: 'input',
      required: false,
      placeholder: 'https://example.com/avatar.png',
      colSpan: 2,
    },
    {
      name: 'password',
      label: '密码',
      type: 'password',
      required: !isEdit,
      min: 1,
      message: '密码不能为空',
      placeholder: isEdit ? '留空则不修改密码' : '请输入密码',
      visibleWhen: () => true,
    },
    {
      name: 'role',
      label: '角色',
      type: 'select',
      required: true,
      options: [
        { label: 'USER', value: 'USER' },
        { label: 'ADMIN', value: 'ADMIN' },
      ],
    },
  ];
}

export function normalizeUserFormValues(values: UserFormValues): UserFormValues {
  return applySchemaTransforms(values, [
    (input) => ({
      ...input,
      username: input.username.trim(),
      email: input.email.trim(),
      name: input.name.trim(),
      avatarImage: input.avatarImage?.trim() ? input.avatarImage.trim() : undefined,
      avatarUrl: input.avatarUrl?.trim() ? input.avatarUrl.trim() : undefined,
    }),
    (input) => {
      if (!input.password || !input.password.trim()) {
        return { ...input, password: undefined };
      }
      return { ...input, password: input.password.trim() };
    },
  ]);
}
