import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Typography, message } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { scrmApi } from '../../services/api';
const { Title } = Typography;

const stageLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '跟进中',
  proposal: '方案/报价',
  negotiating: '谈判中',
  won: '已成交',
  lost: '已流失',
};

const stageColors: Record<string, string> = {
  pending: 'default',
  confirmed: 'blue',
  in_progress: 'processing',
  proposal: 'cyan',
  negotiating: 'purple',
  won: 'success',
  lost: 'error',
};

const typeLabels: Record<string, string> = {
  supply_demand: '供需信息',
  bidding: '招投标',
  trade: '买卖关系',
  resource: '资源对接',
};

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

export default function Opportunities() {
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const res: any = await scrmApi.getOpportunities();
      if (res.code === 0) {
        setOpps(res.data || []);
      } else {
        message.error('加载失败');
      }
    } catch (err) {
      message.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '商机名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '公司',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: '商机来源',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (v: string) => <Tag>{typeLabels[v] || v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (v: string) => <Tag color={stageColors[v] || 'default'}>{stageLabels[v] || v}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (v: string) => <Tag color={priorityColors[v] || 'default'}>{priorityLabels[v] || v}</Tag>,
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 150,
      render: (_: any, record: any) => {
        const contact = record.contactPhone || record.contactEmail || '-';
        return <span style={{ fontSize: 13 }}>{contact}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>商机管理</Title>
      <Table
        columns={columns}
        dataSource={opps}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
}
