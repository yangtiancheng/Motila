import {
  App as AntdApp,
  Breadcrumb,
  Button,
  Card,
  ColorPicker,
  ConfigProvider,
  Dropdown,
  Form,
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
} from 'antd';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuditLogsPage } from './audit/AuditLogsPage';
import { buildMenuByRole, type AppRole } from './menu.config';
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

const API_BASE = `http://${window.location.hostname}:3000`;

type UserRole = 'ADMIN' | 'USER';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type UserItem = AuthUser & {
  createdAt: string;
  updatedAt: string;
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

  return (await response.json()) as T;
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
  initialValues?: Partial<{ email: string; name: string; password: string; role: UserRole }>;
  loading: boolean;
  submitText: string;
  onSubmit: (values: { email: string; name: string; password?: string; role: UserRole }) => Promise<void>;
}) {
  const [form] = Form.useForm<{ email: string; name: string; password?: string; role: UserRole }>();

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
        loading={loading}
        submitText={submitText}
        onFinish={async (values: { email: string; name: string; password?: string; role: UserRole }) => {
          await onSubmit(values);
        }}
      />
    </Card>
  );
}

function UsersListPage({ currentUser, onChanged }: { currentUser: AuthUser; onChanged: () => void }) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();

  const { filters, page, pageSize, setPage, setPageSize, applyFilters } = useListState<UserListQueryValues>(
    userListQueryInitialValues,
  );
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<UserItem[]>([]);

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

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters]);

  const columns = [
    { title: '昵称', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (value: UserRole) => (value === 'ADMIN' ? <Tag color="gold">ADMIN</Tag> : <Tag>USER</Tag>),
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
            <Button size="small" onClick={() => navigate(`/users/${record.id}/edit`)}>
              编辑
            </Button>
            <Button
              size="small"
              disabled={disableSelf}
              onClick={async () => {
                try {
                  const nextRole: UserRole = record.role === 'ADMIN' ? 'USER' : 'ADMIN';
                  await api(`/users/${record.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ role: nextRole }),
                  }, true);
                  message.success(`角色已更新为 ${nextRole}`);
                  fetchRows();
                  onChanged();
                } catch (error) {
                  message.error(parseError(error));
                }
              }}
            >
              切换角色
            </Button>
            <Popconfirm
              title="确认删除该用户？"
              okText="删除"
              cancelText="取消"
              disabled={disableSelf}
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
              <Button size="small" danger disabled={disableSelf}>
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
      <Card title="页面搜索">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <SchemaQueryBar<UserListQueryValues>
            fields={userListQueryFields}
            initialValues={filters}
            onSearch={(values) => {
              applyFilters(values);
            }}
            onReset={(values) => {
              applyFilters(values);
            }}
          />
          <div>
            <Button onClick={() => navigate('/users/create')}>新建用户</Button>
          </div>
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
  const [initial, setInitial] = useState<Partial<{ email: string; name: string; role: UserRole }>>({});

  useEffect(() => {
    if (!id) return;
    api<UserItem>(`/users/${id}`, undefined, true)
      .then((res) => setInitial({ email: res.email, name: res.name, role: res.role }))
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
        <Typography.Text>昵称：{data.name}</Typography.Text>
        <Typography.Text>邮箱：{data.email}</Typography.Text>
        <Typography.Text>角色：{data.role}</Typography.Text>
        <Typography.Text>创建时间：{new Date(data.createdAt).toLocaleString()}</Typography.Text>
        <Typography.Text>更新时间：{new Date(data.updatedAt).toLocaleString()}</Typography.Text>
      </Space>
    </Card>
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
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space className="theme-setting-row" size={12} wrap>
          <Typography.Text>皮肤</Typography.Text>
          <Select
            value={skin}
            options={skinOptions}
            onChange={(value) => onSkinChange(value as SkinMode)}
            style={{ width: 180 }}
          />
        </Space>

        <Space className="theme-setting-row" size={12} wrap>
          <Typography.Text>品牌色</Typography.Text>
          <ColorPicker
            value={branding.primaryColor}
            onChange={(color) => onBrandColorChange(color.toHexString())}
            showText
          />
          <Button onClick={onResetBrandColor}>重置配色</Button>
        </Space>

        <Space className="theme-setting-row" size={12} wrap>
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
        </Space>
      </Space>
    </Card>
  );
}

function ProfilePage({ user }: { user: AuthUser }) {
  return (
    <Card title="个人信息">
      <Space direction="vertical" size={8}>
        <Typography.Text>昵称：{user.name}</Typography.Text>
        <Typography.Text>邮箱：{user.email}</Typography.Text>
        <Typography.Text>角色：{user.role}</Typography.Text>
        <Typography.Text type="secondary">用户详情页（个人视角）</Typography.Text>
      </Space>
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

  const effectiveSkin = resolveEffectiveSkin(skin, systemPrefersDark);
  const activeTheme = getThemeBySkin(effectiveSkin, branding);

  const menuItems = buildMenuByRole(user.role as AppRole);
  const selectedMenuKey =
    menuItems.find((item) => location.pathname.startsWith(item.path))?.key ?? menuItems[0]?.key;

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
    } else if (location.pathname.startsWith('/audit-logs')) {
      items.push({ title: '审计日志' });
    } else if (location.pathname.startsWith('/settings/theme')) {
      items.push({ title: '主题设置' });
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

  return (
    <ConfigProvider theme={activeTheme}>
      <Layout className={`app-layout skin-${effectiveSkin}`}>
        <Layout.Sider theme="light" width={220} className="app-sider">
          <div className="logo">Motila</div>
          <Menu
            mode="inline"
            selectedKeys={selectedMenuKey ? [selectedMenuKey] : []}
            items={menuItems.map(
              (item) =>
                ({
                  key: item.key,
                  icon: item.icon,
                  label: item.label,
                  onClick: () => navigate(item.path),
                }),
            )}
          />
        </Layout.Sider>

        <Layout>
          <Layout.Header className="app-header">
            <Breadcrumb items={breadcrumbItems} className="header-breadcrumb" />

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
              <Button className="profile-trigger">{user.name}（{user.role}）</Button>
            </Dropdown>
          </Layout.Header>

          <Layout.Content className="app-content">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage user={user} />} />
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
              {user.role === 'ADMIN' ? (
                <>
                  <Route path="/users" element={<UsersListPage currentUser={user} onChanged={() => void 0} />} />
                  <Route path="/users/create" element={<UserCreatePage />} />
                  <Route path="/users/:id" element={<UserShowPage />} />
                  <Route path="/users/:id/edit" element={<UserEditPage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                </>
              ) : null}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout.Content>
        </Layout>

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
              rules={[{ required: true, min: 6, message: '密码至少6位' }]}
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

  const [authForm] = Form.useForm<{ email: string; name?: string; password: string }>();

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

  const effectiveSkin = resolveEffectiveSkin(skin, systemPrefersDark);
  const authTheme = getThemeBySkin(effectiveSkin, branding);

  const isAuthed = !!token && !!user;

  const onSubmitAuth = async (values: { email: string; name?: string; password: string }) => {
    setAuthLoading(true);
    try {
      const payload =
        mode === 'login'
          ? { email: values.email, password: values.password }
          : {
              email: values.email,
              name: values.name,
              password: values.password,
            };

      const data = await api<AuthResponse>(mode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      localStorage.setItem('motila_token', data.token);
      localStorage.setItem('motila_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      message.success(mode === 'login' ? '登录成功' : '注册成功');
      authForm.resetFields(['password']);
    } catch (error) {
      message.error(parseError(error));
    } finally {
      setAuthLoading(false);
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
              <div className="auth-header">
                <Typography.Text className="auth-kicker">欢迎回来</Typography.Text>
                <Typography.Title level={3} className="auth-title">
                  {mode === 'login' ? '登录 Motila' : '创建 Motila 账号'}
                </Typography.Title>
              </div>

              <div className="auth-switch">
                <Button
                  type={mode === 'login' ? 'primary' : 'default'}
                  onClick={() => setMode('login')}
                  className="auth-switch-btn"
                >
                  登录
                </Button>
                <Button
                  type={mode === 'register' ? 'primary' : 'default'}
                  onClick={() => setMode('register')}
                  className="auth-switch-btn"
                >
                  注册
                </Button>
              </div>

              <Form form={authForm} layout="vertical" onFinish={onSubmitAuth} className="auth-form">
                <Form.Item label="邮箱" name="email" rules={[{ required: true, type: 'email' }]}>
                  <Input size="large" placeholder="you@example.com" />
                </Form.Item>

                {mode === 'register' && (
                  <Form.Item label="昵称" name="name" rules={[{ required: true, min: 2, message: '昵称至少2位' }]}>
                    <Input size="large" placeholder="请输入昵称" />
                  </Form.Item>
                )}

                <Form.Item label="密码" name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
                  <Input.Password size="large" placeholder="至少6位" />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={authLoading} size="large" block>
                  {mode === 'login' ? '立即登录' : '立即注册'}
                </Button>
              </Form>
            </Card>
          </div>
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
