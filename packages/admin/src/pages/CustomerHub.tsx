import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Input, Modal, Form, message, Select, Tag,
  Drawer, Descriptions, Tabs, Popconfirm, Badge, Tooltip, Row, Col, Statistic, Timeline, Divider,
  InputNumber, DatePicker, Image, Empty
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  TeamOutlined, UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined,
  StarOutlined, SwapOutlined, FundOutlined, ContactsOutlined, MessageOutlined, ClockCircleOutlined,
  CameraOutlined, PictureOutlined, RocketOutlined, PlayCircleOutlined, CheckCircleOutlined
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

  // 员工列表（用于分配对接人）
  const [employees, setEmployees] = useState<any[]>([]);

  // 创建商机
  const [oppModalOpen, setOppModalOpen] = useState(false);
  const [oppForm] = Form.useForm();
  const [oppTargetCustomer, setOppTargetCustomer] = useState<any>(null);

  // 拜访记录
  const [visitRecords, setVisitRecords] = useState<any[]>([]);
  const [visitLoading, setVisitLoading] = useState(false);

  // 任务管理抽屉
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [taskCustomer, setTaskCustomer] = useState<any>(null);

  // 客户两项任务
  const customerTaskList = [
    { key: 'phone_contact', label: '电话联络', icon: <PhoneOutlined />, color: 'blue', desc: '初步接触客户，确认需求意向' },
    { key: 'customer_visit', label: '客户拜访', icon: <CameraOutlined />, color: 'green', desc: '实地拜访，拍照打卡，收集详细需求' },
  ];

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

  useEffect(() => { fetchCustomers(); fetchStats(); fetchEmployees(); }, [searchTerm, levelFilter, stageFilter]);

  // 获取员工列表（用于分配对接人）
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employees`, { headers: getHeaders(), params: { page: 1, pageSize: 200 } });
      if (res.data.code === 0 || res.data.code === 200) {
        setEmployees(res.data.data?.list || res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

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
        // 加载拜访记录
        loadVisitRecords(record.id);
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

  // 加载拜访记录
  const loadVisitRecords = async (customerId: string) => {
    setVisitLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/customers/${customerId}/visits`, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setVisitRecords(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch { setVisitRecords([]); }
    finally { setVisitLoading(false); }
  };

  // 打开任务管理抽屉
  const openTaskDrawer = (customer: any) => {
    setTaskCustomer(customer);
    setTaskDrawerOpen(true);
  };

  // 启动任务
  const handleStartTask = async (taskKey: string) => {
    if (!taskCustomer) return;
    const task = customerTaskList.find(t => t.key === taskKey);
    if (!task) return;

    Modal.confirm({
      title: `启动「${task.label}」任务`,
      content: (
        <div>
          <p>确定为客户「<strong>{taskCustomer.name}</strong>」启动{task.label}任务吗？</p>
          <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
            任务启动后，前端移动端将显示该任务，销售人员完成操作后状态自动更新为“已完成”
          </p>
        </div>
      ),
      okText: '确认启动',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.success(`「${task.label}」任务已启动，请通知销售人员在移动端查看并执行`);
          fetchCustomers(pagination.current);
          showDetail(taskCustomer);
        } catch (error: any) {
          console.error('启动任务失败:', error);
          message.error(error.response?.data?.message || '启动失败');
        }
      },
    });
  };

  // 判断任务是否已完成
  const isTaskCompleted = (customer: any, taskKey: string) => {
    if (!customer) return false;
    if (taskKey === 'phone_contact') {
      return (customer.followUps || []).some((f: any) => f.type === 'phone');
    }
    if (taskKey === 'customer_visit') {
      return (customer.visitRecords || []).length > 0;
    }
    return false;
  };

  // 转化为商机（一键转化）
  const handleConvertToOpportunity = (customer: any) => {
    Modal.confirm({
      title: '转化为客户商机',
      content: (
        <div>
          <p>确定将客户 <strong>「{customer.name}」</strong> 转化为商机吗？</p>
          <p style={{ color: '#888', fontSize: 13 }}>将自动创建一个关联该客户的商机，起始阶段为「电话联络」</p>
        </div>
      ),
      okText: '确认转化',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await axios.post(`${API_BASE}/opportunities`, {
            title: `${customer.name} - 商机`,
            customerId: customer.id,
            type: 'supply_demand',
            stage: 'phone_contact',
            probability: 50,
          }, { headers: getHeaders() });
          if (res.data.code === 0 || res.data.code === 200) {
            message.success(`已将「${customer.name}」转化为商机`);
            fetchCustomers(pagination.current);
            fetchStats();
          } else {
            message.error(res.data.message || '转化失败');
          }
        } catch {
          message.error('转化失败');
        }
      },
    });
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
      title: '对接人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 100,
      render: (v: string) => v ? <Tag color="blue"><UserOutlined /> {v}</Tag> : <Tag>-</Tag>,
    },
    {
      title: '电话联络',
      key: 'phoneContactTask',
      width: 100,
      render: (_: any, record: any) => {
        const completed = (record.followUps || []).some((f: any) => f.type === 'phone');
        return completed ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>✅已完成</Tag>
        ) : (
          <Tag color="default">⏳待执行</Tag>
        );
      },
    },
    {
      title: '客户拜访',
      key: 'customerVisitTask',
      width: 100,
      render: (_: any, record: any) => {
        const completed = (record.visitRecords || []).length > 0;
        return completed ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>✅已完成</Tag>
        ) : (
          <Tag color="default">⏳待执行</Tag>
        );
      },
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
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)} />
          </Tooltip>
          <Tooltip title="转化为商机">
            <Button type="link" size="small" icon={<SwapOutlined />} style={{ color: '#faad14' }} onClick={() => handleConvertToOpportunity(record)} />
          </Tooltip>
          <Tooltip title="任务管理">
            <Button type="link" size="small" icon={<RocketOutlined />} style={{ color: '#722ed1' }} onClick={() => openTaskDrawer(record)} />
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assigneeName" label="分配对接人">
                <Select 
                  placeholder="选择销售人员" 
                  allowClear 
                  showSearch 
                  optionFilterProp="label"
                >
                  {employees.map((emp: any) => (
                    <Option key={emp.id} value={emp.name} label={`${emp.name} (${emp.department || '无部门'})`}>
                      {emp.name} - {emp.department || '无部门'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
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
                <Descriptions.Item label="对接人">
                  {drawerCustomer.assigneeName ? (
                    <Tag color="blue"><UserOutlined /> {drawerCustomer.assigneeName}</Tag>
                  ) : '-'}
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
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" size="small" icon={<SwapOutlined />} onClick={() => handleConvertToOpportunity(drawerCustomer)}>
                  转化为商机
                </Button>
              </div>
              {drawerCustomer.opportunities?.length > 0 ? (
                <Table
                  dataSource={drawerCustomer.opportunities}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5, simple: true }}
                  columns={[
                    { title: '商机名称', dataIndex: 'title', render: (v: string) => <strong>{v}</strong> },
                    { title: '类型', dataIndex: 'type', render: (v: string) => {
                      const labels: Record<string, string> = { supply_demand: '供需', bidding: '招投标', trade: '买卖', resource: '资源' };
                      return <Tag color="blue">{labels[v] || v}</Tag>;
                    }},
                    { title: '金额', dataIndex: 'amount', render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
                    { title: '阶段', dataIndex: 'stage', render: (v: string) => {
                      const sl: Record<string, string> = {
                        phone_contact: '电话联络', customer_visit: '客户拜访',
                        project_publish: '项目发布', project_docking: '项目对接', project_landing: '项目落地'
                      };
                      const sc: Record<string, string> = {
                        phone_contact: 'blue', customer_visit: 'green',
                        project_publish: 'orange', project_docking: 'purple', project_landing: 'red'
                      };
                      return <Tag color={sc[v] || 'default'}>{sl[v] || v}</Tag>;
                    }},
                    { title: '概率', dataIndex: 'probability', render: (v: number) => `${v || 0}%` },
                  ]}
                />
              ) : <Empty description="暂无关联商机，点击上方按钮创建" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
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
            <TabPane tab={<span><CameraOutlined /> 拜访记录</span>} key="visits">
              {visitLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><ClockCircleOutlined spin /> 加载中...</div>
              ) : visitRecords.length > 0 ? (
                <Timeline>
                  {visitRecords.map((record: any) => (
                    <Timeline.Item key={record.id} color="green">
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="green"><CameraOutlined /> 现场拜访</Tag>
                        <span style={{ color: '#999', fontSize: 12 }}>{new Date(record.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>{record.content || '无详细内容'}</div>
                      {record.location && (
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          <EnvironmentOutlined /> {record.location}
                          {record.lat && record.lng && <span style={{ marginLeft: 8, color: '#aaa' }}>({record.lat}, {record.lng})</span>}
                        </div>
                      )}
                      {record.photos && record.photos.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                            <PictureOutlined /> 现场照片 ({record.photos.length}张)
                          </div>
                          <Image.PreviewGroup>
                            <Space wrap>
                              {record.photos.map((photo: any, idx: number) => (
                                <Image
                                  key={idx}
                                  src={photo.url || photo}
                                  width={100}
                                  height={100}
                                  style={{ objectFit: 'cover', borderRadius: 4 }}
                                />
                              ))}
                            </Space>
                          </Image.PreviewGroup>
                        </div>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : <Empty description="暂无拜访记录" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <div style={{ color: '#999' }}>前端移动端完成的拜访记录将在此展示</div>
              </Empty>}
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

      {/* 任务管理抽屉 */}
      <Drawer
        title={taskCustomer ? `任务管理 - ${taskCustomer.name}` : '任务管理'}
        open={taskDrawerOpen}
        onClose={() => { setTaskDrawerOpen(false); setTaskCustomer(null); }}
        width={560}
      >
        {taskCustomer && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="客户名称" span={2}><strong>{taskCustomer.name}</strong></Descriptions.Item>
              <Descriptions.Item label="等级"><Tag color={levelColors[taskCustomer.level]}>{taskCustomer.level}级</Tag></Descriptions.Item>
              <Descriptions.Item label="对接人">{taskCustomer.assigneeName || '-'}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginBottom: 16 }}>客户任务列表</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {customerTaskList.map((task, idx) => {
                const completed = isTaskCompleted(taskCustomer, task.key);
                const prevCompleted = idx === 0 || isTaskCompleted(taskCustomer, customerTaskList[idx - 1].key);

                return (
                  <Card
                    key={task.key}
                    size="small"
                    style={{
                      borderRadius: 12,
                      border: completed ? '2px solid #52c41a' : '1px solid #e8e8e8',
                      background: completed ? '#f6ffed' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: completed ? '#52c41a' : task.color === 'blue' ? '#e6f7ff' : '#f6ffed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20,
                        }}>
                          {completed ? <CheckCircleOutlined style={{ color: '#fff' }} /> : task.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 16 }}>{task.label}</div>
                          <div style={{ fontSize: 13, color: '#999' }}>{task.desc}</div>
                        </div>
                      </div>
                      <div>
                        {completed ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            disabled={!prevCompleted}
                            onClick={() => handleStartTask(task.key)}
                            style={{ background: '#722ed1', borderColor: '#722ed1' }}
                          >
                            启动任务
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Divider />
            <div style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>
              任务启动后，前端移动端将显示对应任务，销售人员完成操作后状态自动更新
            </div>
          </div>
        )}
      </Drawer>

      {/* 创建商机弹窗（保留，从详情页使用） */}
      <Modal
        title={`为「${drawerCustomer?.name || ''}」创建商机`}
        open={oppModalOpen}
        onCancel={() => { setOppModalOpen(false); oppForm.resetFields(); }}
        onOk={async () => {
          if (!drawerCustomer) return;
          try {
            const values = await oppForm.validateFields();
            if (values.expectedCloseDate && values.expectedCloseDate.toISOString) {
              values.expectedCloseDate = values.expectedCloseDate.toISOString();
            }
            values.customerId = drawerCustomer.id;
            const res = await axios.post(`${API_BASE}/opportunities`, values, { headers: getHeaders() });
            if (res.data.code === 0 || res.data.code === 200) {
              message.success('商机创建成功');
              setOppModalOpen(false);
              oppForm.resetFields();
              showDetail(drawerCustomer);
            } else {
              message.error(res.data.message || '创建失败');
            }
          } catch (error: any) {
            if (error.errorFields) message.warning('请填写必填项');
            else message.error('创建失败');
          }
        }}
        width={560}
        okText="创建"
        cancelText="取消"
      >
        <Form form={oppForm} layout="vertical">
          <Form.Item name="title" label="商机名称" rules={[{ required: true, message: '请输入商机名称' }]}>
            <Input placeholder="输入商机名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="商机类型" initialValue="supply_demand">
                <Select>
                  <Option value="supply_demand">供需信息</Option>
                  <Option value="bidding">招投标</Option>
                  <Option value="trade">买卖关系</Option>
                  <Option value="resource">资源对接</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stage" label="起始阶段" initialValue="phone_contact">
                <Select>
                  <Option value="phone_contact">电话联络</Option>
                  <Option value="customer_visit">客户拜访</Option>
                  <Option value="project_publish">项目发布</Option>
                  <Option value="project_docking">项目对接</Option>
                  <Option value="project_landing">项目落地</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="probability" label="赢单概率(%)">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="预估金额">
                <InputNumber style={{ width: '100%' }} placeholder="金额" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedCloseDate" label="预计成交日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={3} placeholder="描述商机详情..." />
          </Form.Item>
        </Form>
      </Modal>

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
