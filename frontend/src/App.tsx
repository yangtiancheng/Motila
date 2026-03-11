import {
  App as AntdApp,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  ColorPicker,
  ConfigProvider,
  Dropdown,
  Drawer,
  Form,
  Grid,
  Input,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Switch,
  Upload,
  Avatar,
} from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuditLogsPage } from './audit/AuditLogsPage';
import { buildMenuByAccess } from './menu.config';
import { SchemaForm } from './shared/form/SchemaForm';
import { SchemaQueryBar } from './shared/list/SchemaQueryBar';
import { buildListQuery } from './shared/list/query.types';
import { useListState } from './shared/list/useListState';
import {
  DEFAULT_BRANDING,
  getInitialBranding,
  getInitialSkin,
  getThemeBySkin,
  resolveEffectiveSkin,
  skinOptions,
  type BrandingConfig,
  type SkinMode,
} from './theme-skins';
import { getUserFormSchema, normalizeUserFormValues } from './users/user-form.schema';
import {
  userListQueryFields,
  userListQueryInitialValues,
  type UserListQueryValues,
} from './users/user-list-query.schema';
import './App.css';

const API_BASE = '/api';

type UserRole = 'ADMIN' | 'USER';

type AuthUser = {
  id: string;
  username?: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  avatarImage?: string;
  role: UserRole;
  roles: string[];
  permissions: string[];
  modules: string[];
};

type UserItem = AuthUser & {
  createdAt: string;
  updatedAt: string;
  roles?: string[];
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type ListUsersResponse = {
  data: UserItem[];
  total: number;
  page: number;
  pageSize: number;
};


type SystemConfigItem = {
  id: string;
  name: string;
  title: string;
  logoUrl?: string | null;
  logoImage?: string | null;
  footerText?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type EmailProvider = 'QQ' | 'NETEASE_163' | 'CUSTOM';

type MyEmailConfig = {
  id: string;
  provider: EmailProvider;
  emailAddress: string;
  authType: 'authorization_code' | 'password';
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  popHost?: string | null;
  popPort?: number | null;
  popSecure?: boolean | null;
  enabled: boolean;
  secretMasked?: string;
  lastTestAt?: string | null;
  lastTestStatus?: string | null;
  lastTestMessage?: string | null;
};

type ProviderDefaultsResponse = {
  QQ: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    imapHost: string;
    imapPort: number;
    imapSecure: boolean;
  };
  NETEASE_163: {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    imapHost: string;
    imapPort: number;
    imapSecure: boolean;
  };
};

type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'DONE' | 'ARCHIVED';

type ProjectItem = {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

type ListProjectsResponse = {
  data: ProjectItem[];
  total: number;
  page: number;
  pageSize: number;
};

type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

type EmployeeItem = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  title?: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
};

type ListEmployeesResponse = {
  data: EmployeeItem[];
  total: number;
  page: number;
  pageSize: number;
};

type ListRolesResponse = RoleSummary[];

type ListPermissionsResponse = PermissionItem[];

type ModuleStatus = 'NOT_INSTALLED' | 'INSTALLED' | 'ENABLED' | 'DISABLED';

type ModuleItem = {
  code: string;
  name: string;
  description?: string;
  status: ModuleStatus;
  isCore: boolean;
  sortOrder: number;
  dependencies: Array<{ dependsOnCode: string }>;
  dependents: Array<{ moduleCode: string }>;
};

type RoleSummary = {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
  modules: string[];
};

type RoleFormValues = {
  userIds?: string[];
  code: string;
  name: string;
  description?: string;
};

type PermissionItem = {
  code: string;
  name: string;
  moduleCode: string;
};

function parseError(error: unknown): string {
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string | string[] };
      const msg = parsed.message;
      if (Array.isArray(msg)) return msg.join('；');
      if (typeof msg === 'string') return msg;
    } catch {
      return error.message;
    }
    return error.message;
  }
  return '操作失败';
}

async function api<T>(path: string, init?: RequestInit, withAuth = false): Promise<T> {
  const token = localStorage.getItem('motila_token');

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(withAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `请求失败: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`响应解析失败: ${response.status}`);
  }
}

function renderFooterContent(text: string): React.ReactNode {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <a key={`${match[2]}-${match.index}`} href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </a>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function DashboardPage({ user }: { user: AuthUser }) {
  return (
    <Card>
      <Typography.Title level={4}>欢迎，{user.name}</Typography.Title>
      <Typography.Paragraph>
        这是 Sprint 1 仪表盘骨架页。后续会在这里汇总核心指标、待办和快捷入口。
      </Typography.Paragraph>
    </Card>
  );
}

function UserFormCard({
  title,
  initialValues,
  loading,
  submitText,
  onSubmit,
}: {
  title: string;
  initialValues?: Partial<{
    username: string;
    email?: string;
    name: string;
    avatarImage: string;
    avatarUrl: string;
    password: string;
    role: UserRole;
  }>;
  loading: boolean;
  submitText: string;
  onSubmit: (values: {
    username: string;
    email?: string;
    name: string;
    avatarImage?: string;
    avatarUrl?: string;
    password?: string;
    role: UserRole;
  }) => Promise<void>;
}) {
  const [form] = Form.useForm<{
    username: string;
    email?: string;
    name: string;
    avatarImage?: string;
    avatarUrl?: string;
    password?: string;
    role: UserRole;
  }>();

  useEffect(() => {
    form.setFieldsValue({
      role: 'USER',
      ...initialValues,
    });
  }, [form, initialValues]);

  return (
    <Card title={title}>
      <SchemaForm
        form={form}
        fields={getUserFormSchema(title.includes('编辑'))}
        columns={4}
        loading={loading}
        submitText={submitText}
        onFinish={async (values: {
          username: string;
          email?: string;
          name: string;
          avatarImage?: string;
          avatarUrl?: string;
          password?: string;
          role: UserRole;
        }) => {
          await onSubmit(values);
        }}
      />
    </Card>
  );
}

function UsersListPage({
  currentUser,
  onChanged,
  canCreate,
  canUpdate,
  canDelete,
  canAssignRoles,
  canReadRoles,
}: {
  currentUser: AuthUser;
  onChanged: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssignRoles: boolean;
  canReadRoles: boolean;
}) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();

  const { filters, page, pageSize, setPage, setPageSize, applyFilters } = useListState<UserListQueryValues>(
    userListQueryInitialValues,
  );
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<UserItem[]>([]);

  const [roleOptions, setRoleOptions] = useState<RoleSummary[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  async function fetchRows() {
    setLoading(true);
    try {
      const queryString = buildListQuery(
        { page, pageSize },
        {
          keyword: filters.keyword?.trim(),
          role: filters.role,
        },
      );

      const res = await api<ListUsersResponse>(`/users?${queryString}`, undefined, true);
      setRows(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  }

  const fetchRoles = async () => {
    if (!canReadRoles) return;
    setRoleLoading(true);
    try {
      const data = await api<ListRolesResponse>('/rbac/roles', undefined, true);
      setRoleOptions(data);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setRoleLoading(false);
    }
  };

  const openAssignRoles = async (record: UserItem) => {
    if (!canAssignRoles) return;
    setSelectedUser(record);
    setSelectedRoles(record.roles ?? []);
    setAssignOpen(true);
    await fetchRoles();
  };

  const submitAssignRoles = async () => {
    if (!selectedUser) return;
    setAssigning(true);
    try {
      await api(`/rbac/users/${selectedUser.id}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleCodes: selectedRoles }),
      }, true);
      message.success('角色分配已更新');
      setAssignOpen(false);
      setSelectedUser(null);
      void fetchRows();
      onChanged();
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters]);

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      width: 72,
      render: (_: unknown, record: UserItem) => (
        <Avatar src={record.avatarImage || record.avatarUrl}>{(record.name ?? record.email)?.slice(0, 1)}</Avatar>
      ),
    },
    { title: '昵称', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (_: UserRole, record: UserItem) => {
        const tags = record.roles && record.roles.length ? record.roles : [record.role];
        return (
          <Space size={4} wrap>
            {tags.map((role) => (
              <Tag key={role} color={role === 'SUPER_ADMIN' ? 'gold' : 'blue'}>
                {role}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: UserItem) => {
        const disableSelf = currentUser.id === record.id;

        return (
          <Space>
            <Button size="small" onClick={() => navigate(`/users/${record.id}`)}>
              详情
            </Button>
            <Button size="small" onClick={() => navigate(`/users/${record.id}/edit`)} disabled={!canUpdate}>
              编辑
            </Button>
            <Button size="small" onClick={() => void openAssignRoles(record)} disabled={!canAssignRoles}>
              分配角色
            </Button>
            <Popconfirm
              title="确认删除该用户？"
              okText="删除"
              cancelText="取消"
              disabled={disableSelf || !canDelete}
              onConfirm={async () => {
                try {
                  await api(`/users/${record.id}`, { method: 'DELETE' }, true);
                  message.success('删除成功');
                  fetchRows();
                  onChanged();
                } catch (error) {
                  message.error(parseError(error));
                }
              }}
            >
              <Button size="small" danger disabled={disableSelf || !canDelete}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card title="用户管理">
        <Space wrap>
          <SchemaQueryBar<UserListQueryValues>
            fields={userListQueryFields}
            initialValues={filters}
            onSearch={(values) => {
              applyFilters(values);
            }}
            onReset={(values) => {
              applyFilters(values);
            }}
            showActions={false}
            autoSubmitOnChange
          />
          <Button type="primary" onClick={() => navigate('/users/create')} disabled={!canCreate}>新建用户</Button>
        </Space>
      </Card>

      <Card title="用户列表">
        <Table<UserItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          size="middle"
        />
      </Card>

      <Modal
        title={`分配角色${selectedUser ? `：${selectedUser.name ?? selectedUser.email}` : ''}`}
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={() => void submitAssignRoles()}
        confirmLoading={assigning}
        okButtonProps={{ disabled: !canAssignRoles }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Typography.Text type="secondary">请选择要授予的角色</Typography.Text>
          <Checkbox.Group
            options={roleOptions.map((role) => ({
              label: `${role.name} (${role.code})`,
              value: role.code,
            }))}
            value={selectedRoles}
            onChange={(values) => setSelectedRoles(values as string[])}
          />
          {roleLoading ? <Typography.Text>加载角色中...</Typography.Text> : null}
        </Space>
      </Modal>
    </Space>
  );
}

function UserCreatePage() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <UserFormCard
      title="创建用户"
      loading={loading}
      submitText="创建"
      onSubmit={async (values) => {
        setLoading(true);
        try {
          const payload = normalizeUserFormValues(values);
          await api('/users', { method: 'POST', body: JSON.stringify(payload) }, true);
          message.success('用户创建成功');
          navigate('/users');
        } catch (error) {
          message.error(parseError(error));
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}

function UserEditPage() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<Partial<{
    username: string;
    email: string;
    name: string;
    avatarImage?: string;
    avatarUrl?: string;
    role: UserRole;
  }>>({});

  useEffect(() => {
    if (!id) return;
    api<UserItem>(`/users/${id}`, undefined, true)
      .then((res) =>
        setInitial({
          username: res.username,
          email: res.email,
          name: res.name,
          avatarImage: res.avatarImage,
          avatarUrl: res.avatarUrl,
          role: res.role,
        }),
      )
      .catch((error) => message.error(parseError(error)));
  }, [id, message]);

  return (
    <UserFormCard
      title="编辑用户"
      loading={loading}
      initialValues={initial}
      submitText="保存"
      onSubmit={async (values) => {
        if (!id) return;
        setLoading(true);
        try {
          const payload = normalizeUserFormValues(values);
          await api(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true);
          message.success('用户更新成功');
          navigate('/users');
        } catch (error) {
          message.error(parseError(error));
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}

function UserShowPage() {
  const { message } = AntdApp.useApp();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<UserItem | null>(null);

  useEffect(() => {
    if (!id) return;
    api<UserItem>(`/users/${id}`, undefined, true)
      .then(setData)
      .catch((error) => message.error(parseError(error)));
  }, [id, message]);

  if (!data) return <Card loading />;

  return (
    <Card title="用户详情">
      <Space direction="vertical" size={8}>
        <Avatar src={data.avatarImage || data.avatarUrl} size={64}>{(data.name ?? data.email).slice(0, 1)}</Avatar>
        <Typography.Text>昵称：{data.name}</Typography.Text>
        <Typography.Text>邮箱：{data.email}</Typography.Text>
        <Typography.Text>角色：{data.role}</Typography.Text>
        <Typography.Text>创建时间：{new Date(data.createdAt).toLocaleString()}</Typography.Text>
        <Typography.Text>更新时间：{new Date(data.updatedAt).toLocaleString()}</Typography.Text>
      </Space>
    </Card>
  );
}

function SystemConfigPage({ canUpdate, onConfigApplied }: { canUpdate: boolean; onConfigApplied: () => void }) {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<SystemConfigItem[]>([]);
  const [editing, setEditing] = useState<SystemConfigItem | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form] = Form.useForm<{
    name: string;
    title: string;
    logoUrl?: string;
    logoImage?: string;
    footerText?: string;
    isActive?: boolean;
  }>();

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await api<SystemConfigItem[]>('/system-configs', undefined, true);
      setRows(data);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ name: '', title: '', logoUrl: '', logoImage: '', footerText: '', isActive: false });
    setFormVisible(true);
  };

  const openEdit = (record: SystemConfigItem) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      title: record.title,
      logoUrl: record.logoUrl ?? '',
      logoImage: record.logoImage ?? '',
      footerText: record.footerText ?? '',
      isActive: record.isActive,
    });
    setFormVisible(true);
  };

  const onUploadLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      form.setFieldValue('logoImage', String(reader.result ?? ''));
      message.success('Logo 上传成功');
    };
    reader.onerror = () => {
      message.error('Logo 上传失败');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const clearLogoImage = () => {
    form.setFieldValue('logoImage', '');
    message.success('已移除 Logo 图片');
  };

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      const basePayload = {
        ...values,
        name: values.name?.trim(),
        title: values.title?.trim(),
        logoUrl: values.logoUrl?.trim() ? values.logoUrl.trim() : undefined,
        logoImage: values.logoImage?.trim() ? values.logoImage.trim() : null,
        footerText: values.footerText?.trim() ? values.footerText.trim() : undefined,
      };
      setSaving(true);
      if (editing) {
        const payload = {
          ...basePayload,
          removeLogoImage: !values.logoImage?.trim(),
        };
        await api(`/system-configs/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }, true);
        message.success('配置已更新');
      } else {
        await api('/system-configs', {
          method: 'POST',
          body: JSON.stringify(basePayload),
        }, true);
        message.success('配置已创建');
      }
      setFormVisible(false);
      setEditing(null);
      await fetchRows();
      onConfigApplied();
    } catch (error) {
      if (error instanceof Error && error.message.includes('validate')) return;
      message.error(parseError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card
        title="系统配置"
        extra={
          <Button type="primary" onClick={openCreate} disabled={!canUpdate}>
            新建配置
          </Button>
        }
      >
        <Table<SystemConfigItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={[
            { title: '系统名称', dataIndex: 'name' },
            { title: '系统标题', dataIndex: 'title' },
            { title: '系统Logo(上传)', dataIndex: 'logoImage', render: (value?: string) => (value ? '已上传' : '-') },
            { title: '系统Logo(URL)', dataIndex: 'logoUrl', render: (value?: string) => value || '-' },
            { title: 'Footer文字', dataIndex: 'footerText', render: (value?: string) => value || '-' },
            {
              title: '有效',
              dataIndex: 'isActive',
              render: (value: boolean) => (value ? '是' : '否'),
            },
            {
              title: '操作',
              render: (_, record) => (
                <Space>
                  <Button size="small" onClick={() => openEdit(record)} disabled={!canUpdate}>
                    编辑
                  </Button>
                  <Popconfirm
                    title="确认删除该配置？"
                    okText="删除"
                    cancelText="取消"
                    disabled={!canUpdate || record.isActive}
                    onConfirm={async () => {
                      try {
                        await api(`/system-configs/${record.id}`, { method: 'DELETE' }, true);
                        message.success('已删除');
                        void fetchRows();
                        onConfigApplied();
                      } catch (error) {
                        message.error(parseError(error));
                      }
                    }}
                  >
                    <Button size="small" danger disabled={!canUpdate || record.isActive}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={false}
        />
      </Card>

      {formVisible ? (
        <Card
          title={editing ? '编辑系统配置' : '新建系统配置'}
          extra={
            <Space>
              <Button
                onClick={() => {
                  setFormVisible(false);
                  setEditing(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" loading={saving} onClick={() => void submitForm()} disabled={!canUpdate}>
                {editing ? '保存修改' : '创建配置'}
              </Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical">
            <Form.Item label="系统名称" name="name" rules={[{ required: true, min: 2 }]}>
              <Input />
            </Form.Item>
            <Form.Item label="系统标题" name="title" rules={[{ required: true, min: 2 }]}>
              <Input />
            </Form.Item>
            <Form.Item label="系统Logo URL" name="logoUrl">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item label="系统Logo 上传" extra="支持 png/jpg/webp，上传后优先于 logoUrl 生效">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Upload beforeUpload={onUploadLogo} showUploadList={false} accept="image/png,image/jpeg,image/webp">
                    <Button>上传图片</Button>
                  </Upload>
                  <Button danger onClick={clearLogoImage}>
                    删除已上传Logo
                  </Button>
                </Space>
                <Form.Item name="logoImage" noStyle>
                  <Input.TextArea rows={3} placeholder="也可粘贴 data:image/...;base64,..." />
                </Form.Item>
              </Space>
            </Form.Item>
            <Form.Item shouldUpdate noStyle>
              {() => {
                const image = form.getFieldValue('logoImage') || form.getFieldValue('logoUrl');
                if (!image) return null;
                return (
                  <Form.Item label="Logo预览">
                    <img
                      src={image}
                      alt="logo-preview"
                      style={{ maxWidth: 220, maxHeight: 72, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 6, padding: 6, background: '#fff' }}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
            <Form.Item label="Footer文字" name="footerText" extra="支持 Markdown 链接格式：[文本](https://example.com)">
              <Input />
            </Form.Item>
            <Form.Item label="有效" name="isActive" valuePropName="checked">
              <Checkbox>启用该配置</Checkbox>
            </Form.Item>
          </Form>
        </Card>
      ) : null}
    </Space>
  );
}

function ThemeSettingsPage({
  skin,
  branding,
  onSkinChange,
  onBrandColorChange,
  onResetBrandColor,
  onExportThemeConfig,
  onImportThemeFile,
  brandingFileInputRef,
}: {
  skin: SkinMode;
  branding: BrandingConfig;
  onSkinChange: (value: SkinMode) => void;
  onBrandColorChange: (hexColor: string) => void;
  onResetBrandColor: () => void;
  onExportThemeConfig: () => void;
  onImportThemeFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  brandingFileInputRef: { current: HTMLInputElement | null };
}) {
  return (
    <Card title="主题设置">
      <div className="theme-settings-grid">
        <div className="theme-settings-row">
          <Typography.Text className="theme-settings-label">皮肤</Typography.Text>
          <div className="theme-settings-control">
            <Select
              value={skin}
              options={skinOptions}
              onChange={(value) => onSkinChange(value as SkinMode)}
              style={{ width: '100%', maxWidth: 260 }}
            />
          </div>
        </div>

        <div className="theme-settings-row">
          <Typography.Text className="theme-settings-label">品牌色</Typography.Text>
          <div className="theme-settings-control theme-settings-inline">
            <ColorPicker
              value={branding.primaryColor}
              onChange={(color) => onBrandColorChange(color.toHexString())}
              showText
            />
            <Button onClick={onResetBrandColor}>重置配色</Button>
          </div>
        </div>

        <div className="theme-settings-row theme-settings-row-actions">
          <Typography.Text className="theme-settings-label">配置文件</Typography.Text>
          <div className="theme-settings-control theme-settings-inline">
            <Button onClick={onExportThemeConfig}>导出主题</Button>
            <Button onClick={() => brandingFileInputRef.current?.click()}>导入主题</Button>
            <input
              ref={brandingFileInputRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(event) => {
                void onImportThemeFile(event);
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RbacSettingsPage({ canUpdate }: { canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingModules, setSavingModules] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalLoading, setRoleModalLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleSummary | null>(null);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [roleForm] = Form.useForm<RoleFormValues>();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assignUsersMode, setAssignUsersMode] = useState(false);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [roleData, permissionData, moduleData] = await Promise.all([
        api<ListRolesResponse>('/rbac/roles', undefined, true),
        api<ListPermissionsResponse>('/rbac/permissions', undefined, true),
        api<ModuleItem[]>('/modules', undefined, true).catch(() => [] as ModuleItem[]),
      ]);
      setRoles(roleData);
      setPermissions(permissionData);
      setModules(moduleData);

      if (!selectedRoleCode && roleData.length > 0) {
        const first = roleData[0];
        setSelectedRoleCode(first.code);
        setSelectedPermissions(first.permissions ?? []);
        setSelectedModules(first.modules ?? []);
      }
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks-exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRoleCode) return;
    const role = roles.find((item) => item.code === selectedRoleCode);
    if (!role) return;
    setSelectedPermissions(role.permissions ?? []);
    setSelectedModules(role.modules ?? []);
  }, [roles, selectedRoleCode]);

  const openCreateRole = () => {
    setEditingRole(null);
    setAssignUsersMode(false);
    roleForm.resetFields();
    setRoleModalOpen(true);
  };

  const openEditRole = (role: RoleSummary) => {
    setEditingRole(role);
    setAssignUsersMode(false);
    roleForm.setFieldsValue({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
    });
    setRoleModalOpen(true);
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api<ListUsersResponse>('/users?page=1&pageSize=0', undefined, true);
      setUsers(data.data);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setUsersLoading(false);
    }
  };

  const openAssignUsers = async (role: RoleSummary) => {
    setEditingRole(role);
    setAssignUsersMode(true);
    if (users.length === 0) {
      await fetchAllUsers();
    }
    const selectedUserIds = users
      .filter((item) => item.roles?.includes(role.code))
      .map((item) => item.id);
    roleForm.setFieldsValue({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      userIds: selectedUserIds,
    });
    setRoleModalOpen(true);
  };

  const submitRoleForm = async () => {
    try {
      setRoleModalLoading(true);

      if (assignUsersMode && editingRole) {
        const userIds = roleForm.getFieldValue('userIds') ?? [];
        await api(`/rbac/roles/${editingRole.code}/users`, {
          method: 'PUT',
          body: JSON.stringify({ userIds }),
        }, true);
        message.success('角色用户已更新');
        setRoleModalOpen(false);
        await refreshAll();
        return;
      }

      const values = await roleForm.validateFields();

      if (editingRole) {
        await api(`/rbac/roles/${editingRole.code}`, {
          method: 'PUT',
          body: JSON.stringify({ name: values.name, description: values.description }),
        }, true);
        message.success('角色已更新');
      } else {
        await api('/rbac/roles', {
          method: 'POST',
          body: JSON.stringify(values),
        }, true);
        message.success('角色已创建');
      }

      setRoleModalOpen(false);
      await refreshAll();
    } catch (error) {
      if (error instanceof Error && error.message.includes('validate')) return;
      message.error(parseError(error));
    } finally {
      setRoleModalLoading(false);
    }
  };

  const deleteRole = async (role: RoleSummary) => {
    try {
      await api(`/rbac/roles/${role.code}`, { method: 'DELETE' }, true);
      message.success('角色已删除');
      if (selectedRoleCode === role.code) {
        setSelectedRoleCode('');
      }
      await refreshAll();
    } catch (error) {
      message.error(parseError(error));
    }
  };

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const perm of permissions) {
      const list = map.get(perm.moduleCode) ?? [];
      list.push(perm);
      map.set(perm.moduleCode, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  const handleSavePermissions = async () => {
    if (!selectedRoleCode) return;
    setSavingPermissions(true);
    try {
      await api(`/rbac/roles/${selectedRoleCode}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionCodes: selectedPermissions }),
      }, true);
      message.success('权限点已更新');
      await refreshAll();
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleSaveModules = async () => {
    if (!selectedRoleCode) return;
    setSavingModules(true);
    try {
      await api(`/rbac/roles/${selectedRoleCode}/modules`, {
        method: 'PUT',
        body: JSON.stringify({ moduleCodes: selectedModules }),
      }, true);
      message.success('模块授权已更新');
      await refreshAll();
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setSavingModules(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card
        title="角色管理"
        loading={loading}
        extra={
          <Button type="primary" onClick={openCreateRole} disabled={!canUpdate}>
            新建角色
          </Button>
        }
      >
        <Table<RoleSummary>
          rowKey="code"
          dataSource={roles}
          pagination={false}
          columns={[
            { title: '角色编码', dataIndex: 'code' },
            { title: '角色名称', dataIndex: 'name' },
            { title: '描述', dataIndex: 'description', render: (value?: string) => value || '-' },
            { title: '用户数', dataIndex: 'userCount' },
            { title: '系统内置', dataIndex: 'isSystem', render: (value: boolean) => (value ? '是' : '否') },
            {
              title: '操作',
              render: (_, role) => (
                <Space>
                  <Button size="small" onClick={() => setSelectedRoleCode(role.code)}>
                    选择
                  </Button>
                  <Button size="small" onClick={() => openEditRole(role)} disabled={!canUpdate || role.isSystem}>
                    编辑
                  </Button>
                  <Button size="small" onClick={() => void openAssignUsers(role)} disabled={!canUpdate}>
                    分配用户
                  </Button>
                  <Popconfirm
                    title="确认删除该角色？"
                    okText="删除"
                    cancelText="取消"
                    disabled={!canUpdate || role.isSystem}
                    onConfirm={() => void deleteRole(role)}
                  >
                    <Button size="small" danger disabled={!canUpdate || role.isSystem}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title="权限点"
        extra={
          <Button type="primary" onClick={() => void handleSavePermissions()} disabled={!canUpdate || !selectedRoleCode} loading={savingPermissions}>
            保存权限点
          </Button>
        }
      >
        {!selectedRoleCode ? (
          <Typography.Text type="secondary">请先选择角色</Typography.Text>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {groupedPermissions.map(([moduleCode, perms]) => (
              <Card key={moduleCode} size="small" title={`模块：${moduleCode}`}>
                <Checkbox.Group
                  value={selectedPermissions}
                  onChange={(values) => setSelectedPermissions(values as string[])}
                  options={perms.map((perm) => ({
                    label: `${perm.name} (${perm.code})`,
                    value: perm.code,
                  }))}
                />
              </Card>
            ))}
          </Space>
        )}
      </Card>

      <Card
        title="模块授权"
        extra={
          <Button type="primary" onClick={() => void handleSaveModules()} disabled={!canUpdate || !selectedRoleCode} loading={savingModules}>
            保存模块授权
          </Button>
        }
      >
        {!selectedRoleCode ? (
          <Typography.Text type="secondary">请先选择角色</Typography.Text>
        ) : (
          <Checkbox.Group
            value={selectedModules}
            onChange={(values) => setSelectedModules(values as string[])}
            options={modules.map((module) => ({
              label: `${module.name} (${module.code})`,
              value: module.code,
            }))}
          />
        )}
      </Card>

      <Modal
        title={assignUsersMode ? '分配用户' : editingRole ? '编辑角色' : '新建角色'}
        open={roleModalOpen}
        onCancel={() => setRoleModalOpen(false)}
        onOk={() => void submitRoleForm()}
        okText={assignUsersMode ? '保存' : editingRole ? '保存' : '创建'}
        confirmLoading={roleModalLoading}
        okButtonProps={{ disabled: !canUpdate }}
        cancelText="取消"
      >
        <Form form={roleForm} layout="vertical">
          {assignUsersMode ? (
            <Form.Item label="分配用户" name="userIds">
              <Select
                mode="multiple"
                placeholder="选择用户"
                loading={usersLoading}
                optionFilterProp="label"
                options={users.map((user) => ({
                  value: user.id,
                  label: user.name ? user.name + ' (' + user.username + ')' : user.username,
                }))}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                label="角色编码"
                name="code"
                rules={[
                  { required: true, message: '请输入角色编码' },
                  { pattern: /^[A-Z][A-Z0-9_]{1,30}$/, message: '仅支持大写字母/数字/下划线，且以字母开头' },
                ]}
              >
                <Input placeholder="例如：SALES_MANAGER" disabled={!!editingRole} />
              </Form.Item>
              <Form.Item
                label="角色名称"
                name="name"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="例如：销售经理" />
              </Form.Item>
              <Form.Item label="描述" name="description">
                <Input.TextArea rows={3} placeholder="可选" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Space>
  );
}

function ProfilePage({ user }: { user: AuthUser }) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<{
    provider: EmailProvider;
    emailAddress: string;
    authType: 'authorization_code' | 'password';
    secret?: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    imapHost: string;
    imapPort: number;
    imapSecure: boolean;
    popHost?: string;
    popPort?: number;
    popSecure?: boolean;
    enabled: boolean;
  }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [providerDefaults, setProviderDefaults] = useState<ProviderDefaultsResponse | null>(null);
  const [secretMasked, setSecretMasked] = useState<string>('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm] = Form.useForm<{
    username?: string;
    name?: string;
    avatarUrl?: string;
    avatarImage?: string;
  }>();

  const applyProviderDefaults = (provider: EmailProvider) => {
    if (!providerDefaults) return;
    if (provider === 'QQ' || provider === 'NETEASE_163') {
      const defaults = providerDefaults[provider];
      form.setFieldsValue({
        smtpHost: defaults.smtpHost,
        smtpPort: defaults.smtpPort,
        smtpSecure: defaults.smtpSecure,
        imapHost: defaults.imapHost,
        imapPort: defaults.imapPort,
        imapSecure: defaults.imapSecure,
      });
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const [defaults, config] = await Promise.all([
        api<ProviderDefaultsResponse>('/email-config/providers/defaults', undefined, true),
        api<MyEmailConfig | null>('/email-config/me', undefined, true),
      ]);
      setProviderDefaults(defaults);

      if (config) {
        form.setFieldsValue({
          provider: config.provider,
          emailAddress: config.emailAddress,
          authType: config.authType,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpSecure: config.smtpSecure,
          imapHost: config.imapHost,
          imapPort: config.imapPort,
          imapSecure: config.imapSecure,
          popHost: config.popHost ?? undefined,
          popPort: config.popPort ?? undefined,
          popSecure: config.popSecure ?? undefined,
          enabled: config.enabled,
          secret: '',
        });
        setSecretMasked(config.secretMasked ?? '');
      } else {
        form.setFieldsValue({
          provider: 'QQ',
          authType: 'authorization_code',
          smtpSecure: true,
          imapSecure: true,
          enabled: true,
          secret: '',
        });
        setSecretMasked('');
        applyProviderDefaults('QQ');
      }
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    profileForm.setFieldsValue({
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      avatarImage: user.avatarImage,
    });
  }, [profileForm, user.avatarImage, user.avatarUrl, user.name, user.username]);

  const onSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setProfileSaving(true);
      const updated = await api<AuthUser>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(values),
      }, true);
      localStorage.setItem('motila_user', JSON.stringify({ ...user, ...updated }));
      message.success('个人信息已更新，请刷新页面查看最新信息');
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setProfileSaving(false);
    }
  };

  const onSaveEmailConfig = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        emailAddress: values.emailAddress.trim(),
        secret: values.secret?.trim() ? values.secret.trim() : undefined,
        smtpHost: values.smtpHost.trim(),
        smtpPort: Number(values.smtpPort),
        imapHost: values.imapHost.trim(),
        imapPort: Number(values.imapPort),
        popHost: values.popHost?.trim() ? values.popHost.trim() : undefined,
        popPort: values.popPort === undefined || values.popPort === null
          ? undefined
          : Number(values.popPort),
      };

      setSaving(true);
      const data = await api<MyEmailConfig>('/email-config/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }, true);
      setSecretMasked(data.secretMasked ?? '');
      form.setFieldValue('secret', '');
      message.success('邮箱配置已保存');
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setSaving(false);
    }
  };

  const onTestEmailConfig = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        emailAddress: values.emailAddress.trim(),
        secret: values.secret?.trim() ? values.secret.trim() : undefined,
        smtpHost: values.smtpHost.trim(),
        smtpPort: Number(values.smtpPort),
        imapHost: values.imapHost.trim(),
        imapPort: Number(values.imapPort),
        popHost: values.popHost?.trim() ? values.popHost.trim() : undefined,
        popPort: values.popPort === undefined || values.popPort === null
          ? undefined
          : Number(values.popPort),
      };

      if (!payload.secret) {
        message.warning('测试前请填写授权码/密码');
        return;
      }

      setTesting(true);
      const result = await api<{ ok: boolean; message: string }>('/email-config/me/test', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, true);
      setTestResult(result);
      if (result.ok) message.success(result.message);
      else message.error(result.message);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card
        title="个人信息"
        extra={<Button type="primary" onClick={() => void onSaveProfile()} loading={profileSaving}>保存个人信息</Button>}
      >
        <Form form={profileForm} layout="vertical">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Avatar src={user.avatarImage || user.avatarUrl} size={64}>{(user.name ?? user.email).slice(0, 1)}</Avatar>
            <Form.Item label="昵称" name="name" rules={[{ required: true, min: 2, message: '昵称至少2位' }]}>
              <Input style={{ maxWidth: 420 }} />
            </Form.Item>
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, min: 4, message: '用户名至少4位' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字、下划线' },
              ]}
            >
              <Input style={{ maxWidth: 420 }} />
            </Form.Item>
            <Form.Item label="头像地址" name="avatarUrl">
              <Input style={{ maxWidth: 420 }} placeholder="https://..." />
            </Form.Item>
            <Typography.Text>角色：{user.role}</Typography.Text>
            <Typography.Text type="secondary">邮箱请在下方“邮箱配置”中维护。</Typography.Text>
          </Space>
        </Form>
      </Card>

      <Card
        title="邮箱配置（QQ/163）"
        loading={loading}
        extra={
          <Space>
            <Button onClick={() => void onTestEmailConfig()} loading={testing}>测试配置</Button>
            <Button type="primary" onClick={() => void onSaveEmailConfig()} loading={saving}>保存配置</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Space wrap style={{ width: '100%' }}>
            <Form.Item label="邮箱服务商" name="provider" rules={[{ required: true }]}>
              <Select
                style={{ width: 220 }}
                options={[
                  { label: 'QQ 邮箱', value: 'QQ' },
                  { label: '163 邮箱', value: 'NETEASE_163' },
                  { label: '自定义', value: 'CUSTOM' },
                ]}
                onChange={(value: EmailProvider) => applyProviderDefaults(value)}
              />
            </Form.Item>

            <Form.Item label="认证方式" name="authType" rules={[{ required: true }]}>
              <Select
                style={{ width: 220 }}
                options={[
                  { label: '授权码', value: 'authorization_code' },
                  { label: '密码', value: 'password' },
                ]}
              />
            </Form.Item>

            <Form.Item label="启用" name="enabled" valuePropName="checked" initialValue>
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item label="邮箱账号" name="emailAddress" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="example@qq.com" style={{ maxWidth: 420 }} />
          </Form.Item>

          <Form.Item label={`授权码/密码${secretMasked ? `（已保存：${secretMasked}）` : ''}`} name="secret">
            <Input.Password placeholder="不修改可留空；测试时必须填写" style={{ maxWidth: 420 }} />
          </Form.Item>

          <Space wrap style={{ width: '100%' }}>
            <Form.Item label="SMTP Host" name="smtpHost" rules={[{ required: true }]}>
              <Input style={{ width: 220 }} placeholder="smtp.qq.com" />
            </Form.Item>
            <Form.Item label="SMTP Port" name="smtpPort" rules={[{ required: true }]}>
              <Input type="number" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="SMTP Secure" name="smtpSecure" valuePropName="checked" initialValue>
              <Switch />
            </Form.Item>
          </Space>

          <Space wrap style={{ width: '100%' }}>
            <Form.Item label="IMAP Host" name="imapHost" rules={[{ required: true }]}>
              <Input style={{ width: 220 }} placeholder="imap.qq.com" />
            </Form.Item>
            <Form.Item label="IMAP Port" name="imapPort" rules={[{ required: true }]}>
              <Input type="number" style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="IMAP Secure" name="imapSecure" valuePropName="checked" initialValue>
              <Switch />
            </Form.Item>
          </Space>

          {testResult ? (
            <Typography.Text type={testResult.ok ? 'success' : 'danger'}>
              测试结果：{testResult.message}
            </Typography.Text>
          ) : null}
        </Form>
      </Card>
    </Space>
  );
}

function ProjectPage({ canCreate, canUpdate }: { canCreate: boolean; canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ProjectStatus | undefined>(undefined);
  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{
    name: string;
    code: string;
    description?: string;
    status: ProjectStatus;
  }>();

  const fetchRows = async () => {
    setLoading(true);
    try {
      const query = buildListQuery(
        { page, pageSize },
        { keyword: keyword || undefined, status: status || undefined },
      );
      const res = await api<ListProjectsResponse>(`/projects?${query}`, undefined, true);
      setRows(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, keyword, status]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ name: '', code: '', description: '', status: 'PLANNING' });
    setOpen(true);
  };

  const openEdit = (record: ProjectItem) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      status: record.status,
    });
    setOpen(true);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card title="项目管理">
        <Space wrap>
          <Input.Search
            placeholder="搜索项目名/编码"
            allowClear
            onSearch={(value) => {
              setPage(1);
              setKeyword(value.trim());
            }}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="项目状态"
            style={{ width: 180 }}
            value={status}
            onChange={(value) => {
              setPage(1);
              setStatus(value as ProjectStatus | undefined);
            }}
            options={[
              { label: '规划中', value: 'PLANNING' },
              { label: '进行中', value: 'ACTIVE' },
              { label: '暂停', value: 'ON_HOLD' },
              { label: '完成', value: 'DONE' },
              { label: '归档', value: 'ARCHIVED' },
            ]}
          />
          <Button type="primary" onClick={openCreate} disabled={!canCreate}>新建项目</Button>
        </Space>
      </Card>

      <Card>
        <Table<ProjectItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={[
            { title: '项目名称', dataIndex: 'name' },
            { title: '项目编码', dataIndex: 'code' },
            {
              title: '状态',
              dataIndex: 'status',
              render: (v: ProjectStatus) => <Tag>{v}</Tag>,
            },
            { title: '说明', dataIndex: 'description', render: (v?: string) => v || '-' },
            {
              title: '操作',
              render: (_, record) => (
                <Button size="small" onClick={() => openEdit(record)} disabled={!canUpdate}>编辑</Button>
              ),
            },
          ]}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (next, size) => {
              setPage(next);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <Modal
        title={editing ? '编辑项目' : '新建项目'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            setSaving(true);
            if (editing) {
              await api(`/projects/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify(values),
              }, true);
              message.success('项目已更新');
            } else {
              await api('/projects', {
                method: 'POST',
                body: JSON.stringify(values),
              }, true);
              message.success('项目已创建');
            }
            setOpen(false);
            void fetchRows();
          } catch (error) {
            if (error instanceof Error) message.error(parseError(error));
          } finally {
            setSaving(false);
          }
        }}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="项目名称" name="name" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item label="项目编码" name="code" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '规划中', value: 'PLANNING' },
                { label: '进行中', value: 'ACTIVE' },
                { label: '暂停', value: 'ON_HOLD' },
                { label: '完成', value: 'DONE' },
                { label: '归档', value: 'ARCHIVED' },
              ]}
            />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

function HrEmployeesPage({ canCreate, canUpdate }: { canCreate: boolean; canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<EmployeeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<EmployeeStatus | undefined>(undefined);
  const [editing, setEditing] = useState<EmployeeItem | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{
    name: string;
    email: string;
    phone?: string;
    department?: string;
    title?: string;
    status: EmployeeStatus;
  }>();

  const fetchRows = async () => {
    setLoading(true);
    try {
      const query = buildListQuery(
        { page, pageSize },
        { keyword: keyword || undefined, status: status || undefined },
      );
      const res = await api<ListEmployeesResponse>(`/hr/employees?${query}`, undefined, true);
      setRows(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, keyword, status]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ name: '', email: '', phone: '', department: '', title: '', status: 'ACTIVE' });
    setOpen(true);
  };

  const openEdit = (record: EmployeeItem) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card title="人员管理">
        <Space wrap>
          <Input.Search
            placeholder="搜索姓名/邮箱/部门"
            allowClear
            onSearch={(value) => {
              setPage(1);
              setKeyword(value.trim());
            }}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="员工状态"
            style={{ width: 160 }}
            value={status}
            onChange={(value) => {
              setPage(1);
              setStatus(value as EmployeeStatus | undefined);
            }}
            options={[
              { label: '在职', value: 'ACTIVE' },
              { label: '离职', value: 'INACTIVE' },
            ]}
          />
          <Button type="primary" onClick={openCreate} disabled={!canCreate}>新建员工</Button>
        </Space>
      </Card>

      <Card>
        <Table<EmployeeItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={[
            { title: '姓名', dataIndex: 'name' },
            { title: '邮箱', dataIndex: 'email' },
            { title: '部门', dataIndex: 'department', render: (v?: string) => v || '-' },
            { title: '岗位', dataIndex: 'title', render: (v?: string) => v || '-' },
            { title: '电话', dataIndex: 'phone', render: (v?: string) => v || '-' },
            { title: '状态', dataIndex: 'status', render: (v: EmployeeStatus) => <Tag>{v}</Tag> },
            {
              title: '操作',
              render: (_, record) => (
                <Button size="small" onClick={() => openEdit(record)} disabled={!canUpdate}>编辑</Button>
              ),
            },
          ]}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (next, size) => {
              setPage(next);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <Modal
        title={editing ? '编辑员工' : '新建员工'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            setSaving(true);
            if (editing) {
              await api(`/hr/employees/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify(values),
              }, true);
              message.success('员工已更新');
            } else {
              await api('/hr/employees', {
                method: 'POST',
                body: JSON.stringify(values),
              }, true);
              message.success('员工已创建');
            }
            setOpen(false);
            void fetchRows();
          } catch (error) {
            if (error instanceof Error) message.error(parseError(error));
          } finally {
            setSaving(false);
          }
        }}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="部门" name="department">
            <Input />
          </Form.Item>
          <Form.Item label="岗位" name="title">
            <Input />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '在职', value: 'ACTIVE' },
                { label: '离职', value: 'INACTIVE' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

function ModulesPage({
  modules,
  loading,
  canUpdate,
  onReload,
  onToggle,
}: {
  modules: ModuleItem[];
  loading: boolean;
  canUpdate: boolean;
  onReload: () => Promise<void>;
  onToggle: (module: ModuleItem, nextEnabled: boolean) => Promise<void>;
}) {
  const [submittingCode, setSubmittingCode] = useState<string | null>(null);

  return (
    <Card
      title="模块管理"
      extra={
        <Button loading={loading} onClick={() => void onReload()}>
          刷新
        </Button>
      }
    >
      <Table<ModuleItem>
        rowKey="code"
        loading={loading}
        dataSource={modules}
        pagination={false}
        columns={[
          {
            title: '模块',
            key: 'module',
            render: (_value, record) => (
              <Space direction="vertical" size={2}>
                <Typography.Text strong>{record.name}</Typography.Text>
                <Typography.Text type="secondary">{record.code}</Typography.Text>
              </Space>
            ),
          },
          {
            title: '说明',
            dataIndex: 'description',
            key: 'description',
            render: (value?: string) => value || '-',
          },
          {
            title: '依赖',
            key: 'dependencies',
            render: (_value, record) =>
              record.dependencies.length > 0
                ? record.dependencies.map((dep) => dep.dependsOnCode).join(', ')
                : '-',
          },
          {
            title: '状态',
            key: 'status',
            render: (_value, record) => {
              const color = record.status === 'ENABLED' ? 'green' : record.status === 'DISABLED' ? 'default' : 'orange';
              return <Tag color={color}>{record.status}</Tag>;
            },
          },
          {
            title: '启用',
            key: 'enabled',
            width: 120,
            render: (_value, record) => {
              const checked = record.status === 'ENABLED';
              const disabled = record.isCore || !canUpdate || submittingCode === record.code;
              return (
                <Switch
                  checked={checked}
                  disabled={disabled}
                  loading={submittingCode === record.code}
                  onChange={async (nextEnabled) => {
                    setSubmittingCode(record.code);
                    try {
                      await onToggle(record, nextEnabled);
                    } finally {
                      setSubmittingCode(null);
                    }
                  }}
                />
              );
            },
          },
        ]}
      />
    </Card>
  );
}

function AppShell({
  user,
  onLogout,
  skin,
  setSkin,
  branding,
  setBranding,
}: {
  user: AuthUser;
  onLogout: () => void;
  skin: SkinMode;
  setSkin: (s: SkinMode) => void;
  branding: BrandingConfig;
  setBranding: (b: BrandingConfig) => void;
}) {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const brandingFileInputRef = useRef<HTMLInputElement | null>(null);

  const [systemConfig, setSystemConfig] = useState<SystemConfigItem | null>(null);

  const fetchActiveSystemConfig = async () => {
    try {
      const data = await api<SystemConfigItem | null>('/system-configs/active', undefined, true);
      setSystemConfig(data);
    } catch (error) {
      message.error(parseError(error));
    }
  };

  useEffect(() => {
    void fetchActiveSystemConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [moduleLoading, setModuleLoading] = useState(false);

  const permissionSet = useMemo(() => new Set(user.permissions ?? []), [user.permissions]);

  const can = (permission: string) => permissionSet.has(permission);

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const refreshModules = async () => {
    if (!can('module.read')) {
      setModules([{ code: 'core', name: '系统核心', status: 'ENABLED', isCore: true, sortOrder: 0, dependencies: [], dependents: [] }]);
      return;
    }

    setModuleLoading(true);
    try {
      const data = await api<ModuleItem[]>('/modules', undefined, true);
      setModules(data);
    } catch (error) {
      message.error(parseError(error));
      setModules([{ code: 'core', name: '系统核心', status: 'ENABLED', isCore: true, sortOrder: 0, dependencies: [], dependents: [] }]);
    } finally {
      setModuleLoading(false);
    }
  };

  useEffect(() => {
    void refreshModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.permissions]);

  const enabledModuleCodes = useMemo(() => {
    const set = new Set<string>(['core']);
    modules
      .filter((item) => item.status === 'ENABLED')
      .forEach((item) => set.add(item.code));
    return set;
  }, [modules]);

  const effectiveSkin = resolveEffectiveSkin(skin, systemPrefersDark);
  const activeTheme = getThemeBySkin(effectiveSkin, branding);
  const activeSystemConfig = systemConfig;
  const logoSrc = activeSystemConfig?.logoImage || activeSystemConfig?.logoUrl || '';
  const logoLabel = activeSystemConfig?.name ?? 'Motila';
  const headerTitle = activeSystemConfig?.title ?? 'Motila 管理系统';
  const footerText = activeSystemConfig?.footerText ?? 'Motila © 2026';

  useEffect(() => {
    document.title = headerTitle;
  }, [headerTitle]);

  const menuItems = buildMenuByAccess(user.permissions, Array.from(enabledModuleCodes));
  const flatMenuItems = menuItems.flatMap((item) => item.children ?? [item]);
  const selectedMenuKey =
    flatMenuItems.find((item) => item.path && location.pathname.startsWith(item.path))?.key ??
    flatMenuItems[0]?.key;

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationMenuItems = menuItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children
      ? item.children.map((child) => ({
          key: child.key,
          icon: child.icon,
          label: child.label,
          onClick: () => {
            if (child.path) navigate(child.path);
            if (isMobile) setMobileMenuOpen(false);
          },
        }))
      : undefined,
    onClick: () => {
      if (item.path) navigate(item.path);
      if (isMobile) setMobileMenuOpen(false);
    },
  }));

  const canUsersRead = can('users.read');
  const canProjectRead = can('project.read');
  const canProjectCreate = can('project.create');
  const canProjectUpdate = can('project.update');
  const canHrRead = can('hr.read');
  const canHrCreate = can('hr.create');
  const canHrUpdate = can('hr.update');
  const canModuleRead = can('module.read');
  const canSettingsRead = can('settings.read');
  const canSettingsUpdate = can('settings.update');
  const canModuleUpdate = can('module.update');
  const canAuditRead = can('audit.read');
  const canRbacRead = can('rbac.read');
  const canRbacUpdate = can('rbac.update');
  const canAssignRoles = canRbacUpdate;

  useEffect(() => {
    const isRouteForbidden =
      (location.pathname.startsWith('/users') && !canUsersRead) ||
      (location.pathname.startsWith('/audit-logs') && !canAuditRead) ||
      (location.pathname.startsWith('/projects') && !canProjectRead) ||
      (location.pathname.startsWith('/hr') && !canHrRead) ||
      (location.pathname.startsWith('/settings/system') && !canSettingsRead) ||
      (location.pathname.startsWith('/settings/modules') && !canModuleRead) ||
      (location.pathname.startsWith('/settings/rbac') && !canRbacRead);

    const isRouteDisabledByModule =
      (location.pathname.startsWith('/users') && !enabledModuleCodes.has('users')) ||
      (location.pathname.startsWith('/audit-logs') && !enabledModuleCodes.has('audit')) ||
      (location.pathname.startsWith('/projects') && !enabledModuleCodes.has('project')) ||
      (location.pathname.startsWith('/hr') && !enabledModuleCodes.has('hr'));

    if (isRouteForbidden || isRouteDisabledByModule) {
      message.warning('当前无权限或模块已关闭，已为你跳转到仪表盘');
      navigate('/dashboard', { replace: true });
    }
  }, [
    canAuditRead,
    canHrRead,
    canModuleRead,
    canProjectRead,
    canUsersRead,
    enabledModuleCodes,
    location.pathname,
    message,
    navigate,
  ]);

  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
      return;
    }

    setMobileMenuOpen(false);
  }, [isMobile, location.pathname]);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordForm] = Form.useForm<{ password: string; confirmPassword: string }>();

  const breadcrumbItems = useMemo(() => {
    const items: Array<{ title: React.ReactNode }> = [{ title: <Link to="/dashboard">首页</Link> }];

    if (location.pathname.startsWith('/users')) {
      items.push({ title: <Link to="/users">用户管理</Link> });
      if (location.pathname.endsWith('/create')) items.push({ title: '创建' });
      else if (location.pathname.endsWith('/edit')) items.push({ title: '编辑' });
      else {
        const segments = location.pathname.split('/').filter(Boolean);
        if (segments.length === 2 && segments[1] !== 'users') items.push({ title: '详情' });
      }
    } else if (location.pathname.startsWith('/projects')) {
      items.push({ title: '项目管理' });
    } else if (location.pathname.startsWith('/hr/employees')) {
      items.push({ title: '人员管理' });
    } else if (location.pathname.startsWith('/settings/modules')) {
      items.push({ title: '配置' }, { title: '模块管理' });
    } else if (location.pathname.startsWith('/settings/rbac')) {
      items.push({ title: '配置' }, { title: '权限配置' });
    } else if (location.pathname.startsWith('/settings/system')) {
      items.push({ title: '配置' }, { title: '系统配置' });
    } else if (location.pathname.startsWith('/audit-logs')) {
      items.push({ title: '配置' }, { title: '审计日志' });
    } else if (location.pathname.startsWith('/settings/theme')) {
      items.push({ title: '配置' }, { title: '主题设置' });
    } else if (location.pathname.startsWith('/profile')) {
      items.push({ title: '个人信息' });
    } else {
      items.push({ title: '仪表盘' });
    }

    return items;
  }, [location.pathname]);

  const onSkinChange = (value: SkinMode) => {
    setSkin(value);
    localStorage.setItem('motila_skin', value);
  };

  const onBrandColorChange = (hexColor: string) => {
    const next = { primaryColor: hexColor };
    setBranding(next);
    localStorage.setItem('motila_branding', JSON.stringify(next));
  };

  const resetBrandColor = () => {
    setBranding(DEFAULT_BRANDING);
    localStorage.setItem('motila_branding', JSON.stringify(DEFAULT_BRANDING));
  };

  const exportThemeConfig = () => {
    try {
      const payload = { version: '1.0.0', skin, branding };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `motila-theme-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('主题配置已导出');
    } catch {
      message.error('导出失败');
    }
  };

  const onImportThemeFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { skin?: SkinMode; branding?: { primaryColor?: string } };

      if (parsed.skin && ['auto', 'business', 'tech', 'dark'].includes(parsed.skin)) {
        setSkin(parsed.skin);
        localStorage.setItem('motila_skin', parsed.skin);
      }

      if (parsed.branding?.primaryColor && /^#([0-9a-fA-F]{6})$/.test(parsed.branding.primaryColor)) {
        const next = { primaryColor: parsed.branding.primaryColor };
        setBranding(next);
        localStorage.setItem('motila_branding', JSON.stringify(next));
      }

      message.success('主题配置导入成功');
    } catch {
      message.error('导入失败：请使用有效的 JSON 配置文件');
    }
  };

  const openChangePasswordModal = () => {
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const submitPasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields();
      setPasswordSubmitting(true);
      await api('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ password: values.password }),
      }, true);
      message.success('密码修改成功，请重新登录');
      setPasswordModalOpen(false);
      onLogout();
    } catch (error) {
      if (error instanceof Error) {
        message.error(parseError(error));
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const profileMenuItems = [
    { key: 'profile', label: '个人信息' },
    { key: 'password', label: '修改密码' },
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录', danger: true },
  ];

  const toggleModule = async (module: ModuleItem, nextEnabled: boolean) => {
    const targetStatus: ModuleStatus = nextEnabled ? 'ENABLED' : 'DISABLED';

    try {
      await api<ModuleItem>(
        `/modules/${module.code}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus }),
        },
        true,
      );
      message.success(`模块 ${module.name} 已${nextEnabled ? '启用' : '禁用'}`);
      await refreshModules();
    } catch (error) {
      message.error(parseError(error));
    }
  };

  return (
    <ConfigProvider theme={activeTheme}>
      <Layout className={`app-layout skin-${effectiveSkin}`}>
        {!isMobile ? (
          <Layout.Sider theme="light" width={220} className="app-sider">
            <div
              className="logo"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/dashboard')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') navigate('/dashboard');
              }}
            >
              {logoSrc ? (
                <img src={logoSrc} alt={activeSystemConfig?.name ?? 'logo'} className="logo-image" />
              ) : (
                logoLabel
              )}
            </div>
            <Menu mode="inline" selectedKeys={selectedMenuKey ? [selectedMenuKey] : []} items={navigationMenuItems} />
          </Layout.Sider>
        ) : null}

        <Layout>
          <Layout.Header className="app-header">
            <div className="header-left">
              {isMobile ? (
                <Button
                  type="text"
                  className="mobile-menu-button"
                  icon={<MenuOutlined />}
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="打开菜单"
                />
              ) : null}
              <Breadcrumb items={breadcrumbItems} className="header-breadcrumb" />
            </div>

            <Dropdown
              menu={{
                items: profileMenuItems,
                onClick: ({ key }) => {
                  if (key === 'profile') {
                    navigate('/profile');
                    return;
                  }
                  if (key === 'password') {
                    openChangePasswordModal();
                    return;
                  }
                  if (key === 'logout') {
                    onLogout();
                  }
                },
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="profile-summary" role="button" tabIndex={0}>
                <Avatar src={user.avatarImage || user.avatarUrl} size={34}>
                  {(user.name ?? user.email).slice(0, 1)}
                </Avatar>
                <div className="profile-summary-text">
                  <span className="profile-summary-name">{user.name ?? user.email}</span>
                  <span className="profile-summary-role">{user.role}</span>
                </div>
              </div>
            </Dropdown>
          </Layout.Header>

          <Layout.Content className="app-content">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage user={user} />} />
                            <Route
                path="/settings/system"
                element={<SystemConfigPage canUpdate={canSettingsUpdate} onConfigApplied={fetchActiveSystemConfig} />}
              />

<Route
                path="/settings/theme"
                element={
                  <ThemeSettingsPage
                    skin={skin}
                    branding={branding}
                    onSkinChange={onSkinChange}
                    onBrandColorChange={onBrandColorChange}
                    onResetBrandColor={resetBrandColor}
                    onExportThemeConfig={exportThemeConfig}
                    onImportThemeFile={onImportThemeFile}
                    brandingFileInputRef={brandingFileInputRef}
                  />
                }
              />
              <Route path="/profile" element={<ProfilePage user={user} />} />

              {canUsersRead ? (
                <>
                  <Route
                    path="/users"
                    element={
                      <UsersListPage
                        currentUser={user}
                        onChanged={() => void 0}
                        canCreate={can('users.create')}
                        canUpdate={can('users.update')}
                        canDelete={can('users.delete')}
                        canAssignRoles={canAssignRoles}
                        canReadRoles={canRbacRead}
                      />
                    }
                  />
                  <Route path="/users/create" element={<UserCreatePage />} />
                  <Route path="/users/:id" element={<UserShowPage />} />
                  <Route path="/users/:id/edit" element={<UserEditPage />} />
                </>
              ) : null}

              {canProjectRead ? (
                <Route
                  path="/projects"
                  element={<ProjectPage canCreate={canProjectCreate} canUpdate={canProjectUpdate} />}
                />
              ) : null}

              {canHrRead ? (
                <Route
                  path="/hr/employees"
                  element={<HrEmployeesPage canCreate={canHrCreate} canUpdate={canHrUpdate} />}
                />
              ) : null}

              {canModuleRead ? (
                <Route
                  path="/settings/modules"
                  element={
                    <ModulesPage
                      modules={modules}
                      loading={moduleLoading}
                      canUpdate={canModuleUpdate}
                      onReload={refreshModules}
                      onToggle={toggleModule}
                    />
                  }
                />
              ) : null}

              {canRbacRead ? (
                <Route path="/settings/rbac" element={<RbacSettingsPage canUpdate={canRbacUpdate} />} />
              ) : null}

              {canAuditRead ? <Route path="/audit-logs" element={<AuditLogsPage />} /> : null}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout.Content>
          <Layout.Footer className="app-footer">{renderFooterContent(footerText)}</Layout.Footer>
        </Layout>

        <Drawer
          title={logoLabel}
          placement="left"
          width={260}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          className="mobile-menu-drawer"
          bodyStyle={{ padding: 0 }}
        >
          <Menu mode="inline" selectedKeys={selectedMenuKey ? [selectedMenuKey] : []} items={navigationMenuItems} />
        </Drawer>

        <Modal
          title="修改密码"
          open={passwordModalOpen}
          onCancel={() => setPasswordModalOpen(false)}
          onOk={() => void submitPasswordChange()}
          confirmLoading={passwordSubmitting}
          okText="确认修改"
          cancelText="取消"
        >
          <Form form={passwordForm} layout="vertical">
            <Form.Item
              label="新密码"
              name="password"
              rules={[{ required: true, min: 1, message: '密码不能为空' }]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>

            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
}

function App() {
  const { message } = AntdApp.useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [skin, setSkin] = useState<SkinMode>(() => getInitialSkin());
  const [branding, setBranding] = useState<BrandingConfig>(() => getInitialBranding());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const [authForm] = Form.useForm<{ username: string; email?: string; name?: string; password: string }>();
  const [forgotForm] = Form.useForm<{ username?: string; email?: string }>();

  const [token, setToken] = useState<string>(() => localStorage.getItem('motila_token') ?? '');
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('motila_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!token || !user) return;

    api<AuthUser>('/auth/me', undefined, true)
      .then((me) => {
        const mergedUser: AuthUser = {
          ...user,
          ...me,
          username: me.username ?? user.username,
          name: me.name ?? user.name,
          avatarUrl: me.avatarUrl ?? user.avatarUrl,
          avatarImage: me.avatarImage ?? user.avatarImage,
          roles: me.roles ?? user.roles ?? [],
          permissions: me.permissions ?? user.permissions ?? [],
          modules: me.modules ?? user.modules ?? ['core'],
        };
        localStorage.setItem('motila_user', JSON.stringify(mergedUser));
        setUser(mergedUser);
      })
      .catch(() => {
        // token 失效或后端暂不可用时，保持当前本地态，避免刷新即踢出
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const effectiveSkin = resolveEffectiveSkin(skin, systemPrefersDark);
  const authTheme = getThemeBySkin(effectiveSkin, branding);
  const isAuthed = !!token && !!user;
  const [publicSystemTitle, setPublicSystemTitle] = useState<string>('Welcome to Motila');

  useEffect(() => {
    if (isAuthed) return;

    let cancelled = false;
    api<SystemConfigItem | null>('/system-configs/active')
      .then((config) => {
        if (cancelled) return;
        setPublicSystemTitle(config?.title?.trim() || 'Welcome to Motila');
      })
      .catch(() => {
        if (cancelled) return;
        setPublicSystemTitle('Welcome to Motila');
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  useEffect(() => {
    if (isAuthed) return;
    document.title = publicSystemTitle;
  }, [isAuthed, publicSystemTitle]);

  const onSubmitAuth = async (values: { username: string; email?: string; name?: string; password: string }) => {
    setAuthLoading(true);
    try {
      const payload =
        mode === 'login'
          ? { username: values.username, password: values.password }
          : {
              username: values.username,
              email: values.email,
              name: values.name,
              password: values.password,
            };

      const data = await api<AuthResponse>(mode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('motila_token', data.token);

      const me = await api<AuthUser>('/auth/me', undefined, true);
      const mergedUser: AuthUser = {
        ...data.user,
        ...me,
        username: me.username ?? data.user.username,
        name: me.name ?? data.user.name,
        avatarUrl: me.avatarUrl ?? data.user.avatarUrl,
        avatarImage: me.avatarImage ?? data.user.avatarImage,
        roles: me.roles ?? data.user.roles ?? [],
        permissions: me.permissions ?? data.user.permissions ?? [],
        modules: me.modules ?? data.user.modules ?? ['core'],
      };

      localStorage.setItem('motila_user', JSON.stringify(mergedUser));
      setToken(data.token);
      setUser(mergedUser);
      message.success(mode === 'login' ? '登录成功' : '注册成功');
      authForm.resetFields(['password']);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const onSubmitForgotPassword = async () => {
    try {
      const values = await forgotForm.validateFields();
      if (!values.username?.trim() && !values.email?.trim()) {
        message.warning('请至少填写用户名或邮箱');
        return;
      }
      setForgotSubmitting(true);
      const res = await api<{ ok: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          username: values.username?.trim() ? values.username.trim() : undefined,
          email: values.email?.trim() ? values.email.trim() : undefined,
        }),
      });
      if (res.ok) {
        message.success(res.message);
        setForgotOpen(false);
        forgotForm.resetFields();
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setForgotSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('motila_token');
    localStorage.removeItem('motila_user');
    setToken('');
    setUser(null);
    message.success('已退出登录');
  };

  if (!isAuthed || !user) {
    return (
      <ConfigProvider theme={authTheme}>
        <div className={`auth-page skin-${effectiveSkin}`}>
          <div className="auth-shell">
            <Card className="auth-card" bordered={false}>
              <div className="auth-panel">
                <div className="auth-panel-hero">
                  <Typography.Text className="auth-kicker">MOTILA WORKSPACE</Typography.Text>
                  <Typography.Title level={2} className="auth-title">
                    {mode === 'login' ? '欢迎登录 Motila' : '创建你的 Motila 账号'}
                  </Typography.Title>
                  <Typography.Paragraph className="auth-subtitle">
                    一个开箱即用的管理系统框架。
                  </Typography.Paragraph>
                </div>

                <div className="auth-panel-form">
                  <Form form={authForm} layout="vertical" onFinish={onSubmitAuth} className="auth-form">
                    <Form.Item
                      label="用户名"
                      name="username"
                      rules={[
                        { required: true, min: 4, message: '用户名至少4位' },
                        { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字、下划线' },
                      ]}
                    >
                      <Input size="large" placeholder="请输入登录用户名" />
                    </Form.Item>

                    {mode === 'register' && (
                      <>
                        <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
                          <Input size="large" placeholder="you@example.com" />
                        </Form.Item>

                        <Form.Item
                          label="昵称"
                          name="name"
                          rules={[{ required: true, min: 2, message: '昵称至少2位' }]}
                        >
                          <Input size="large" placeholder="请输入昵称" />
                        </Form.Item>
                      </>
                    )}

                    <Form.Item label="密码" name="password" rules={[{ required: true, min: 1, message: '密码不能为空' }]}>
                      <Input.Password size="large" placeholder="请输入密码" />
                    </Form.Item>

                    <div className="auth-actions">
                      <Button type="primary" htmlType="submit" loading={authLoading} size="large" block>
                        {mode === 'login' ? '立即登录' : '立即注册'}
                      </Button>

                      {mode === 'login' ? (
                        <Space size={16}>
                          <Typography.Link className="auth-mode-link" onClick={() => setMode('register')}>
                            注册账号
                          </Typography.Link>
                          <Typography.Link
                            className="auth-mode-link"
                            onClick={() => {
                              setForgotOpen(true);
                              forgotForm.setFieldsValue({ username: authForm.getFieldValue('username') });
                            }}
                          >
                            忘记密码
                          </Typography.Link>
                        </Space>
                      ) : (
                        <Typography.Link className="auth-mode-link" onClick={() => setMode('login')}>
                          返回登录
                        </Typography.Link>
                      )}
                    </div>
                  </Form>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Modal
          title="邮箱找回密码"
          open={forgotOpen}
          onCancel={() => setForgotOpen(false)}
          onOk={() => void onSubmitForgotPassword()}
          okText="发送重置邮件"
          cancelText="取消"
          confirmLoading={forgotSubmitting}
          destroyOnClose
        >
          <Form form={forgotForm} layout="vertical">
            <Form.Item label="用户名（可选）" name="username">
              <Input placeholder="请输入用户名（或只填邮箱）" />
            </Form.Item>
            <Form.Item label="邮箱（可选）" name="email" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
              <Input placeholder="you@example.com（或只填用户名）" />
            </Form.Item>
            <Typography.Text type="secondary">用户名和邮箱填一个就行。系统会发送临时密码到该用户已绑定邮箱。</Typography.Text>
          </Form>
        </Modal>
      </ConfigProvider>
    );
  }

  return (
    <AppShell
      user={user}
      onLogout={logout}
      skin={skin}
      setSkin={setSkin}
      branding={branding}
      setBranding={setBranding}
    />
  );
}

function AppRoot() {
  return (
    <AntdApp>
      <App />
    </AntdApp>
  );
}

export default AppRoot;
