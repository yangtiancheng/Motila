import { Card, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { AuditItem } from './audit.types';

const API_BASE = `http://${window.location.hostname}:3000`;

function actionLabel(action: AuditItem['action']) {
  switch (action) {
    case 'USER_CREATE':
      return { text: '创建用户', color: 'green' };
    case 'USER_UPDATE':
      return { text: '更新用户', color: 'blue' };
    case 'USER_DELETE':
      return { text: '删除用户', color: 'red' };
    case 'USER_ROLE_CHANGE':
      return { text: '角色变更', color: 'gold' };
    case 'USER_PASSWORD_RESET':
      return { text: '重置密码', color: 'purple' };
    default:
      return { text: action, color: 'default' };
  }
}

export function AuditLogsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AuditItem[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('motila_token');
        const res = await fetch(`${API_BASE}/audit-logs?limit=200`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) throw new Error('加载审计日志失败');
        const data = (await res.json()) as AuditItem[];
        setRows(data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <Card title="审计日志">
      <Typography.Paragraph type="secondary">
        记录管理员对用户的创建、编辑、删除、角色变更、密码重置操作。
      </Typography.Paragraph>

      <Table<AuditItem>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        scroll={{ x: 1080 }}
        columns={[
          {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (v: string) => new Date(v).toLocaleString(),
          },
          {
            title: '操作',
            dataIndex: 'action',
            key: 'action',
            width: 120,
            render: (action: AuditItem['action']) => {
              const info = actionLabel(action);
              return <Tag color={info.color}>{info.text}</Tag>;
            },
          },
          {
            title: '目标用户',
            key: 'target',
            render: (_, r) => `${r.targetName} (${r.targetEmail})`,
          },
          {
            title: '操作者',
            key: 'actor',
            render: (_, r) => `${r.actorEmail} (${r.actorRole})`,
          },
          {
            title: '详情',
            dataIndex: 'detail',
            key: 'detail',
            ellipsis: true,
          },
        ]}
      />
    </Card>
  );
}
