import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Input, Modal, Form, message, Select, Tag,
  Drawer, Descriptions, Tabs, Popconfirm, Badge, Tooltip, Row, Col, Statistic, Timeline, Divider
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  TeamOutlined, UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined,
  StarOutlined, SwapOutlined, FundOutlined, ContactsOutlined, MessageOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Option } = Select;
const { TabPane } = Tabs;

const API_BASE = `${API_BASE_URL}/api/v1/admin`;

const CustomerHub: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  
  // 模态框状态
  const [isCreateModal, setIsCreateModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [form] = Form.useForm();

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerCustomer, setDrawerCustomer] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpForm] = Form.useForm();
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);

  // 统计数据
  const [stats, setStats] = useState({ total: 0, active: 0, prospect: 0, churned: 0 });

  const getToken = () => localStorage.getItem('adminToken');
  const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  // 获取客户列表
  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/customers`, {
        headers: getHeaders(),
        params: { page, pageSize: 20, search: searchTerm, level: levelFilter, stage: stageFilter }
      });
      if (res.data.code === 0 || res.data.code === 200) {
        setCustomers(res.data.data?.list || []);
        setPagination(prev => ({ ...prev, current: page, total: res.data.data?.total || 0 }));
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/customers/stats`, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setStats(res.data.data || { total: 0, active: 0, prospect: 0, churned: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => { fetchCustomers(); fetchStats(); }, [searchTerm, levelFilter, stageFilter]);

  // 创建客户
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (values.tags && Array.isArray(values.tags)) {
        values.tags = values.tags.join(',');
      }
      await axios.post(`${API_BASE}/customers`, values, { headers: getHeaders() });
      message.success('客户创建成功');
      setIsCreateModal(false);
      form.resetFields();
      fetchCustomers(1);
      fetchStats();
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 更新客户
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (values.tags && Array.isArray(values.tags)) {
        values.tags = values.tags.join(',');
      }
      await axios.put(`${API_BASE}/customers/${currentCustomer.id}`, values, { headers: getHeaders() });
      message.success('客户更新成功');
      setIsEditModal(false);
      form.resetFields();
      fetchCustomers(pagination.current);
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 删除客户
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/customers/${id}`, { headers: getHeaders() });
      message.success('客户删除成功');
      fetchCustomers(pagination.current);
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 查看客户详情
  const showDetail = async (record: any) => {
    try {
      const res = await axios.get(`${API_BASE}/customers/${record.id}`, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setDrawerCustomer(res.data.data);
        setDrawerVisible(true);
        // 加载跟进记录
        loadFollowUps(record.id);
      }
    } catch (error) {
      message.error('获取详情失败');
    }
  };

  // 加载跟进记录
  const loadFollowUps = async (customerId: string) => {
    setFollowUpLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/customers/${customerId}/follow-ups`, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setFollowUps(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch { setFollowUps([]); }
    finally { setFollowUpLoading(false); }
  };

  // 创建跟进记录
  const handleCreateFollowUp = async () => {
    if (!drawerCustomer) return;
    try {
      const values = await followUpForm.validateFields();
      await axios.post(`${API_BASE}/customers/${drawerCustomer.id}/follow-ups`, values, { headers: getHeaders() });
      message.success('跟进记录已添加');
      setFollowUpModalOpen(false);
      followUpForm.resetFields();
      loadFollowUps(drawerCustomer.id);
      // 刷新客户详情
      const res = await axios.get(`${API_BASE}/customers/${drawerCustomer.id}`, { headers: getHeaders() });
      if (res.data.code === 0) setDrawerCustomer(res.data.data);
    } catch { message.error('创建失败'); }
  };

  // 等级和阶段配置
  const levelColors: Record<string, string> = { A: 'gold', B: 'blue', C: 'green' };
  const stageColors: Record<string, string> = { prospect: 'orange', active: 'green', churned: 'red' };
  const stageLabels: Record<string, string> = { prospect: '潜在客户', active: '活跃客户', churned: '流失客户' };
  const sourceLabels: Record<string, string> = {
    promotion: '推广链接', website: '官网', form: '表单转化', manual: '手动录入',
    baidu: '百度', wechat: '微信', auto: '自动采集', other: '其他'
  };

  // 区分注册来源
  const getRegSource = (customer: any): string => {
    if (customer.tags?.includes('自助注册')) return '自助注册';
    if (customer.lead) return sourceLabels[customer.lead.source] || '表单转化';
    return '手动创建';
  };
  const getRegSourceColor = (customer: any): string => {
    if (customer.tags?.includes('自助注册')) return 'cyan';
    if (customer.lead) return 'green';
    return 'default';
  };

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: any) => (
        <a onClick={() => showDetail(record)} style={{ fontWeight: 500 }}>{name}</a>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      filters: [
        { text: 'A级', value: 'A' },
        { text: 'B级', value: 'B' },
        { text: 'C级', value: 'C' },
      ],
      render: (level: string) => <Tag color={levelColors[level]}>{level}级</Tag>,
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (stage: string) => <Tag color={stageColors[stage]}>{stageLabels[stage] || stage}</Tag>,
    },
    {
      title: '来源',
      key: 'regSource',
      width: 100,
      render: (_: any, record: any) => (
        <Tag color={getRegSourceColor(record)}>{getRegSource(record)}</Tag>
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
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: '累计成交',
      dataIndex: 'totalDeal',
      key: 'totalDeal',
      width: 120,
      sorter: (a: any, b: any) => (a.totalDeal || 0) - (b.totalDeal || 0),
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string) => {
        if (!tags) return '-';
        return tags.split(',').slice(0, 3).map((t: string, i: number) => (
          <Tag key={i} style={{ marginBottom: 2 }}>{t}</Tag>
        ));
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
              setCurrentCustomer(record);
              const editValues = { ...record };
              if (editValues.tags && typeof editValues.tags === 'string') {
                editValues.tags = editValues.tags.split(',').filter(Boolean);
              }
              form.setFieldsValue(editValues);
              setIsEditModal(true);
            }} />
          </Tooltip>
          <Popconfirm title="确定删除此客户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>
          <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          客户管理
        </h3>
        <span style={{ color: '#888' }}>管理收录的企业客户信息，支持分级管理和商机关联</span>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="客户总数" value={stats.total} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="活跃客户" value={stats.active} prefix={<StarOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="潜在客户" value={stats.prospect} prefix={<UserOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="流失客户" value={stats.churned} prefix={<SwapOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input
              placeholder="搜索客户名称/联系人"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select value={levelFilter} onChange={setLevelFilter} style={{ width: 120 }}>
              <Option value="all">全部等级</Option>
              <Option value="A">A级</Option>
              <Option value="B">B级</Option>
              <Option value="C">C级</Option>
            </Select>
            <Select value={stageFilter} onChange={setStageFilter} style={{ width: 120 }}>
              <Option value="all">全部阶段</Option>
              <Option value="prospect">潜在客户</Option>
              <Option value="active">活跃客户</Option>
              <Option value="churned">流失客户</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModal(true)}>
            新增客户
          </Button>
        </div>
      </Card>

      {/* 客户列表 */}
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: false,
          showTotal: total => `共 ${total} 个客户`,
          onChange: (page) => fetchCustomers(page),
        }}
      />

      {/* 新建客户模态框 */}
      <Modal
        title="新增客户"
        open={isCreateModal}
        onCancel={() => { setIsCreateModal(false); form.resetFields(); }}
        onOk={handleCreate}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户名称（公司）" rules={[{ required: true }]}>
                <Input placeholder="输入公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="行业">
                <Input placeholder="如：制造业、IT、金融" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="level" label="客户等级" initialValue="C">
                <Select>
                  <Option value="A">A级（重要）</Option>
                  <Option value="B">B级（一般）</Option>
                  <Option value="C">C级（普通）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stage" label="客户阶段" initialValue="prospect">
                <Select>
                  <Option value="prospect">潜在客户</Option>
                  <Option value="active">活跃客户</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="website" label="网站">
                <Input placeholder="公司网址" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="contactName" label="联系人">
                <Input placeholder="主要联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contactPhone" label="联系电话">
                <Input placeholder="手机号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contactEmail" label="联系邮箱">
                <Input placeholder="邮箱地址" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input placeholder="公司地址" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车添加" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑客户模态框 */}
      <Modal
        title="编辑客户"
        open={isEditModal}
        onCancel={() => { setIsEditModal(false); form.resetFields(); }}
        onOk={handleUpdate}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="行业">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="level" label="等级">
                <Select>
                  <Option value="A">A级</Option>
                  <Option value="B">B级</Option>
                  <Option value="C">C级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stage" label="阶段">
                <Select>
                  <Option value="prospect">潜在客户</Option>
                  <Option value="active">活跃客户</Option>
                  <Option value="churned">流失客户</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="website" label="网站">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="contactName" label="联系人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contactPhone" label="联系电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contactEmail" label="联系邮箱">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户详情抽屉 */}
      <Drawer
        title={drawerCustomer?.name || '客户详情'}
        width={640}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {drawerCustomer && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="基本信息" key="info">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="客户名称">{drawerCustomer.name}</Descriptions.Item>
                <Descriptions.Item label="等级">
                  <Tag color={levelColors[drawerCustomer.level]}>{drawerCustomer.level}级</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="阶段">
                  <Tag color={stageColors[drawerCustomer.stage]}>{stageLabels[drawerCustomer.stage]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="行业">{drawerCustomer.industry || '-'}</Descriptions.Item>
                <Descriptions.Item label="网站">{drawerCustomer.website || '-'}</Descriptions.Item>
                <Descriptions.Item label="累计成交">
                  {drawerCustomer.totalDeal ? `¥${drawerCustomer.totalDeal.toLocaleString()}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>{drawerCustomer.address || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系人">{drawerCustomer.contactName || '-'}</Descriptions.Item>
                <Descriptions.Item label="电话">{drawerCustomer.contactPhone || '-'}</Descriptions.Item>
                <Descriptions.Item label="邮箱" span={2}>{drawerCustomer.contactEmail || '-'}</Descriptions.Item>
                <Descriptions.Item label="标签" span={2}>
                  {drawerCustomer.tags ? drawerCustomer.tags.split(',').map((t: string, i: number) => (
                    <Tag key={i}>{t}</Tag>
                  )) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>{drawerCustomer.note || '-'}</Descriptions.Item>
              </Descriptions>
            </TabPane>
            <TabPane tab="联系人" key="contacts">
              {drawerCustomer.contacts?.length > 0 ? (
                <Table
                  dataSource={drawerCustomer.contacts}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '姓名', dataIndex: 'name' },
                    { title: '职位', dataIndex: 'position', render: (v: string) => v || '-' },
                    { title: '电话', dataIndex: 'phone', render: (v: string) => v || '-' },
                    { title: '邮箱', dataIndex: 'email', render: (v: string) => v || '-' },
                    { title: '主要', dataIndex: 'isPrimary', render: (v: boolean) => v ? <Tag color="green">是</Tag> : '否' },
                  ]}
                />
              ) : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无联系人</div>}
            </TabPane>
            <TabPane tab="关联商机" key="opportunities">
              {drawerCustomer.opportunities?.length > 0 ? (
                <Table
                  dataSource={drawerCustomer.opportunities}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '商机名称', dataIndex: 'title' },
                    { title: '类型', dataIndex: 'type', render: (v: string) => {
                      const labels: Record<string, string> = { supply_demand: '供需', bidding: '招投标', trade: '买卖', resource: '资源' };
                      return <Tag>{labels[v] || v}</Tag>;
                    }},
                    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v?.toLocaleString()}` },
                    { title: '阶段', dataIndex: 'stage' },
                  ]}
                />
              ) : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无关联商机</div>}
            </TabPane>
            <TabPane tab="来源线索" key="lead">
              {drawerCustomer.lead ? (
                <div>
                  <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="线索名称">{drawerCustomer.lead.name}</Descriptions.Item>
                    <Descriptions.Item label="来源">
                      <Tag>{drawerCustomer.lead.source === 'promotion' ? '推广链接' : drawerCustomer.lead.source}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="电话">{drawerCustomer.lead.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{drawerCustomer.lead.email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{new Date(drawerCustomer.lead.createdAt).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={drawerCustomer.lead.status === 'qualified' ? 'green' : 'blue'}>
                        {drawerCustomer.lead.status === 'qualified' ? '已转化' : drawerCustomer.lead.status}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ) : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>该客户为手动创建，无关联线索</div>}
            </TabPane>
            <TabPane tab="跟进记录" key="followUps">
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setFollowUpModalOpen(true)}>
                  新建跟进
                </Button>
              </div>
              {followUpLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><ClockCircleOutlined spin /> 加载中...</div>
              ) : followUps.length > 0 ? (
                <Timeline>
                  {followUps.map((f: any) => (
                    <Timeline.Item key={f.id} color={f.type === 'phone' ? 'blue' : f.type === 'visit' ? 'green' : f.type === 'email' ? 'purple' : 'gray'}>
                      <p><strong>{f.type === 'phone' ? '📞 电话' : f.type === 'visit' ? '🏢 拜访' : f.type === 'email' ? '📧 邮件' : f.type === 'wechat' ? '💬 微信' : f.type}</strong>
                        {f.user?.name && <span style={{ marginLeft: 8, color: '#888' }}>— {f.user.name}</span>}
                        <span style={{ marginLeft: 8, color: '#aaa' }}>{new Date(f.createdAt).toLocaleString()}</span>
                      </p>
                      <p>{f.content}</p>
                      {f.nextAction && <p style={{ color: '#1890ff' }}>下一步：{f.nextAction}</p>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无跟进记录，点击上方按钮添加</div>}
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* 新建跟进记录弹窗 */}
      <Modal
        title="新建跟进记录"
        open={followUpModalOpen}
        onCancel={() => { setFollowUpModalOpen(false); followUpForm.resetFields(); }}
        onOk={handleCreateFollowUp}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form form={followUpForm} layout="vertical">
          <Form.Item name="type" label="跟进方式" rules={[{ required: true, message: '请选择跟进方式' }]}>
            <Select placeholder="选择跟进方式">
              <Option value="phone"> 电话</Option>
              <Option value="visit">🏢 拜访</Option>
              <Option value="email">📧 邮件</Option>
              <Option value="wechat"> 微信</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请输入跟进内容' }]}>
            <Input.TextArea rows={4} placeholder="记录本次跟进的详细内容..." />
          </Form.Item>
          <Form.Item name="nextAction" label="下一步计划">
            <Input placeholder="如：下周二次电话跟进" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerHub;
