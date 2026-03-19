import { App as AntdApp, Button, Card, Descriptions, Form, Input, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE = '/api';

async function blogApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('motila_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `请求失败: ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

function parseBlogError(error: unknown): string {
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) return parsed.message.join('；');
      if (typeof parsed.message === 'string') return parsed.message;
    } catch {
      return error.message;
    }
    return error.message;
  }
  return '操作失败';
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  return search.toString();
}

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

type PostItem = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  contentMd?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: CategoryItem | null;
  categoryId?: string | null;
};

type ListCategoriesResponse = {
  data: CategoryItem[];
  total: number;
  page: number;
  pageSize: number;
};

type ListPostsResponse = {
  data: PostItem[];
  total: number;
  page: number;
  pageSize: number;
};

export function BlogCategoryListPage({
  canCreate,
  canUpdate,
}: {
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CategoryItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');

  const fetchRows = async () => {
    setLoading(true);
    try {
      const query = buildQuery({ page, pageSize, keyword: keyword || undefined });
      const res = await blogApi<ListCategoriesResponse>(`/blog/categories?${query}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error(parseBlogError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();
  }, [page, pageSize, keyword]);

  const batchDelete = async () => {
    if (!selectedRowKeys.length) return;
    modal.confirm({
      title: '删除确认',
      content: `要删除当前选中的${selectedRowKeys.length}条分类吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await blogApi('/blog/categories/batch-delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids: selectedRowKeys }),
          });
          message.success('分类删除完成');
          setSelectedRowKeys([]);
          void fetchRows();
        } catch (error) {
          message.error(parseBlogError(error));
        }
      },
    });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card title="博客分类">
        <Space wrap>
          <Input.Search
            placeholder="搜索分类名称/Slug/说明"
            allowClear
            onSearch={(value) => {
              setPage(1);
              setKeyword(value.trim());
            }}
            style={{ width: 280 }}
          />
          <Button type="primary" onClick={() => navigate('/blog/categories/create')} disabled={!canCreate}>
            新建分类
          </Button>
        </Space>
      </Card>

      <Card title="分类列表">
        <Space style={{ marginBottom: 12 }}>
          <Button danger disabled={!selectedRowKeys.length || !canUpdate} onClick={() => void batchDelete()}>
            删除
          </Button>
        </Space>
        <Table<CategoryItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/blog/categories/${record.id}`),
          })}
          columns={[
            { title: '分类名称', dataIndex: 'name' },
            { title: 'Slug', dataIndex: 'slug' },
            { title: '说明', dataIndex: 'description', render: (value?: string | null) => value || '-' },
            { title: '创建时间', dataIndex: 'createdAt', render: (value: string) => new Date(value).toLocaleString() },
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

export function BlogCategoryFormPage({
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
  const [form] = Form.useForm<{ name: string; slug?: string; description?: string }>();

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    setLoadingDetail(true);
    blogApi<CategoryItem>(`/blog/categories/${id}`)
      .then((res) =>
        form.setFieldsValue({
          name: res.name,
          slug: res.slug,
          description: res.description ?? undefined,
        }),
      )
      .catch((error) => message.error(parseBlogError(error)))
      .finally(() => setLoadingDetail(false));
  }, [form, id, message, mode]);

  const disabled = mode === 'create' ? !canCreate : !canUpdate;

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (mode === 'edit' && id) {
        await blogApi(`/blog/categories/${id}`, { method: 'PATCH', body: JSON.stringify(values) });
        message.success('分类已更新');
        navigate(`/blog/categories/${id}`);
      } else {
        await blogApi('/blog/categories', { method: 'POST', body: JSON.stringify(values) });
        message.success('分类已创建');
        navigate('/blog/categories');
      }
    } catch (error) {
      if (error instanceof Error) message.error(parseBlogError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className="keep-card-head"
      title={mode === 'edit' ? '编辑博客分类' : '新建博客分类'}
      extra={
        <Space>
          <Button onClick={() => navigate(mode === 'edit' && id ? `/blog/categories/${id}` : '/blog/categories')}>取消</Button>
          <Button type="primary" disabled={disabled} loading={saving} onClick={() => void submitForm()}>
            {mode === 'edit' ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <div className="grid-form" style={{ gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))' }}>
          <Form.Item label="分类名称" name="name" rules={[{ required: true, min: 2, message: '请输入至少2个字的分类名称' }]}>
            <Input disabled={loadingDetail} />
          </Form.Item>
          <Form.Item label="Slug" name="slug">
            <Input disabled={loadingDetail} placeholder="不填则按分类名称自动生成" />
          </Form.Item>
          <Form.Item label="说明" name="description" style={{ gridColumn: 'span 2' }}>
            <Input.TextArea disabled={loadingDetail} rows={4} />
          </Form.Item>
        </div>
      </Form>
    </Card>
  );
}

export function BlogCategoryShowPage({ canUpdate }: { canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CategoryItem | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    blogApi<CategoryItem>(`/blog/categories/${id}`)
      .then((res) => setData(res))
      .catch((error) => message.error(parseBlogError(error)))
      .finally(() => setLoading(false));
  }, [id, message]);

  return (
    <Card
      className="keep-card-head"
      title="博客分类详情"
      loading={loading}
      extra={
        <Space>
          <Button onClick={() => navigate('/blog/categories')}>返回列表</Button>
          <Button type="primary" disabled={!canUpdate || !id} onClick={() => navigate(`/blog/categories/${id}/edit`)}>
            编辑
          </Button>
        </Space>
      }
    >
      {data ? (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="分类名称">{data.name}</Descriptions.Item>
          <Descriptions.Item label="Slug">{data.slug}</Descriptions.Item>
          <Descriptions.Item label="说明" span={2}>{data.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{new Date(data.updatedAt).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Card>
  );
}

export function BlogPostListPage({
  canCreate,
  canUpdate,
}: {
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PostItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await blogApi<ListCategoriesResponse>('/blog/categories?page=1&pageSize=100');
      setCategories(res.data ?? []);
    } catch {
      setCategories([]);
    }
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const query = buildQuery({ page, pageSize, keyword: keyword || undefined, categoryId });
      const res = await blogApi<ListPostsResponse>(`/blog/posts?${query}`);
      setRows(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error(parseBlogError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [page, pageSize, keyword, categoryId]);

  const batchPublish = async () => {
    if (!selectedRowKeys.length) return;
    modal.confirm({
      title: '发布确认',
      content: `要批量发布当前选中的${selectedRowKeys.length}篇文章吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await blogApi<{ count: number }>('/blog/posts/batch-publish', {
            method: 'PATCH',
            body: JSON.stringify({ ids: selectedRowKeys }),
          });
          message.success(`批量发布完成，本次发布${res.count}篇文章`);
          setSelectedRowKeys([]);
          void fetchRows();
        } catch (error) {
          message.error(parseBlogError(error));
        }
      },
    });
  };

  const batchDelete = async () => {
    if (!selectedRowKeys.length) return;
    modal.confirm({
      title: '删除确认',
      content: `要删除当前选中的${selectedRowKeys.length}篇文章吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await blogApi('/blog/posts/batch-delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids: selectedRowKeys }),
          });
          message.success('文章删除完成');
          setSelectedRowKeys([]);
          void fetchRows();
        } catch (error) {
          message.error(parseBlogError(error));
        }
      },
    });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card title="博客文章">
        <Space wrap>
          <Input.Search
            placeholder="搜索标题/Slug/摘要"
            allowClear
            onSearch={(value) => {
              setPage(1);
              setKeyword(value.trim());
            }}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="所属分类"
            style={{ width: 180 }}
            value={categoryId}
            onChange={(value) => {
              setPage(1);
              setCategoryId(value);
            }}
            options={categories.map((item) => ({ label: item.name, value: item.id }))}
          />
          <Button type="primary" onClick={() => navigate('/blog/posts/create')} disabled={!canCreate}>
            新建文章
          </Button>
        </Space>
      </Card>

      <Card title="文章列表">
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" disabled={!selectedRowKeys.length || !canUpdate} onClick={() => void batchPublish()}>
            批量发布
          </Button>
          <Button danger disabled={!selectedRowKeys.length || !canUpdate} onClick={() => void batchDelete()}>
            删除
          </Button>
        </Space>
        <Table<PostItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/blog/posts/${record.id}`),
          })}
          columns={[
            { title: '标题', dataIndex: 'title' },
            { title: '分类', render: (_, record) => record.category?.name || '-' },
            {
              title: '状态',
              render: (_, record) => <Tag color={record.isPublished ? 'green' : 'default'}>{record.isPublished ? '已发布' : '草稿'}</Tag>,
            },
            { title: '发布时间', render: (_, record) => (record.publishedAt ? new Date(record.publishedAt).toLocaleString() : '-') },
            { title: '创建时间', dataIndex: 'createdAt', render: (value: string) => new Date(value).toLocaleString() },
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

export function BlogPostFormPage({
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
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [contentPreview, setContentPreview] = useState('');
  const [form] = Form.useForm<{
    title: string;
    slug?: string;
    summary?: string;
    contentMd?: string;
    categoryId?: string;
    isPublished: boolean;
  }>();

  useEffect(() => {
    blogApi<ListCategoriesResponse>('/blog/categories?page=1&pageSize=100')
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    setLoadingDetail(true);
    blogApi<PostItem>(`/blog/posts/${id}`)
      .then((res) => {
        form.setFieldsValue({
          title: res.title,
          slug: res.slug,
          summary: res.summary ?? '',
          contentMd: res.contentMd ?? '',
          categoryId: res.categoryId ?? res.category?.id ?? undefined,
          isPublished: res.isPublished,
        });
        setContentPreview(res.contentMd ?? '');
      })
      .catch((error) => message.error(parseBlogError(error)))
      .finally(() => setLoadingDetail(false));
  }, [form, id, message, mode]);

  const disabled = mode === 'create' ? !canCreate : !canUpdate;

  const submitForm = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        categoryId: values.categoryId || undefined,
      };
      setSaving(true);
      if (mode === 'edit' && id) {
        await blogApi(`/blog/posts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        message.success('文章已更新');
        navigate(`/blog/posts/${id}`);
      } else {
        await blogApi('/blog/posts', { method: 'POST', body: JSON.stringify(payload) });
        message.success('文章已创建');
        navigate('/blog/posts');
      }
    } catch (error) {
      if (error instanceof Error) message.error(parseBlogError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className="keep-card-head"
      title={mode === 'edit' ? '编辑博客文章' : '新建博客文章'}
      extra={
        <Space>
          <Button onClick={() => navigate(mode === 'edit' && id ? `/blog/posts/${id}` : '/blog/posts')}>取消</Button>
          <Button type="primary" disabled={disabled} loading={saving} onClick={() => void submitForm()}>
            {mode === 'edit' ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ isPublished: false }}>
        <div className="grid-form" style={{ gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))' }}>
          <Form.Item label="标题" name="title" rules={[{ required: true, min: 2, message: '请输入至少2个字的文章标题' }]} style={{ gridColumn: 'span 2' }}>
            <Input disabled={loadingDetail} />
          </Form.Item>
          <Form.Item label="Slug" name="slug">
            <Input disabled={loadingDetail} placeholder="不填则按标题自动生成" />
          </Form.Item>
          <Form.Item label="所属分类" name="categoryId">
            <Select
              allowClear
              disabled={loadingDetail}
              options={categories.map((item) => ({ label: item.name, value: item.id }))}
            />
          </Form.Item>
          <Form.Item label="摘要" name="summary" style={{ gridColumn: 'span 4' }}>
            <Input.TextArea disabled={loadingDetail} rows={4} />
          </Form.Item>
          <Form.Item label="Markdown 内容" name="contentMd" style={{ gridColumn: 'span 4' }}>
            <Input.TextArea
              disabled={loadingDetail}
              rows={16}
              placeholder="# 在这里写 Markdown"
              onChange={(event) => setContentPreview(event.target.value)}
            />
          </Form.Item>
          <Form.Item label="发布状态" name="isPublished" valuePropName="checked">
            <Switch disabled={loadingDetail} />
          </Form.Item>
        </div>
      </Form>

      <Card size="small" title="预览（简版）" style={{ marginTop: 16 }}>
        <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
          {contentPreview || form.getFieldValue('contentMd') || '暂无内容'}
        </Typography.Paragraph>
      </Card>
    </Card>
  );
}

export function BlogPostShowPage({ canUpdate }: { canUpdate: boolean }) {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PostItem | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    blogApi<PostItem>(`/blog/posts/${id}`)
      .then((res) => setData(res))
      .catch((error) => message.error(parseBlogError(error)))
      .finally(() => setLoading(false));
  }, [id, message]);

  return (
    <Card
      className="keep-card-head"
      title="博客文章详情"
      loading={loading}
      extra={
        <Space>
          <Button onClick={() => navigate('/blog/posts')}>返回列表</Button>
          <Button type="primary" disabled={!canUpdate || !id} onClick={() => navigate(`/blog/posts/${id}/edit`)}>
            编辑
          </Button>
        </Space>
      }
    >
      {data ? (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="标题">{data.title}</Descriptions.Item>
            <Descriptions.Item label="Slug">{data.slug}</Descriptions.Item>
            <Descriptions.Item label="所属分类">{data.category?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="发布状态">
              <Tag color={data.isPublished ? 'green' : 'default'}>{data.isPublished ? '已发布' : '草稿'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发布时间">{data.publishedAt ? new Date(data.publishedAt).toLocaleString() : '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{new Date(data.updatedAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="摘要" span={2}>{data.summary || '-'}</Descriptions.Item>
          </Descriptions>
          <Card size="small" title="Markdown 内容">
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {data.contentMd || '暂无内容'}
            </Typography.Paragraph>
          </Card>
        </Space>
      ) : null}
    </Card>
  );
}
