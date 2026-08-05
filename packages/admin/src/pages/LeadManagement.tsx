import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Input, Modal, Form, message, Select, Tag,
  Row, Col, Statistic, Tooltip, Popconfirm, Badge, Descriptions, Drawer, Timeline, Tabs
} from 'antd';
const { TabPane } = Tabs;
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  UserOutlined, SwapOutlined, ThunderboltOutlined, CheckCircleOutlined,
  PhoneOutlined, MailOutlined, RobotOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Option } = Select;
const API_BASE = `${API_BASE_URL}/api/v1/admin`;

const LeadManagement: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const [isCreateModal, setIsCreateModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [form] = Form.useForm();

  // 抽屉
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerLead, setDrawerLead] = useState<any>(null);

  // 转化弹窗
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<any>(null);
  const [convertForm] = Form.useForm();

  // 统计
  const [stats, setStats] = useState({ total: 0, new: 0, following: 0, converted: 0 });

  const getToken = () => localStorage.getItem('adminToken');
  const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/leads`, {
        headers: getHeaders(),
        params: { page, pageSize: 20, search: searchTerm, status: statusFilter, source: sourceFilter }
      });
      if (res.data.code === 0 || res.data.code === 200) {
        setLeads(res.data.data?.list || []);
        setPagination(prev => ({ ...prev, current: page, total: res.data.data?.total || 0 }));
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/leads/stats`, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setStats(res.data.data || { total: 0, new: 0, following: 0, converted: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => { fetchLeads(); fetchStats(); }, [searchTerm, statusFilter, sourceFilter]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (values.tags && Array.isArray(values.tags)) {
        values.tags = values.tags.join(',');
      }
      const res = await axios.post(`${API_BASE}/leads`, values, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        message.success('线索创建成功');
        setIsCreateModal(false);
        form.resetFields();
        fetchLeads(1);
        fetchStats();
      } else {
        message.error(res.data.message || '创建失败');
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.warning('请填写必填项');
      } else {
        message.error(error.response?.data?.message || '创建失败，请检查网络');
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (values.tags && Array.isArray(values.tags)) {
        values.tags = values.tags.join(',');
      }
      await axios.put(`${API_BASE}/leads/${currentLead.id}`, values, { headers: getHeaders() });
      message.success('线索更新成功');
      setIsEditModal(false);
      form.resetFields();
      fetchLeads(pagination.current);
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/leads/${id}`, { headers: getHeaders() });
      message.success('线索删除成功');
      fetchLeads(pagination.current);
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 转化为客户 - 打开弹窗
  const openConvertModal = (lead: any) => {
    setConvertLead(lead);
    convertForm.setFieldsValue({ level: 'C', stage: 'active', note: '' });
    setConvertModalOpen(true);
  };

  // 转化为客户 - 确认
  const convertToCustomer = async () => {
    try {
      const values = await convertForm.validateFields();
      await axios.post(`${API_BASE}/leads/${convertLead.id}/convert`, values, { headers: getHeaders() });
      message.success('线索已转化为客户');
      setConvertModalOpen(false);
      convertForm.resetFields();
      fetchLeads(pagination.current);
      fetchStats();
    } catch (error) {
      message.error('转化失败');
    }
  };

  const showDetail = async (record: any) => {
    try {
      const res = await axios.get(`${API_BASE}/leads/${record.id}`, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setDrawerLead(res.data.data);
        setDrawerVisible(true);
      }
    } catch (error) {
      message.error('获取详情失败');
    }
  };

  const statusColors: Record<string, string> = {
    new: 'blue', following: 'processing', qualified: 'cyan',
    opportunity: 'purple', won: 'green', lost: 'red'
  };
  const statusLabels: Record<string, string> = {
    new: '新线索', following: '跟进中', qualified: '已验证',
    opportunity: '商机', won: '已成交', lost: '已流失'
  };
  const sourceLabels: Record<string, string> = {
    promotion: '推广链接', website: '官网', form: '表单提交', manual: '手动录入',
    baidu: '百度', douyin: '抖音', wechat: '微信', xiaohongshu: '小红书',
    card: '名片', referral: '转介绍', auto: '自动采集', other: '其他'
  };
  const priorityColors: Record<string, string> = { low: 'default', medium: 'blue', high: 'red' };

  const columns = [
    {
      title: '线索名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record: any) => (
        <a onClick={() => showDetail(record)} style={{ fontWeight: 500 }}>{name}</a>
      ),
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      width: 150,
      render: (v: string) => v || '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => (
        <Tag>{sourceLabels[source] || source}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => <Badge color={priorityColors[p] === 'red' ? 'red' : priorityColors[p] === 'blue' ? 'blue' : 'default'} text={p === 'high' ? '高' : p === 'medium' ? '中' : '低'} />,
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 150,
      render: (_: any, record: any) => (
        <span>
          {record.phone && <><PhoneOutlined style={{ marginRight: 4 }} />{record.phone}<br /></>}
          {record.email && <><MailOutlined style={{ marginRight: 4 }} />{record.email}</>}
          {!record.phone && !record.email && '-'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d: string) => d ? new Date(d).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
              setCurrentLead(record);
              const values = { ...record };
              if (values.tags && typeof values.tags === 'string') {
                values.tags = values.tags.split(',').filter(Boolean);
              }
              form.setFieldsValue(values);
              setIsEditModal(true);
            }} />
          </Tooltip>
          {record.status === 'new' || record.status === 'following' ? (
            <Tooltip title="转化为客户">
              <Button type="link" size="small" icon={<SwapOutlined />} style={{ color: '#52c41a' }} onClick={() => openConvertModal(record)} />
            </Tooltip>
          ) : null}
          <Popconfirm title="确定删除此线索？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          线索管理
        </h3>
        <span style={{ color: '#888' }}>管理各渠道来源的商机线索，支持自动采集和转化为客户</span>
      </div>

      {/* 统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="线索总数" value={stats.total} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="新线索" value={stats.new} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="跟进中" value={stats.following} prefix={<SearchOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已转化" value={stats.converted} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input
              placeholder="搜索线索名称/公司"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
              <Option value="all">全部状态</Option>
              <Option value="new">新线索</Option>
              <Option value="following">跟进中</Option>
              <Option value="qualified">已验证</Option>
              <Option value="won">已成交</Option>
              <Option value="lost">已流失</Option>
            </Select>
            <Select value={sourceFilter} onChange={setSourceFilter} style={{ width: 120 }}>
              <Option value="all">全部来源</Option>
              <Option value="auto">自动采集</Option>
              <Option value="website">官网</Option>
              <Option value="baidu">百度</Option>
              <Option value="wechat">微信</Option>
              <Option value="form">表单</Option>
              <Option value="referral">转介绍</Option>
              <Option value="other">其他</Option>
            </Select>
          </Space>
          <Space>
            <Tooltip title="从访客行为中自动识别潜在线索">
              <Button icon={<RobotOutlined />}>自动采集</Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModal(true)}>
              手动录入
            </Button>
          </Space>
        </div>
      </Card>

      {/* 线索列表 */}
      <Table
        columns={columns}
        dataSource={leads}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: false,
          showTotal: total => `共 ${total} 条线索`,
          onChange: (page) => fetchLeads(page),
        }}
      />

      {/* 新建线索 */}
      <Modal
        title="录入线索"
        open={isCreateModal}
        onCancel={() => { setIsCreateModal(false); form.resetFields(); }}
        onOk={handleCreate}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="线索名称" rules={[{ required: true }]}>
            <Input placeholder="线索名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="company" label="公司名称">
                <Input placeholder="公司" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="position" label="职位">
                <Input placeholder="职位" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="source" label="来源" initialValue="website">
                <Select>
                  <Option value="website">官网</Option>
                  <Option value="baidu">百度</Option>
                  <Option value="douyin">抖音</Option>
                  <Option value="wechat">微信</Option>
                  <Option value="xiaohongshu">小红书</Option>
                  <Option value="card">名片</Option>
                  <Option value="form">表单</Option>
                  <Option value="referral">转介绍</Option>
                  <Option value="auto">自动采集</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label="电话">
                <Input placeholder="手机号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="邮箱" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" initialValue="medium">
                <Select>
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑线索 */}
      <Modal
        title="编辑线索"
        open={isEditModal}
        onCancel={() => { setIsEditModal(false); form.resetFields(); }}
        onOk={handleUpdate}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="线索名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="company" label="公司">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Option value="new">新线索</Option>
                  <Option value="following">跟进中</Option>
                  <Option value="qualified">已验证</Option>
                  <Option value="opportunity">商机</Option>
                  <Option value="won">已成交</Option>
                  <Option value="lost">已流失</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级">
                <Select>
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label="电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="邮箱">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="source" label="来源">
                <Select>
                  <Option value="website">官网</Option>
                  <Option value="baidu">百度</Option>
                  <Option value="wechat">微信</Option>
                  <Option value="form">表单</Option>
                  <Option value="referral">转介绍</Option>
                  <Option value="auto">自动采集</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="标签" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 线索详情抽屉 */}
      <Drawer
        title={drawerLead?.name || '线索详情'}
        width={560}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {drawerLead && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="基本信息" key="info">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="线索名称">{drawerLead.name}</Descriptions.Item>
                <Descriptions.Item label="公司">{drawerLead.company || '-'}</Descriptions.Item>
                <Descriptions.Item label="职位">{drawerLead.position || '-'}</Descriptions.Item>
                <Descriptions.Item label="来源">{sourceLabels[drawerLead.source] || drawerLead.source}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusColors[drawerLead.status]}>{statusLabels[drawerLead.status]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="优先级">{drawerLead.priority === 'high' ? '高' : drawerLead.priority === 'medium' ? '中' : '低'}</Descriptions.Item>
                <Descriptions.Item label="电话">{drawerLead.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{drawerLead.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="标签" span={2}>
                  {drawerLead.tags ? drawerLead.tags.split(',').filter(Boolean).map((t: string, i: number) => (
                    <Tag key={i}>{t}</Tag>
                  )) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>{drawerLead.note || '-'}</Descriptions.Item>
              </Descriptions>
            </TabPane>
            <TabPane tab="跟进记录" key="followups">
              {drawerLead.followUps?.length > 0 ? (
                <Timeline>
                  {drawerLead.followUps.map((f: any) => (
                    <Timeline.Item key={f.id} color={f.type === 'phone' ? 'blue' : 'green'}>
                      <p><strong>{f.type === 'phone' ? '电话' : f.type === 'visit' ? '拜访' : f.type === 'email' ? '邮件' : f.type === 'wechat' ? '微信' : f.type}</strong> - {new Date(f.createdAt).toLocaleDateString()}</p>
                      <p>{f.content}</p>
                      {f.nextAction && <p style={{ color: '#1890ff' }}>下一步：{f.nextAction}</p>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无跟进记录</div>}
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* 线索转化弹窗 */}
      <Modal
        title={`转化线索: ${convertLead?.name || ''}`}
        open={convertModalOpen}
        onCancel={() => { setConvertModalOpen(false); convertForm.resetFields(); }}
        onOk={convertToCustomer}
        width={500}
        okText="确认转化"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8 }}>
          <div style={{ marginBottom: 4 }}><strong>线索信息：</strong>{convertLead?.name} {convertLead?.company && `(${convertLead.company})`}</div>
          <div style={{ color: '#888', fontSize: 12 }}>来源：{convertLead?.source} | 电话：{convertLead?.phone || '无'} | 邮箱：{convertLead?.email || '无'}</div>
        </div>
        <Form form={convertForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="level" label="客户等级" rules={[{ required: true }]}>
                <Select>
                  <Option value="A">A级（重要客户）</Option>
                  <Option value="B">B级（一般客户）</Option>
                  <Option value="C">C级（普通客户）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stage" label="客户阶段" rules={[{ required: true }]}>
                <Select>
                  <Option value="active">活跃客户</Option>
                  <Option value="prospect">潜在客户</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="客户备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadManagement;
