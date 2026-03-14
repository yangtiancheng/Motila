import {
  App as AntdApp,
  Alert,
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
  Descriptions,
  Divider,
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
import {
  BlogCategoryFormPage,
  BlogCategoryListPage,
  BlogCategoryShowPage,
  BlogPostFormPage,
  BlogPostListPage,
  BlogPostShowPage,
} from './blog/BlogPages';
import { LoginHistoryPage } from './login-history/LoginHistoryPage';
import { LandingPage } from './LandingPage';
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

type CaptchaResponse = {
  captchaId: string;
  imageData: string;
  expiresInSec: number;
  scene: RiskSceneCode;
};

type ApiErrorPayload = {
  message?: string | string[];
  needCaptcha?: boolean;
  scene?: RiskSceneCode;
  retryAfterSec?: number;
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

type RiskSceneCode = 'login' | 'register' | 'forgotPassword';

type RiskScenePolicy = {
  enabled: boolean;
  thresholds: {
    perMinute?: number;
    perHour?: number;
    perDay?: number;
  };
  captchaAfterFailures: number;
  captchaTtlSec: number;
  blockAfterFailures: number;
  blockTtlSec: number;
  retryAfterSec: number;
};

type RiskControlConfigContent = {
  enabled: boolean;
  scenes: Record<RiskSceneCode, RiskScenePolicy>;
  whitelist: { ips: string[]; accounts: string[] };
  blacklist: { ips: string[]; accounts: string[] };
  degradePolicy: { redisUnavailable: 'ALLOW_WITH_CAPTCHA' | 'BLOCK_REQUESTS' };
};

type RiskControlConfigResponse = {
  id: string;
  enabled: boolean;
  version: number;
  content: RiskControlConfigContent;
  createdAt: string;
  updatedAt: string;
};

type RiskControlVersionItem = {
  id: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ROLLED_BACK';
  comment?: string | null;
  createdBy?: string | null;
  publishedBy?: string | null;
  rolledBackFromVersion?: number | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  content: RiskControlConfigContent;
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

type EmailSendLogItem = {
  id: string;
  to: string;
  subject: string;
  content: string;
  status: string;
  error?: string;
  sentAt: string;
  createdAt: string;
};

type ListEmailSendLogsResponse = {
  data: EmailSendLogItem[];
  total: number;
  page: number;
  pageSize: number;
};

type EmailInboxItem = {
  id: string;
  messageId: string;
  fromAddress?: string;
  toAddress?: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  receivedAt?: string;
  createdAt: string;
};

type ListEmailInboxResponse = {
  data: EmailInboxItem[];
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
      const parsed = JSON.parse(error.message) as ApiErrorPayload;
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

function parseApiErrorPayload(error: unknown): ApiErrorPayload | null {
  if (!(error instanceof Error) || !error.message) return null;
  try {
    return JSON.parse(error.message) as ApiErrorPayload;
  } catch {
    return null;
  }
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
}: {
  currentUser: AuthUser;
  onChanged: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();

  const { filters, page, pageSize, setPage, setPageSize, applyFilters } = useListState<UserListQueryValues>(
    userListQueryInitialValues,
  );
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<UserItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

  const batchDelete = async () => {
    if (!selectedRowKeys.length) return;
    if (selectedRowKeys.includes(currentUser.id)) {
      message.warning('不能批量删除当前登录用户');
      return;
    }

    modal.confirm({
      title: '删除确认',
      content: `要删除当前选中的${selectedRowKeys.length}条记录吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api('/users/batch-delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids: selectedRowKeys }),
          }, true);
          message.success('删除完成');
          setSelectedRowKeys([]);
          void fetchRows();
          onChanged();
        } catch (error) {
          message.error(parseError(error));
        }
      },
    });
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
        <Space style={{ marginBottom: 12 }}>
          <Button danger disabled={!selectedRowKeys.length || !canDelete} onClick={() => void batchDelete()}>删除</Button>
        </Space>
        <Table<UserItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={(record) => ({
            onClick: () => {
              if (!canUpdate) return;
              navigate(`/users/${record.id}/edit`);
            },
          })}
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

function RbacRoleListPage({ canUpdate }: { canUpdate: boolean }) {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const roleData = await api<ListRolesResponse>('/rbac/roles', undefined, true);
      setRoles(roleData);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const batchDelete = async () => {
    const selectedCodes = selectedRowKeys.map(String);
    if (!selectedCodes.length) return;

    const protectedCodes = roles
      .filter((r) => selectedCodes.includes(r.code) && r.isSystem)
      .map((r) => r.code);

    if (protectedCodes.length > 0) {
      message.warning(`系统内置角色不可删除：${protectedCodes.join(', ')}`);
      return;
    }

    modal.confirm({
      title: '删除确认',
      content: `要删除当前选中的${selectedCodes.length}条记录吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(selectedCodes.map((code) => api(`/rbac/roles/${code}`, { method: 'DELETE' }, true)));
          message.success('删除完成');
          setSelectedRowKeys([]);
          await fetchRoles();
        } catch (error) {
          message.error(parseError(error));
        }
      },
    });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card className="keep-card-head" title="权限配置">
        <Space>
          <Button type="primary" onClick={() => navigate('/settings/rbac/create')} disabled={!canUpdate}>
            创建
          </Button>
          <Button danger onClick={() => void batchDelete()} disabled={!canUpdate || !selectedRowKeys.length}>
            删除
          </Button>
        </Space>
      </Card>

      <Card>
        <Table<RoleSummary>
          rowKey="code"
          loading={loading}
          dataSource={roles}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            getCheckboxProps: (record) => ({ disabled: record.isSystem || !canUpdate }),
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/settings/rbac/${record.code}`),
          })}
          columns={[
            { title: '角色编码', dataIndex: 'code' },
            { title: '角色名称', dataIndex: 'name' },
            { title: '描述', dataIndex: 'description', render: (value?: string) => value || '-' },
            { title: '用户数', dataIndex: 'userCount' },
            { title: '系统内置', dataIndex: 'isSystem', render: (value: boolean) => (value ? '是' : '否') },
          ]}
          pagination={false}
        />
      </Card>
    </Space>
  );
}

function RbacRoleEditorPage({ canUpdate }: { canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const isCreate = !code || code === 'create';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<RoleSummary | null>(null);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [form] = Form.useForm<RoleFormValues>();
  const isSystemRole = !!role?.isSystem;
  const disableRoleMetaEdit = !canUpdate || isSystemRole;

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const perm of permissions) {
      const list = map.get(perm.moduleCode) ?? [];
      list.push(perm);
      map.set(perm.moduleCode, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [roleData, permissionData, moduleData, usersData] = await Promise.all([
        api<ListRolesResponse>('/rbac/roles', undefined, true),
        api<ListPermissionsResponse>('/rbac/permissions', undefined, true),
        api<ModuleItem[]>('/modules', undefined, true).catch(() => [] as ModuleItem[]),
        api<ListUsersResponse>('/users?page=1&pageSize=0', undefined, true),
      ]);
      setPermissions(permissionData);
      setModules(moduleData);
      setUsers(usersData.data);

      if (isCreate) {
        setRole(null);
        form.setFieldsValue({ code: '', name: '', description: '' });
        setSelectedPermissions([]);
        setSelectedModules([]);
        setSelectedUserIds([]);
      } else {
        const found = roleData.find((r) => r.code === code);
        if (!found) {
          message.error('角色不存在');
          navigate('/settings/rbac');
          return;
        }
        setRole(found);
        form.setFieldsValue({ code: found.code, name: found.name, description: found.description ?? '' });
        setSelectedPermissions(found.permissions ?? []);
        setSelectedModules(found.modules ?? []);
        setSelectedUserIds(usersData.data.filter((item) => item.roles?.includes(found.code)).map((item) => item.id));
      }
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const submit = async () => {
    if (!canUpdate) return;
    try {
      const values = await form.validateFields();
      const targetCode = (isCreate ? values.code : code) as string;
      if (!targetCode) return;

      setSaving(true);

      if (isCreate) {
        await api('/rbac/roles', {
          method: 'POST',
          body: JSON.stringify({ code: values.code, name: values.name, description: values.description }),
        }, true);
      } else if (!isSystemRole) {
        await api(`/rbac/roles/${targetCode}`, {
          method: 'PUT',
          body: JSON.stringify({ name: values.name, description: values.description }),
        }, true);
      }

      if (!isSystemRole) {
        await api(`/rbac/roles/${targetCode}/permissions`, {
          method: 'PUT',
          body: JSON.stringify({ permissionCodes: selectedPermissions }),
        }, true);

        await api(`/rbac/roles/${targetCode}/modules`, {
          method: 'PUT',
          body: JSON.stringify({ moduleCodes: selectedModules }),
        }, true);
      }

      await api(`/rbac/roles/${targetCode}/users`, {
        method: 'PUT',
        body: JSON.stringify({ userIds: selectedUserIds }),
      }, true);

      message.success(isCreate ? '角色已创建' : '角色已更新');
      navigate(isCreate ? `/settings/rbac/${targetCode}` : '/settings/rbac');
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
        className="keep-card-head"
        title={isCreate ? '创建角色' : `编辑角色：${role?.name ?? code}`}
        loading={loading}
        extra={
          <Space>
            <Button onClick={() => navigate('/settings/rbac')}>返回</Button>
            <Button type="primary" loading={saving} disabled={!canUpdate} onClick={() => void submit()}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <div className="grid-form" style={{ gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))' }}>
            <Form.Item
              label="角色编码"
              name="code"
              rules={[
                { required: true, message: '请输入角色编码' },
                { pattern: /^[A-Z][A-Z0-9_]{1,30}$/, message: '仅支持大写字母/数字/下划线，且以字母开头' },
              ]}
            >
              <Input placeholder="例如：SALES_MANAGER" disabled={!isCreate || disableRoleMetaEdit} />
            </Form.Item>
            <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
              <Input placeholder="例如：销售经理" disabled={disableRoleMetaEdit} />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input placeholder="可选" disabled={disableRoleMetaEdit} />
            </Form.Item>
          </div>
        </Form>
      </Card>

      {isSystemRole ? (
        <Alert
          type="info"
          showIcon
          message="系统内置角色不可修改名称、描述、权限和模块授权，但可以调整包含用户。"
        />
      ) : null}

      <Card className="keep-card-head" title="权限点">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {groupedPermissions.map(([moduleCode, perms]) => {
            const moduleCodes = perms.map((p) => p.code);
            return (
              <Card key={moduleCode} size="small" title={`模块：${moduleCode}`}>
                <Checkbox.Group
                  disabled={disableRoleMetaEdit}
                  value={selectedPermissions.filter((code) => moduleCodes.includes(code))}
                  onChange={(values) => {
                    const moduleSet = new Set(moduleCodes);
                    const next = new Set(selectedPermissions.filter((code) => !moduleSet.has(code)));
                    (values as string[]).forEach((v) => next.add(v));
                    setSelectedPermissions(Array.from(next));
                  }}
                  options={perms.map((perm) => ({
                    label: `${perm.name} (${perm.code})`,
                    value: perm.code,
                  }))}
                />
              </Card>
            );
          })}
        </Space>
      </Card>

      <Card className="keep-card-head" title="模块授权">
        <Checkbox.Group
          disabled={disableRoleMetaEdit}
          value={selectedModules}
          onChange={(values) => setSelectedModules(values as string[])}
          options={modules.map((module) => ({
            label: `${module.name} (${module.code})`,
            value: module.code,
          }))}
        />
      </Card>

      <Card className="keep-card-head" title="分配用户">
        <Select
          mode="multiple"
          value={selectedUserIds}
          onChange={(values) => setSelectedUserIds(values)}
          optionFilterProp="label"
          style={{ width: '100%' }}
          options={users.map((user) => ({
            value: user.id,
            label: user.name ? `${user.name} (${user.username})` : user.username,
          }))}
        />
      </Card>
    </Space>
  );
}

function EmailSendCenterPage() {
  const { message } = AntdApp.useApp();
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [logs, setLogs] = useState<EmailSendLogItem[]>([]);
  const [inboxRows, setInboxRows] = useState<EmailInboxItem[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);
  const [logTotal, setLogTotal] = useState(0);
  const [inboxPage, setInboxPage] = useState(1);
  const [inboxPageSize, setInboxPageSize] = useState(10);
  const [inboxTotal, setInboxTotal] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<EmailInboxItem | null>(null);
  const [form] = Form.useForm<{ to: string; subject: string; content: string }>();

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const query = buildListQuery({ page: logPage, pageSize: logPageSize }, {});
      const res = await api<ListEmailSendLogsResponse>(`/emails/send-logs?${query}`, undefined, true);
      setLogs(res.data);
      setLogTotal(res.total);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchInbox = async () => {
    setLoadingInbox(true);
    try {
      const query = buildListQuery({ page: inboxPage, pageSize: inboxPageSize }, {});
      const res = await api<ListEmailInboxResponse>(`/emails/inbox?${query}`, undefined, true);
      setInboxRows(res.data);
      setInboxTotal(res.total);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logPage, logPageSize]);

  useEffect(() => {
    void fetchInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxPage, inboxPageSize]);

  const submitSend = async () => {
    try {
      const values = await form.validateFields();
      setSending(true);
      await api(
        '/emails/send',
        {
          method: 'POST',
          body: JSON.stringify({
            to: values.to.trim(),
            subject: values.subject.trim(),
            content: values.content.trim(),
          }),
        },
        true,
      );
      message.success('邮件发送成功');
      form.resetFields();
      void fetchLogs();
    } catch (error) {
      if (error instanceof Error) message.error(parseError(error));
    } finally {
      setSending(false);
    }
  };

  const syncInbox = async () => {
    try {
      setSyncing(true);
      await api('/emails/sync', {
        method: 'POST',
        body: JSON.stringify({ limit: 30 }),
      }, true);
      message.success('收件箱同步完成');
      setInboxPage(1);
      void fetchInbox();
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setSyncing(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const row = await api<EmailInboxItem>(`/emails/${id}`, undefined, true);
      setDetail(row);
      setDetailOpen(true);
    } catch (error) {
      message.error(parseError(error));
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card title="发件中心">
        <Form form={form} layout="vertical">
          <div className="grid-form" style={{ gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))' }}>
            <Form.Item
              label="收件人"
              name="to"
              rules={[{ required: true, message: '请输入收件人邮箱' }]}
              style={{ gridColumn: 'span 2' }}
            >
              <Input placeholder="多个收件人用英文逗号分隔" />
            </Form.Item>
            <Form.Item
              label="主题"
              name="subject"
              rules={[{ required: true, message: '请输入主题' }]}
              style={{ gridColumn: 'span 2' }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="正文"
              name="content"
              rules={[{ required: true, message: '请输入正文' }]}
              style={{ gridColumn: 'span 4' }}
            >
              <Input.TextArea rows={8} />
            </Form.Item>
          </div>
          <Button type="primary" loading={sending} onClick={() => void submitSend()}>
            发送邮件
          </Button>
        </Form>
      </Card>

      <Card title="收件箱" extra={<Button loading={syncing} onClick={() => void syncInbox()}>同步邮件</Button>}>
        <Table<EmailInboxItem>
          rowKey="id"
          loading={loadingInbox}
          dataSource={inboxRows}
          columns={[
            { title: '发件人', dataIndex: 'fromAddress' },
            { title: '主题', dataIndex: 'subject' },
            {
              title: '接收时间',
              dataIndex: 'receivedAt',
              render: (v?: string) => (v ? new Date(v).toLocaleString() : '-'),
            },
          ]}
          onRow={(record) => ({ onClick: () => void openDetail(record.id), style: { cursor: 'pointer' } })}
          pagination={{
            current: inboxPage,
            pageSize: inboxPageSize,
            total: inboxTotal,
            showSizeChanger: true,
            onChange: (next, size) => {
              setInboxPage(next);
              setInboxPageSize(size);
            },
          }}
        />
      </Card>

      <Card title="发送记录">
        <Table<EmailSendLogItem>
          rowKey="id"
          loading={loadingLogs}
          dataSource={logs}
          columns={[
            { title: '收件人', dataIndex: 'to' },
            { title: '主题', dataIndex: 'subject' },
            {
              title: '状态',
              dataIndex: 'status',
              render: (v: string) => <Tag color={v === 'SUCCESS' ? 'green' : 'red'}>{v}</Tag>,
            },
            { title: '时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
            { title: '错误信息', dataIndex: 'error', render: (v?: string) => v || '-' },
          ]}
          pagination={{
            current: logPage,
            pageSize: logPageSize,
            total: logTotal,
            showSizeChanger: true,
            onChange: (next, size) => {
              setLogPage(next);
              setLogPageSize(size);
            },
          }}
        />
      </Card>

      <Drawer
        open={detailOpen}
        width={720}
        title={detail?.subject || '邮件详情'}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Typography.Text>发件人：{detail?.fromAddress || '-'}</Typography.Text>
          <Typography.Text>收件人：{detail?.toAddress || '-'}</Typography.Text>
          <Typography.Text>
            接收时间：{detail?.receivedAt ? new Date(detail.receivedAt).toLocaleString() : '-'}
          </Typography.Text>
          <Card size="small">
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {detail?.textBody || '（无纯文本正文）'}
            </Typography.Paragraph>
          </Card>
        </Space>
      </Drawer>
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
            <Typography.Text type="secondary">邮箱请在下方"邮箱配置"中维护。</Typography.Text>
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
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProjectItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ProjectStatus | undefined>(undefined);

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

  const batchDelete = async () => {
    if (!selectedRowKeys.length) return;
    modal.confirm({
      title: '删除确认',
      content: `要删除当前选中的${selectedRowKeys.length}条记录吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api('/projects/batch-delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids: selectedRowKeys }),
          }, true);
          message.success('删除完成');
          setSelectedRowKeys([]);
          void fetchRows();
        } catch (error) {
          message.error(parseError(error));
        }
      },
    });
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
          <Button type="primary" onClick={() => navigate('/projects/create')} disabled={!canCreate}>新建项目</Button>
        </Space>
      </Card>

      <Card>
        <Space style={{ marginBottom: 12 }}>
          <Button danger disabled={!selectedRowKeys.length || !canUpdate} onClick={() => void batchDelete()}>删除</Button>
        </Space>
        <Table<ProjectItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/projects/${record.id}`),
          })}
          columns={[
            { title: '项目名称', dataIndex: 'name' },
            { title: '项目编码', dataIndex: 'code' },
            {
              title: '状态',
              dataIndex: 'status',
              render: (v: ProjectStatus) => <Tag>{v}</Tag>,
            },
            { title: '说明', dataIndex: 'description', render: (v?: string) => v || '-' },
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
    </Space>
  );
}

function ProjectFormPage({
  mode,
  canCreate,
  canUpdate,
}: {
  mode: 'create' | 'edit';
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form] = Form.useForm<{ name: string; code: string; description?: string; status: ProjectStatus }>();

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    setLoadingDetail(true);
    api<ProjectItem>(`/projects/${id}`, undefined, true)
      .then((res) => {
        form.setFieldsValue({
          name: res.name,
          code: res.code,
          description: res.description,
          status: res.status,
        });
      })
      .catch((error) => message.error(parseError(error)))
      .finally(() => setLoadingDetail(false));
  }, [form, id, message, mode]);

  const disabled = mode === 'create' ? !canCreate : !canUpdate;

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (mode === 'edit' && id) {
        await api(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(values) }, true);
        message.success('项目已更新');
        navigate(`/projects/${id}`);
      } else {
        await api('/projects', { method: 'POST', body: JSON.stringify(values) }, true);
        message.success('项目已创建');
        navigate('/projects');
      }
    } catch (error) {
      if (error instanceof Error) message.error(parseError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className="keep-card-head"
      title={mode === 'edit' ? '编辑项目' : '新建项目'}
      extra={
        <Space>
          <Button onClick={() => navigate(mode === 'edit' && id ? `/projects/${id}` : '/projects')}>取消</Button>
          <Button type="primary" disabled={disabled} loading={saving} onClick={() => void submitForm()}>
            {mode === 'edit' ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'PLANNING' }}>
        <div className="grid-form" style={{ gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))' }}>
          <Form.Item label="项目名称" name="name" rules={[{ required: true, min: 2 }]}>
            <Input disabled={loadingDetail} />
          </Form.Item>
          <Form.Item label="项目编码" name="code" rules={[{ required: true, min: 2 }]}>
            <Input disabled={loadingDetail} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select
              disabled={loadingDetail}
              options={[
                { label: '规划中', value: 'PLANNING' },
                { label: '进行中', value: 'ACTIVE' },
                { label: '暂停', value: 'ON_HOLD' },
                { label: '完成', value: 'DONE' },
                { label: '归档', value: 'ARCHIVED' },
              ]}
            />
          </Form.Item>
          <div />
          <Form.Item label="说明" name="description" style={{ gridColumn: 'span 2' }}>
            <Input.TextArea rows={3} disabled={loadingDetail} />
          </Form.Item>
        </div>
      </Form>
    </Card>
  );
}

function ProjectShowPage({ canUpdate }: { canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProjectItem | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<ProjectItem>(`/projects/${id}`, undefined, true)
      .then((res) => setData(res))
      .catch((error) => message.error(parseError(error)))
      .finally(() => setLoading(false));
  }, [id, message]);

  return (
    <Card
      className="keep-card-head"
      title="项目详情"
      loading={loading}
      extra={
        <Space>
          <Button onClick={() => navigate('/projects')}>返回列表</Button>
          <Button type="primary" disabled={!canUpdate || !id} onClick={() => navigate(`/projects/${id}/edit`)}>
            编辑
          </Button>
        </Space>
      }
    >
      {data ? (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="项目名称">{data.name}</Descriptions.Item>
          <Descriptions.Item label="项目编码">{data.code}</Descriptions.Item>
          <Descriptions.Item label="状态">{data.status}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="说明" span={2}>{data.description || '-'}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Card>
  );
}

function HrEmployeesPage({ canCreate, canUpdate }: { canCreate: boolean; canUpdate: boolean }) {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<EmployeeItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<EmployeeStatus | undefined>(undefined);

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

  const batchDelete = async () => {
    if (!selectedRowKeys.length) return;
    modal.confirm({
      title: '删除确认',
      content: `要删除当前选中的${selectedRowKeys.length}条记录吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api('/hr/employees/batch-delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids: selectedRowKeys }),
          }, true);
          message.success('删除完成');
          setSelectedRowKeys([]);
          void fetchRows();
        } catch (error) {
          message.error(parseError(error));
        }
      },
    });
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
          <Button type="primary" onClick={() => navigate('/hr/employees/create')} disabled={!canCreate}>新建员工</Button>
        </Space>
      </Card>

      <Card>
        <Space style={{ marginBottom: 12 }}>
          <Button danger disabled={!selectedRowKeys.length || !canUpdate} onClick={() => void batchDelete()}>删除</Button>
        </Space>
        <Table<EmployeeItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/hr/employees/${record.id}`),
          })}
          columns={[
            { title: '姓名', dataIndex: 'name' },
            { title: '邮箱', dataIndex: 'email' },
            { title: '部门', dataIndex: 'department', render: (v?: string) => v || '-' },
            { title: '岗位', dataIndex: 'title', render: (v?: string) => v || '-' },
            { title: '电话', dataIndex: 'phone', render: (v?: string) => v || '-' },
            { title: '状态', dataIndex: 'status', render: (v: EmployeeStatus) => <Tag>{v}</Tag> },
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
    </Space>
  );
}

function HrEmployeeFormPage({
  mode,
  canCreate,
  canUpdate,
}: {
  mode: 'create' | 'edit';
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form] = Form.useForm<{
    name: string;
    email: string;
    phone?: string;
    department?: string;
    title?: string;
    status: EmployeeStatus;
  }>();

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    setLoadingDetail(true);
    api<EmployeeItem>(`/hr/employees/${id}`, undefined, true)
      .then((res) => form.setFieldsValue(res))
      .catch((error) => message.error(parseError(error)))
      .finally(() => setLoadingDetail(false));
  }, [form, id, message, mode]);

  const disabled = mode === 'create' ? !canCreate : !canUpdate;

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (mode === 'edit' && id) {
        await api(`/hr/employees/${id}`, { method: 'PATCH', body: JSON.stringify(values) }, true);
        message.success('员工已更新');
        navigate(`/hr/employees/${id}`);
      } else {
        await api('/hr/employees', { method: 'POST', body: JSON.stringify(values) }, true);
        message.success('员工已创建');
        navigate('/hr/employees');
      }
    } catch (error) {
      if (error instanceof Error) message.error(parseError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className="keep-card-head"
      title={mode === 'edit' ? '编辑员工' : '新建员工'}
      extra={
        <Space>
          <Button onClick={() => navigate(mode === 'edit' && id ? `/hr/employees/${id}` : '/hr/employees')}>取消</Button>
          <Button type="primary" disabled={disabled} loading={saving} onClick={() => void submitForm()}>
            {mode === 'edit' ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'ACTIVE' }}>
        <div className="grid-form" style={{ gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))' }}>
          <Form.Item label="姓名" name="name" rules={[{ required: true, min: 2 }]}>
            <Input disabled={loadingDetail} />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input disabled={loadingDetail} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select
              disabled={loadingDetail}
              options={[
                { label: '在职', value: 'ACTIVE' },
                { label: '离职', value: 'INACTIVE' },
              ]}
            />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input disabled={loadingDetail} />
          </Form.Item>
          <Form.Item label="部门" name="department" style={{ gridColumn: 'span 2' }}>
            <Input disabled={loadingDetail} />
          </Form.Item>
          <Form.Item label="岗位" name="title" style={{ gridColumn: 'span 2' }}>
            <Input disabled={loadingDetail} />
          </Form.Item>
        </div>
      </Form>
    </Card>
  );
}

function HrEmployeeShowPage({ canUpdate }: { canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeeItem | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<EmployeeItem>(`/hr/employees/${id}`, undefined, true)
      .then((res) => setData(res))
      .catch((error) => message.error(parseError(error)))
      .finally(() => setLoading(false));
  }, [id, message]);

  return (
    <Card
      className="keep-card-head"
      title="员工详情"
      loading={loading}
      extra={
        <Space>
          <Button onClick={() => navigate('/hr/employees')}>返回列表</Button>
          <Button type="primary" disabled={!canUpdate || !id} onClick={() => navigate(`/hr/employees/${id}/edit`)}>
            编辑
          </Button>
        </Space>
      }
    >
      {data ? (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="姓名">{data.name}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{data.email}</Descriptions.Item>
          <Descriptions.Item label="状态">{data.status}</Descriptions.Item>
          <Descriptions.Item label="电话">{data.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="部门">{data.department || '-'}</Descriptions.Item>
          <Descriptions.Item label="岗位">{data.title || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{new Date(data.updatedAt).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Card>
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


const DEFAULT_RISK_CONTROL_CONTENT: RiskControlConfigContent = {
  enabled: true,
  scenes: {
    login: {
      enabled: true,
      thresholds: { perMinute: 20, perHour: 100 },
      captchaAfterFailures: 5,
      captchaTtlSec: 1800,
      blockAfterFailures: 20,
      blockTtlSec: 3600,
      retryAfterSec: 60,
    },
    register: {
      enabled: true,
      thresholds: { perMinute: 5, perHour: 20 },
      captchaAfterFailures: 2,
      captchaTtlSec: 1800,
      blockAfterFailures: 10,
      blockTtlSec: 3600,
      retryAfterSec: 120,
    },
    forgotPassword: {
      enabled: true,
      thresholds: { perMinute: 1, perHour: 5, perDay: 10 },
      captchaAfterFailures: 3,
      captchaTtlSec: 1800,
      blockAfterFailures: 10,
      blockTtlSec: 86400,
      retryAfterSec: 300,
    },
  },
  whitelist: { ips: [], accounts: [] },
  blacklist: { ips: [], accounts: [] },
  degradePolicy: { redisUnavailable: 'ALLOW_WITH_CAPTCHA' },
};

function linesToArray(value?: string) {
  return (value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(value?: string[]) {
  return (value ?? []).join('\n');
}

function RiskControlPage({ canUpdate }: { canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [config, setConfig] = useState<RiskControlConfigResponse | null>(null);
  const [versions, setVersions] = useState<RiskControlVersionItem[]>([]);
  const [resettingIp, setResettingIp] = useState(false);
  const [resettingAccount, setResettingAccount] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);
  const [userOptionsLoading, setUserOptionsLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);

  const loadVersions = async () => {
    setVersionsLoading(true);
    try {
      const data = await api<RiskControlVersionItem[]>('/risk-control/versions', undefined, true);
      setVersions(data);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setVersionsLoading(false);
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api<RiskControlConfigResponse>('/risk-control/config', undefined, true);
      setConfig(data);
      form.setFieldsValue({
        enabled: data.content.enabled,
        degradePolicy: data.content.degradePolicy.redisUnavailable,
        whitelistIps: arrayToLines(data.content.whitelist.ips),
        whitelistAccounts: arrayToLines(data.content.whitelist.accounts),
        blacklistIps: arrayToLines(data.content.blacklist.ips),
        blacklistAccounts: arrayToLines(data.content.blacklist.accounts),
        resetScenes: ['login', 'register', 'forgotPassword'],
        scenes: data.content.scenes,
      });
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadUserOptions = async () => {
    setUserOptionsLoading(true);
    try {
      const data = await api<ListUsersResponse>('/users?page=1&pageSize=0', undefined, true);
      setUserOptions(
        (data.data ?? []).map((item) => {
          const account = item.username || item.email || item.id;
          const displayName = item.name || item.username || item.email || item.id;
          return {
            value: account,
            label: `${displayName}（${account}）`,
          };
        }),
      );
    } catch (error) {
      message.error(`加载用户选项失败：${parseError(error)}`);
    } finally {
      setUserOptionsLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
    void loadVersions();
    void loadUserOptions();
  }, []);

  const buildPayload = async () => {
    const values = await form.validateFields();
    return {
      content: {
        enabled: !!values.enabled,
        scenes: values.scenes ?? DEFAULT_RISK_CONTROL_CONTENT.scenes,
        whitelist: {
          ips: linesToArray(values.whitelistIps),
          accounts: linesToArray(values.whitelistAccounts),
        },
        blacklist: {
          ips: linesToArray(values.blacklistIps),
          accounts: linesToArray(values.blacklistAccounts),
        },
        degradePolicy: {
          redisUnavailable: values.degradePolicy ?? 'ALLOW_WITH_CAPTCHA',
        },
      },
    };
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const payload = await buildPayload();
      await api('/risk-control/config', { method: 'PUT', body: JSON.stringify(payload) }, true);
      message.success('风控配置草稿已保存');
      await loadVersions();
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await api('/risk-control/publish', { method: 'POST', body: JSON.stringify({}) }, true);
      message.success('风控配置已发布');
      await loadConfig();
      await loadVersions();
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setPublishing(false);
    }
  };

  const rollback = async (version: number) => {
    try {
      await api('/risk-control/rollback', { method: 'POST', body: JSON.stringify({ version }) }, true);
      message.success(`已回滚到版本 ${version}`);
      await loadConfig();
      await loadVersions();
    } catch (error) {
      message.error(parseError(error));
    }
  };

  const resetRiskByIp = async () => {
    const ip = String(form.getFieldValue('resetIp') ?? '').trim();
    const scenes = (form.getFieldValue('resetScenes') ?? ['login', 'register', 'forgotPassword']) as RiskSceneCode[];
    if (!ip) {
      message.warning('请输入要重置的 IP');
      return;
    }

    setResettingIp(true);
    try {
      const result = await api<{ deletedKeys: number; storage: string; target: string }>('/risk-control/reset/ip', {
        method: 'POST',
        body: JSON.stringify({ ip, scenes }),
      }, true);
      message.success(`IP ${result.target} 风控状态已重置，清理 ${result.deletedKeys} 个键（${result.storage}）`);
      form.setFieldValue('resetIp', '');
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setResettingIp(false);
    }
  };

  const resetRiskByAccount = async () => {
    const account = String(form.getFieldValue('resetAccount') ?? '').trim();
    const scenes = (form.getFieldValue('resetScenes') ?? ['login', 'register', 'forgotPassword']) as RiskSceneCode[];
    if (!account) {
      message.warning('请选择要重置的用户/账号');
      return;
    }

    setResettingAccount(true);
    try {
      const result = await api<{ deletedKeys: number; storage: string; target: string }>('/risk-control/reset/account', {
        method: 'POST',
        body: JSON.stringify({ account, scenes }),
      }, true);
      message.success(`账号 ${result.target} 风控状态已重置，清理 ${result.deletedKeys} 个键（${result.storage}）`);
      form.setFieldValue('resetAccount', undefined);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setResettingAccount(false);
    }
  };

  const resetRiskAll = async () => {
    const ip = String(form.getFieldValue('resetIp') ?? '').trim();
    const account = String(form.getFieldValue('resetAccount') ?? '').trim();
    const scenes = (form.getFieldValue('resetScenes') ?? ['login', 'register', 'forgotPassword']) as RiskSceneCode[];
    if (!ip || !account) {
      message.warning('一键双重置需要同时填写 IP 和用户/账号');
      return;
    }

    setResettingAll(true);
    try {
      const result = await api<{ deletedKeys: number; storage: string }>('/risk-control/reset/all', {
        method: 'POST',
        body: JSON.stringify({ ip, account, scenes }),
      }, true);
      message.success(`IP + 账号风控状态已双重置，清理 ${result.deletedKeys} 个键（${result.storage}）`);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setResettingAll(false);
    }
  };

  const sceneCards: Array<{
    key: RiskSceneCode;
    title: string;
    summary: string;
    tips: string[];
    recommended: string;
  }> = [
    {
      key: 'login',
      title: '登录风控',
      summary: '用于拦截账号撞库、密码爆破、异常高频登录请求。适合控制同一 IP 或账号的短时间重复登录。',
      tips: ['登录失败较多时，优先提高验证码触发灵敏度。', '封禁阈值不要低于验证码阈值，避免正常用户被直接封死。'],
      recommended: '建议：每分钟 20 次、每小时 100 次、失败 5 次触发验证码、失败 20 次封禁。',
    },
    {
      key: 'register',
      title: '注册风控',
      summary: '用于防止恶意批量注册、脚本刷号、频繁提交注册接口。适合对注册频率做更严格限制。',
      tips: ['注册通常比登录更敏感，建议阈值设置更低。', '如近期遭遇批量注册，可先拉高黑名单和封禁时长。'],
      recommended: '建议：每分钟 5 次、每小时 20 次、失败 2 次触发验证码、失败 10 次封禁。',
    },
    {
      key: 'forgotPassword',
      title: '忘记密码风控',
      summary: '用于防止恶意刷找回密码、频繁发送重置邮件，降低邮箱轰炸和账号探测风险。',
      tips: ['忘记密码建议加上每日阈值，防止长时间慢刷。', '该场景对用户体验敏感，Retry-After 提示建议写得更长一些。'],
      recommended: '建议：每分钟 1 次、每小时 5 次、每天 10 次、失败 3 次触发验证码、失败 10 次封禁。',
    },
  ];

  const resetSceneOptions = [
    { label: '登录', value: 'login' },
    { label: '注册', value: 'register' },
    { label: '忘记密码', value: 'forgotPassword' },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title="风控配置"
        loading={loading}
        extra={
          <Space>
            <Button onClick={() => { void loadConfig(); void loadVersions(); }}>刷新</Button>
            <Button onClick={() => void saveDraft()} loading={saving} disabled={!canUpdate}>保存草稿</Button>
            <Button type="primary" onClick={() => void publish()} loading={publishing} disabled={!canUpdate}>发布</Button>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card type="inner" title="操作说明" size="small">
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              这页用于配置 <strong>登录、注册、忘记密码</strong> 三类接口的风控规则。推荐操作顺序：
              <strong>先改草稿 → 再保存草稿 → 确认无误后发布</strong>。
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
              字段理解：阈值控制请求频率；"失败几次触发验证码"表示进入更严格校验；"失败几次封禁"表示直接限制该 IP/账号继续请求；
              Retry-After 会影响前端/客户端提示的等待秒数。
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              黑白名单优先级最高：白名单可跳过常规限制，黑名单会直接拦截。修改完成后记得点击"发布"，只保存草稿不会立即生效。
            </Typography.Paragraph>
          </Card>

          <Form form={form} layout="vertical" initialValues={{
            enabled: true,
            degradePolicy: 'ALLOW_WITH_CAPTCHA',
            resetScenes: ['login', 'register', 'forgotPassword'],
            scenes: DEFAULT_RISK_CONTROL_CONTENT.scenes,
          }}>
            <Card type="inner" title="全局策略" style={{ marginBottom: 16 }}>
              <Space size={24} wrap align="start">
                <Form.Item
                  label="总开关"
                  name="enabled"
                  valuePropName="checked"
                  extra="关闭后，登录/注册/忘记密码三类风控规则都不会生效。"
                >
                  <Switch disabled={!canUpdate} />
                </Form.Item>
                <Form.Item
                  label="Redis 不可用时策略"
                  name="degradePolicy"
                  extra="ALLOW_WITH_CAPTCHA 表示尽量放行但走更严格校验；BLOCK_REQUESTS 表示 Redis 异常时直接拒绝请求。"
                >
                  <Select
                    disabled={!canUpdate}
                    style={{ width: 320 }}
                    options={[
                      { label: '允许请求并强制验证码', value: 'ALLOW_WITH_CAPTCHA' },
                      { label: '直接阻断请求', value: 'BLOCK_REQUESTS' },
                    ]}
                  />
                </Form.Item>
              </Space>
            </Card>

            {sceneCards.map((scene) => (
              <Card
                key={scene.key}
                type="inner"
                style={{ marginBottom: 24 }}
              >
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Typography.Title level={5} style={{ margin: 0, textAlign: 'left' }}>
                    {scene.title}
                  </Typography.Title>

                  <Card size="small" style={{ background: '#fafafa' }}>
                    <Typography.Paragraph style={{ marginBottom: 8 }}>
                      {scene.summary}
                    </Typography.Paragraph>
                    <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                      <strong>推荐起步值：</strong>{scene.recommended}
                    </Typography.Paragraph>
                    <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(0,0,0,0.65)' }}>
                      {scene.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </Card>

                  <Divider style={{ margin: 0 }} />

                  <Space size={24} wrap align="start">
                    <Form.Item
                      label="启用"
                      name={['scenes', scene.key, 'enabled']}
                      valuePropName="checked"
                      extra="关闭后，该场景不参与风控判断。"
                    >
                      <Switch disabled={!canUpdate} />
                    </Form.Item>
                    <Form.Item
                      label="每分钟阈值"
                      name={['scenes', scene.key, 'thresholds', 'perMinute']}
                      extra="限制单 IP/账号 1 分钟内的请求次数。"
                    >
                      <Input type="number" min={1} disabled={!canUpdate} style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item
                      label="每小时阈值"
                      name={['scenes', scene.key, 'thresholds', 'perHour']}
                      extra="限制单 IP/账号 1 小时内的请求次数。"
                    >
                      <Input type="number" min={1} disabled={!canUpdate} style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item
                      label="每天阈值"
                      name={['scenes', scene.key, 'thresholds', 'perDay']}
                      extra="适合忘记密码这类需要防慢速刷接口的场景。"
                    >
                      <Input type="number" min={1} disabled={!canUpdate} style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item
                      label="失败几次触发验证码"
                      name={['scenes', scene.key, 'captchaAfterFailures']}
                      extra="达到该次数后，请求会进入更严格的人机校验。"
                    >
                      <Input type="number" min={1} disabled={!canUpdate} style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item
                      label="验证码有效期(秒)"
                      name={['scenes', scene.key, 'captchaTtlSec']}
                      extra="验证码触发后，在这段时间内保持有效。"
                    >
                      <Input type="number" min={60} disabled={!canUpdate} style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item
                      label="失败几次封禁"
                      name={['scenes', scene.key, 'blockAfterFailures']}
                      extra="达到该次数后，将直接拒绝请求。"
                    >
                      <Input type="number" min={1} disabled={!canUpdate} style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item
                      label="封禁时长(秒)"
                      name={['scenes', scene.key, 'blockTtlSec']}
                      extra="命中封禁后，需要等待多久才能再次请求。"
                    >
                      <Input type="number" min={60} disabled={!canUpdate} style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item
                      label="Retry-After(秒)"
                      name={['scenes', scene.key, 'retryAfterSec']}
                      extra="返回给前端或客户端的建议等待时间。"
                    >
                      <Input type="number" min={1} disabled={!canUpdate} style={{ width: 160 }} />
                    </Form.Item>
                  </Space>
                </Space>
              </Card>
            ))}

            <Card type="inner" title="黑白名单说明与维护">
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                白名单适合放可信办公 IP、内部测试账号，避免误伤；黑名单适合放已确认的恶意 IP 或攻击账号。每行一个值，保存后发布才会生效。
              </Typography.Paragraph>
              <Space size={16} align="start" wrap style={{ width: '100%' }}>
                <Form.Item
                  label="IP 白名单"
                  name="whitelistIps"
                  style={{ minWidth: 260, flex: 1 }}
                  extra="这些 IP 默认跳过常规风控校验。"
                >
                  <Input.TextArea rows={6} disabled={!canUpdate} placeholder="每行一个 IP，如 127.0.0.1" />
                </Form.Item>
                <Form.Item
                  label="账号白名单"
                  name="whitelistAccounts"
                  style={{ minWidth: 260, flex: 1 }}
                  extra="这些账号默认跳过常规风控校验。"
                >
                  <Input.TextArea rows={6} disabled={!canUpdate} placeholder="每行一个账号，如 admin" />
                </Form.Item>
                <Form.Item
                  label="IP 黑名单"
                  name="blacklistIps"
                  style={{ minWidth: 260, flex: 1 }}
                  extra="这些 IP 会被直接拦截。"
                >
                  <Input.TextArea rows={6} disabled={!canUpdate} placeholder="每行一个 IP，如 10.0.0.8" />
                </Form.Item>
                <Form.Item
                  label="账号黑名单"
                  name="blacklistAccounts"
                  style={{ minWidth: 260, flex: 1 }}
                  extra="这些账号会被直接拦截。"
                >
                  <Input.TextArea rows={6} disabled={!canUpdate} placeholder="每行一个账号，如 test-bot" />
                </Form.Item>
              </Space>
            </Card>

            <Card type="inner" title="重置风控状态">
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                用于临时解除某个 IP 或账号的风控计数/封禁。支持选择作用场景，默认重置全部场景。
              </Typography.Paragraph>

              <Form.Item label="作用场景" name="resetScenes">
                <Checkbox.Group options={resetSceneOptions} disabled={!canUpdate} />
              </Form.Item>

              <Space size={24} align="start" wrap style={{ width: '100%' }}>
                <Card size="small" title="按 IP 重置" style={{ minWidth: 320, flex: 1 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item name="resetIp" label="IP 地址" style={{ marginBottom: 8 }}>
                      <Input placeholder="例如 127.0.0.1" disabled={!canUpdate} />
                    </Form.Item>
                    <Button type="primary" onClick={() => void resetRiskByIp()} loading={resettingIp} disabled={!canUpdate}>
                      重置该 IP 风控
                    </Button>
                  </Space>
                </Card>

                <Card size="small" title="按用户/账号重置" style={{ minWidth: 320, flex: 1 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item name="resetAccount" label="用户账号" style={{ marginBottom: 8 }}>
                      <Select
                        showSearch
                        allowClear
                        placeholder="选择或搜索用户"
                        loading={userOptionsLoading}
                        options={userOptions}
                        optionFilterProp="label"
                        disabled={!canUpdate}
                      />
                    </Form.Item>
                    <Button type="primary" onClick={() => void resetRiskByAccount()} loading={resettingAccount} disabled={!canUpdate}>
                      重置该账号风控
                    </Button>
                  </Space>
                </Card>
              </Space>

              <Alert
                type="info"
                showIcon
                message="一键双重置"
                description="如果同一个用户同时命中了账号维度和当前 IP 维度，可以直接用这一键双重置同时清掉两条线。"
                style={{ marginTop: 16, marginBottom: 16 }}
              />
              <Button type="primary" danger onClick={() => void resetRiskAll()} loading={resettingAll} disabled={!canUpdate}>
                一键双重置（IP + 账号）
              </Button>
            </Card>

            <Card type="inner" title="操作区">
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                保存草稿仅保存当前编辑内容，不会立刻影响线上；点击"发布生效"后，当前草稿才会成为正式风控配置。
              </Typography.Paragraph>
              <Space wrap>
                <Button onClick={() => { void loadConfig(); void loadVersions(); }}>刷新配置</Button>
                <Button type="default" onClick={() => void saveDraft()} loading={saving} disabled={!canUpdate}>
                  保存草稿
                </Button>
                <Button type="primary" onClick={() => void publish()} loading={publishing} disabled={!canUpdate}>
                  发布生效
                </Button>
              </Space>
            </Card>
          </Form>
        </Space>
      </Card>

      <Card title={`版本列表${config ? `（当前生效：v${config.version}）` : ''}`} loading={versionsLoading}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          "保存草稿"只会更新草稿版本；"发布"后才会成为线上生效配置；如发布后有问题，可在下方选择历史版本回滚。
        </Typography.Paragraph>
        <Table<RiskControlVersionItem>
          rowKey="id"
          dataSource={versions}
          pagination={false}
          columns={[
            { title: '版本', dataIndex: 'version', key: 'version', width: 90 },
            { title: '状态', dataIndex: 'status', key: 'status', width: 120, render: (value: string) => <Tag color={value === 'PUBLISHED' ? 'green' : value === 'DRAFT' ? 'orange' : 'default'}>{value}</Tag> },
            { title: '说明', dataIndex: 'comment', key: 'comment', render: (value?: string | null) => value || '-' },
            { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 180, render: (value?: string | null) => value ? new Date(value).toLocaleString() : '-' },
            {
              title: '操作', key: 'actions', width: 120,
              render: (_: unknown, record) => (
                <Button size="small" disabled={!canUpdate || record.status === 'PUBLISHED'} onClick={() => void rollback(record.version)}>
                  回滚
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </Space>
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
  const canDashboardRead = can('dashboard.read');
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
  const canRiskRead = can('risk.read');
  const canRiskUpdate = can('risk.update');
  const canLoginHistoryRead = can('login-history.read');
  const canBlogCategoryRead = can('blog-category.read');
  const canBlogCategoryCreate = can('blog-category.create');
  const canBlogCategoryUpdate = can('blog-category.update');
  const canBlogCategoryAccess = canBlogCategoryRead || canBlogCategoryCreate || canBlogCategoryUpdate;
  const canBlogPostRead = can('blog-post.read');
  const canBlogPostCreate = can('blog-post.create');
  const canBlogPostUpdate = can('blog-post.update');
  const canBlogPostAccess = canBlogPostRead || canBlogPostCreate || canBlogPostUpdate;

  useEffect(() => {
    if (!user?.permissions?.length) return;
    if (modules.length === 0 && canModuleRead) return;

    const isRouteForbidden =
      (location.pathname.startsWith('/users') && !canUsersRead) ||
      (location.pathname.startsWith('/audit-logs') && !canAuditRead) ||
      (location.pathname.startsWith('/projects') && !canProjectRead) ||
      (location.pathname.startsWith('/emails') && !canDashboardRead) ||
      (location.pathname.startsWith('/hr') && !canHrRead) ||
      (location.pathname.startsWith('/settings/system') && !canSettingsRead) ||
      (location.pathname.startsWith('/settings/modules') && !canModuleRead) ||
      (location.pathname.startsWith('/settings/rbac') && !canRbacRead) ||
      (location.pathname.startsWith('/settings/risk-control') && !canRiskRead) ||
      (location.pathname.startsWith('/login-history') && !canLoginHistoryRead) ||
      (location.pathname.startsWith('/blog/categories') && !canBlogCategoryAccess) ||
      (location.pathname.startsWith('/blog/posts') && !canBlogPostAccess);

    const isRouteDisabledByModule =
      (location.pathname.startsWith('/users') && !enabledModuleCodes.has('users')) ||
      (location.pathname.startsWith('/audit-logs') && !enabledModuleCodes.has('audit')) ||
      (location.pathname.startsWith('/projects') && !enabledModuleCodes.has('project')) ||
      (location.pathname.startsWith('/hr') && !enabledModuleCodes.has('hr')) ||
      (location.pathname.startsWith('/settings/risk-control') && !enabledModuleCodes.has('risk-control')) ||
      (location.pathname.startsWith('/login-history') && !enabledModuleCodes.has('login-history')) ||
      (location.pathname.startsWith('/blog') && !enabledModuleCodes.has('blog'));

    if (isRouteForbidden || isRouteDisabledByModule) {
      message.warning('当前无权限或模块已关闭，已为你跳转到仪表盘');
      navigate('/dashboard', { replace: true });
    }
  }, [
    canAuditRead,
    canDashboardRead,
    canHrRead,
    canModuleRead,
    canProjectRead,
    canUsersRead,
    canRbacRead,
    canRiskRead,
    canSettingsRead,
    enabledModuleCodes,
    location.pathname,
    message,
    modules.length,
    navigate,
    user?.permissions?.length,
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
      items.push({ title: <Link to="/projects">项目管理</Link> });
      if (location.pathname.endsWith('/create')) items.push({ title: '新建' });
      else if (location.pathname.endsWith('/edit')) items.push({ title: '编辑' });
      else if (location.pathname !== '/projects') items.push({ title: '详情' });
    } else if (location.pathname.startsWith('/hr/employees')) {
      items.push({ title: <Link to="/hr/employees">人员管理</Link> });
      if (location.pathname.endsWith('/create')) items.push({ title: '新建' });
      else if (location.pathname.endsWith('/edit')) items.push({ title: '编辑' });
      else if (location.pathname !== '/hr/employees') items.push({ title: '详情' });
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
    } else if (location.pathname.startsWith('/settings/risk-control')) {
      items.push({ title: '配置' }, { title: '风控配置' });
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
              {canRiskRead ? <Route path="/settings/risk-control" element={<RiskControlPage canUpdate={canRiskUpdate} />} /> : null}
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
                      />
                    }
                  />
                  <Route path="/users/create" element={<UserCreatePage />} />
                  <Route path="/users/:id" element={<UserShowPage />} />
                  <Route path="/users/:id/edit" element={<UserEditPage />} />
                </>
              ) : null}

              {canProjectRead ? (
                <>
                  <Route
                    path="/projects"
                    element={<ProjectPage canCreate={canProjectCreate} canUpdate={canProjectUpdate} />}
                  />
                  <Route
                    path="/projects/create"
                    element={<ProjectFormPage mode="create" canCreate={canProjectCreate} canUpdate={canProjectUpdate} />}
                  />
                  <Route
                    path="/projects/:id"
                    element={<ProjectShowPage canUpdate={canProjectUpdate} />}
                  />
                  <Route
                    path="/projects/:id/edit"
                    element={<ProjectFormPage mode="edit" canCreate={canProjectCreate} canUpdate={canProjectUpdate} />}
                  />
                </>
              ) : null}

              {canDashboardRead ? <Route path="/emails/send" element={<EmailSendCenterPage />} /> : null}

              {canHrRead ? (
                <>
                  <Route
                    path="/hr/employees"
                    element={<HrEmployeesPage canCreate={canHrCreate} canUpdate={canHrUpdate} />}
                  />
                  <Route
                    path="/hr/employees/create"
                    element={<HrEmployeeFormPage mode="create" canCreate={canHrCreate} canUpdate={canHrUpdate} />}
                  />
                  <Route
                    path="/hr/employees/:id"
                    element={<HrEmployeeShowPage canUpdate={canHrUpdate} />}
                  />
                  <Route
                    path="/hr/employees/:id/edit"
                    element={<HrEmployeeFormPage mode="edit" canCreate={canHrCreate} canUpdate={canHrUpdate} />}
                  />
                </>
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
                <>
                  <Route path="/settings/rbac" element={<RbacRoleListPage canUpdate={canRbacUpdate} />} />
                  <Route path="/settings/rbac/create" element={<RbacRoleEditorPage canUpdate={canRbacUpdate} />} />
                  <Route path="/settings/rbac/:code" element={<RbacRoleEditorPage canUpdate={canRbacUpdate} />} />
                </>
              ) : null}

              {canAuditRead ? <Route path="/audit-logs" element={<AuditLogsPage />} /> : null}
              {canLoginHistoryRead ? <Route path="/login-history" element={<LoginHistoryPage />} /> : null}
              {canBlogCategoryAccess ? (
                <>
                  <Route
                    path="/blog/categories"
                    element={<BlogCategoryListPage canCreate={canBlogCategoryCreate} canUpdate={canBlogCategoryUpdate} />}
                  />
                  <Route
                    path="/blog/categories/create"
                    element={<BlogCategoryFormPage mode="create" canCreate={canBlogCategoryCreate} canUpdate={canBlogCategoryUpdate} />}
                  />
                  <Route path="/blog/categories/:id" element={<BlogCategoryShowPage canUpdate={canBlogCategoryUpdate} />} />
                  <Route
                    path="/blog/categories/:id/edit"
                    element={<BlogCategoryFormPage mode="edit" canCreate={canBlogCategoryCreate} canUpdate={canBlogCategoryUpdate} />}
                  />
                </>
              ) : null}
              {canBlogPostAccess ? (
                <>
                  <Route
                    path="/blog/posts"
                    element={<BlogPostListPage canCreate={canBlogPostCreate} canUpdate={canBlogPostUpdate} />}
                  />
                  <Route
                    path="/blog/posts/create"
                    element={<BlogPostFormPage mode="create" canCreate={canBlogPostCreate} canUpdate={canBlogPostUpdate} />}
                  />
                  <Route path="/blog/posts/:id" element={<BlogPostShowPage canUpdate={canBlogPostUpdate} />} />
                  <Route
                    path="/blog/posts/:id/edit"
                    element={<BlogPostFormPage mode="edit" canCreate={canBlogPostCreate} canUpdate={canBlogPostUpdate} />}
                  />
                </>
              ) : null}
              <Route path="/salary" element={<Card title="薪酬管理">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/procurement" element={<Card title="采购管理">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/inventory" element={<Card title="库存管理">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/asset" element={<Card title="资产管理">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/ledger" element={<Card title="总账管理">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/department-cost" element={<Card title="科室成本">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/project-cost" element={<Card title="项目成本">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/disease-cost" element={<Card title="病种成本">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/income" element={<Card title="收入管理">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/budget" element={<Card title="预算管理">模块骨架已创建，后续可继续扩展。</Card>} />
              <Route path="/performance" element={<Card title="绩效管理">模块骨架已创建，后续可继续扩展。</Card>} />
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
  const navigate = useNavigate();
  const location = useLocation();
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
  const [authCaptcha, setAuthCaptcha] = useState<CaptchaResponse | null>(null);
  const [forgotCaptcha, setForgotCaptcha] = useState<CaptchaResponse | null>(null);
  const [authCaptchaRequired, setAuthCaptchaRequired] = useState(false);
  const [forgotCaptchaRequired, setForgotCaptchaRequired] = useState(false);

  const [authForm] = Form.useForm<{ username: string; email?: string; name?: string; password: string; captchaCode?: string }>();
  const [forgotForm] = Form.useForm<{ username?: string; email?: string; captchaCode?: string }>();

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

  const loadCaptcha = async (scene: RiskSceneCode) => {
    const data = await api<CaptchaResponse>(`/auth/captcha?scene=${scene}`);
    if (scene === 'forgotPassword') {
      setForgotCaptcha(data);
      return;
    }
    setAuthCaptcha(data);
  };

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

  const onSubmitAuth = async (values: { username: string; email?: string; name?: string; password: string; captchaCode?: string }) => {
    setAuthLoading(true);
    try {
      const payloadBase = {
        username: values.username,
        password: values.password,
        captchaId: authCaptcha?.captchaId,
        captchaCode: values.captchaCode,
      };

      const payload =
        mode === 'login'
          ? payloadBase
          : {
              ...payloadBase,
              email: values.email,
              name: values.name,
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
      authForm.resetFields(['password', 'captchaCode']);
      setAuthCaptchaRequired(false);
      setAuthCaptcha(null);
    } catch (error) {
      const payload = parseApiErrorPayload(error);
      if (payload?.needCaptcha) {
        setAuthCaptchaRequired(true);
        if (!authCaptcha) {
          try {
            await loadCaptcha(payload.scene ?? (mode === 'login' ? 'login' : 'register'));
          } catch {
            // ignore load failure
          }
        }
      }
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
          captchaId: forgotCaptcha?.captchaId,
          captchaCode: values.captchaCode,
        }),
      });
      if (res.ok) {
        message.success(res.message);
        setForgotOpen(false);
        forgotForm.resetFields();
        setForgotCaptchaRequired(false);
        setForgotCaptcha(null);
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      const payload = parseApiErrorPayload(error);
      if (payload?.needCaptcha) {
        setForgotCaptchaRequired(true);
        if (!forgotCaptcha) {
          try {
            await loadCaptcha('forgotPassword');
          } catch {
            // ignore load failure
          }
        }
      }
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
    const isAuthEntry = location.pathname === '/login' || location.pathname === '/register';

    if (!isAuthEntry) {
      return (
        <ConfigProvider theme={authTheme}>
          <LandingPage
            systemTitle={publicSystemTitle}
            primaryColor={branding.primaryColor}
            onStart={() => {
              setMode('login');
              setAuthCaptchaRequired(false);
              setAuthCaptcha(null);
              authForm.resetFields(['captchaCode']);
              navigate('/login');
            }}
          />
        </ConfigProvider>
      );
    }

    return (
      <ConfigProvider theme={authTheme}>
        <div className={`auth-page skin-${effectiveSkin}`}>
          <div className="auth-standalone-shell">
            <Card className="auth-card auth-card-compact auth-card-standalone" bordered={false}>
              <div className="auth-panel-form auth-panel-form-single">
                <Form form={authForm} layout="vertical" onFinish={onSubmitAuth} className="auth-form">
                  <div className="auth-header auth-center-text">
                    <Typography.Text className="auth-kicker">{mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</Typography.Text>
                    <Typography.Title level={3} className="auth-title">
                      {mode === 'login' ? '登录 Motila' : '注册 Motila 账号'}
                    </Typography.Title>
                    <Typography.Paragraph className="auth-subtitle">
                      {mode === 'login' ? '输入账号密码，进入你的系统工作台。' : '创建账号后即可进入系统。'}
                    </Typography.Paragraph>
                  </div>

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

                      <Form.Item label="昵称" name="name" rules={[{ required: true, min: 2, message: '昵称至少2位' }]}> 
                        <Input size="large" placeholder="请输入昵称" />
                      </Form.Item>
                    </>
                  )}

                  <Form.Item label="密码" name="password" rules={[{ required: true, min: 1, message: '密码不能为空' }]}> 
                    <Input.Password size="large" placeholder="请输入密码" />
                  </Form.Item>

                  {authCaptchaRequired && authCaptcha ? (
                    <>
                      <Form.Item
                        label="验证码"
                        name="captchaCode"
                        rules={[{ required: true, message: '请输入验证码' }]}
                        extra="验证码默认 5 分钟内有效，不区分大小写。"
                      >
                        <Space.Compact style={{ width: '100%' }}>
                          <Input size="large" placeholder="输入图中验证码" maxLength={16} />
                          <Button onClick={() => void loadCaptcha(mode === 'login' ? 'login' : 'register')}>换一张</Button>
                        </Space.Compact>
                      </Form.Item>
                      <div style={{ marginTop: -8, marginBottom: 16 }}>
                        <img
                          src={authCaptcha.imageData}
                          alt="captcha"
                          style={{ height: 44, cursor: 'pointer', borderRadius: 8, border: '1px solid #f0f0f0', background: '#fff' }}
                          onClick={() => void loadCaptcha(mode === 'login' ? 'login' : 'register')}
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="auth-actions">
                    <Button type="primary" htmlType="submit" loading={authLoading} size="large" block>
                      {mode === 'login' ? '立即登录' : '立即注册'}
                    </Button>

                    {mode === 'login' ? (
                      <Space size={16}>
                        <Typography.Link className="auth-mode-link" onClick={() => {
                          setMode('register');
                          setAuthCaptchaRequired(false);
                          setAuthCaptcha(null);
                          authForm.resetFields(['captchaCode']);
                          navigate('/register');
                        }}>
                          注册账号
                        </Typography.Link>
                        <Typography.Link
                          className="auth-mode-link"
                          onClick={() => {
                            setForgotOpen(true);
                            setForgotCaptchaRequired(false);
                            setForgotCaptcha(null);
                            forgotForm.resetFields(['captchaCode']);
                            forgotForm.setFieldsValue({ username: authForm.getFieldValue('username') });
                          }}
                        >
                          忘记密码
                        </Typography.Link>
                      </Space>
                    ) : (
                      <Typography.Link className="auth-mode-link" onClick={() => {
                        setMode('login');
                        setAuthCaptchaRequired(false);
                        setAuthCaptcha(null);
                        authForm.resetFields(['captchaCode']);
                        navigate('/login');
                      }}>
                        返回登录
                      </Typography.Link>
                    )}
                  </div>
                </Form>
              </div>
            </Card>
          </div>

          <Modal
            title="邮箱找回密码"
            open={forgotOpen}
            onCancel={() => {
              setForgotOpen(false);
              setForgotCaptchaRequired(false);
              setForgotCaptcha(null);
              forgotForm.resetFields(['captchaCode']);
            }}
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
              {forgotCaptchaRequired && forgotCaptcha ? (
                <>
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="当前找回密码请求需要验证码"
                    description="为了防止恶意探测，达到风控阈值后必须先通过图形验证码。"
                  />
                  <Form.Item label="验证码" name="captchaCode" rules={[{ required: true, message: '请输入验证码' }]}> 
                    <Space.Compact style={{ width: '100%' }}>
                      <Input placeholder="输入图中验证码" maxLength={16} />
                      <Button onClick={() => void loadCaptcha('forgotPassword')}>换一张</Button>
                    </Space.Compact>
                  </Form.Item>
                  <div style={{ marginTop: -8, marginBottom: 12 }}>
                    <img
                      src={forgotCaptcha.imageData}
                      alt="captcha"
                      style={{ height: 44, cursor: 'pointer', borderRadius: 8, border: '1px solid #f0f0f0', background: '#fff' }}
                      onClick={() => void loadCaptcha('forgotPassword')}
                    />
                  </div>
                </>
              ) : null}
              <Typography.Text type="secondary">用户名和邮箱填一个就行。系统会在账号信息存在且已绑定邮箱时发送临时密码邮件。</Typography.Text>
            </Form>
          </Modal>
        </div>
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
