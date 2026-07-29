import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Popconfirm, message, Modal, Input } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api/v1/admin`;
const getToken = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

interface Registration {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
  };
}

const RegistrationReview: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [currentReg, setCurrentReg] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async (status: string = 'pending') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/registrations?status=${status}`, getToken());
      if (res.data.code === 0) {
        setRegistrations(res.data.data?.list || []);
      }
    } catch {
      message.error('获取注册列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await axios.put(`${API_BASE}/registrations/${id}/approve`, {}, getToken());
      if (res.data.code === 0) {
        message.success('审核通过');
        fetchRegistrations();
      } else {
        message.error(res.data.message || '操作失败');
      }
    } catch {
      message.error('操作失败');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await axios.put(`${API_BASE}/registrations/${id}/reject`, {}, getToken());
      if (res.data.code === 0) {
        message.success('已拒绝');
        fetchRegistrations();
      } else {
        message.error(res.data.message || '操作失败');
      }
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: '企业名称',
      key: 'company',
      render: (_: any, record: Registration) => record.tenant?.name || '-',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { label: string; color: string }> = {
          pending: { label: '待审核', color: 'orange' },
          active: { label: '已通过', color: 'green' },
          rejected: { label: '已拒绝', color: 'red' },
        };
        const c = config[status] || { label: status, color: 'default' };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Registration) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => { setCurrentReg(record); setDetailModal(true); }}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确定通过该注册申请？"
                onConfirm={() => handleApprove(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
                  通过
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定拒绝该注册申请？"
                onConfirm={() => handleReject(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<CloseOutlined />} danger>
                  拒绝
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="注册审核"
        extra={
          <Space>
            <Button onClick={() => fetchRegistrations('pending')}>待审核</Button>
            <Button onClick={() => fetchRegistrations('active')}>已通过</Button>
            <Button onClick={() => fetchRegistrations('rejected')}>已拒绝</Button>
            <Button onClick={() => fetchRegistrations()}>全部</Button>
          </Space>
        }
      >
        <Table
          dataSource={registrations}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title="注册详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
      >
        {currentReg && (
          <div style={{ padding: '16px 0' }}>
            <p><strong>姓名：</strong>{currentReg.name}</p>
            <p><strong>邮箱：</strong>{currentReg.email}</p>
            <p><strong>手机号：</strong>{currentReg.phone || '-'}</p>
            <p><strong>企业名称：</strong>{currentReg.tenant?.name || '-'}</p>
            <p><strong>注册时间：</strong>{new Date(currentReg.createdAt).toLocaleString('zh-CN')}</p>
            <p><strong>状态：</strong>
              <Tag color={currentReg.status === 'pending' ? 'orange' : currentReg.status === 'active' ? 'green' : 'red'}>
                {currentReg.status === 'pending' ? '待审核' : currentReg.status === 'active' ? '已通过' : '已拒绝'}
              </Tag>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RegistrationReview;
