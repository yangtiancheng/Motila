import { Card, Input, Space, Table } from 'antd';
import { useEffect, useState } from 'react';

const API_BASE = '/api';
async function request<T>(path: string) {
  const token = localStorage.getItem('motila_token');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error('请求失败');
  return response.json() as Promise<T>;
}

type LoginHistoryItem = { id: string; username: string; name?: string | null; ip?: string | null; userAgent?: string | null; status: string; reason?: string | null; createdAt: string };

export const LoginHistoryPage = () => {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<LoginHistoryItem[]>([]);

  const load = async (nextKeyword = keyword) => {
    setLoading(true);
    try {
      const query = nextKeyword ? `?page=1&pageSize=50&keyword=${encodeURIComponent(nextKeyword)}` : '?page=1&pageSize=50';
      const res = await request<{ data: LoginHistoryItem[] }>(`/login-history${query}`);
      setData(res.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(''); }, []);

  return (
    <Card title="用户登录历史日志">
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="搜用户名/IP/状态" value={keyword} onChange={(e) => setKeyword(e.target.value)} onSearch={(value) => void load(value)} allowClear style={{ width: 320 }} />
      </Space>
      <Table rowKey="id" loading={loading} dataSource={data} pagination={false} columns={[
        { title: '用户名', dataIndex: 'username' },
        { title: '姓名', dataIndex: 'name' },
        { title: 'IP', dataIndex: 'ip' },
        { title: '状态', dataIndex: 'status' },
        { title: '原因', dataIndex: 'reason' },
        { title: '时间', dataIndex: 'createdAt' },
      ]} />
    </Card>
  );
};
