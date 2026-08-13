import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Input, Modal, Form, message, Select, Tag,
  Row, Col, Statistic, Tooltip, Popconfirm, DatePicker, InputNumber,
  Drawer, Descriptions, Steps, Timeline, Empty, Divider
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  FundOutlined, SwapOutlined, FileTextOutlined, TeamOutlined, GiftOutlined,
  PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, RocketOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Option } = Select;
const API_BASE = `${API_BASE_URL}/api/v1/admin`;

const OpportunityManagement: React.FC = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const [isCreateModal, setIsCreateModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentOpp, setCurrentOpp] = useState<any>(null);
  const [form] = Form.useForm();
  const [oppType, setOppType] = useState('supply_demand');
  const [customers, setCustomers] = useState<any[]>([]);

  const [stats, setStats] = useState({ total: 0, pending: 0, following: 0, won: 0, totalAmount: 0 });

  // 任务管理抽屉
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [taskOpp, setTaskOpp] = useState<any>(null);
  const [taskForm] = Form.useForm();

  // 商机三项任务
  const taskList = [
    { key: 'project_publish', label: '项目发布', icon: <FileTextOutlined />, color: 'orange', stage: 'project_publish', desc: '发布项目信息到平台，供潜在合作方浏览' },
    { key: 'project_docking', label: '项目对接', icon: <SwapOutlined />, color: 'purple', stage: 'project_docking', desc: '与意向方进行商务对接、洽谈合作细节' },
    { key: 'project_landing', label: '项目落地', icon: <CheckCircleOutlined />, color: 'red', stage: 'project_landing', desc: '签署合同/协议，项目正式落地执行' },
  ];

  const getToken = () => localStorage.getItem('adminToken');
  const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/customers`, { headers: getHeaders(), params: { page: 1, pageSize: 200 } });
      if (res.data.code === 0 || res.data.code === 200) {
        setCustomers(res.data.data?.list || res.data.data || []);
      }
    } catch { /* ignore */ }
  };

  const fetchOpportunities = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/opportunities`, {
        headers: getHeaders(),
        params: { page, pageSize: 20, search: searchTerm, type: typeFilter, stage: stageFilter }
      });
      if (res.data.code === 0 || res.data.code === 200) {
        setOpportunities(res.data.data?.list || []);
        setPagination(prev => ({ ...prev, current: page, total: res.data.data?.total || 0 }));
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/opportunities/stats`, { headers: getHeaders() });
      if (res.data.code === 0 || res.data.code === 200) {
        setStats(res.data.data || { total: 0, pending: 0, following: 0, won: 0, totalAmount: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => { fetchOpportunities(); fetchStats(); fetchCustomers(); }, [searchTerm, typeFilter, stageFilter]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (values.deadline && values.deadline.toISOString) {
        values.deadline = values.deadline.toISOString();
      }
      if (values.expectedCloseDate && values.expectedCloseDate.toISOString) {
        values.expectedCloseDate = values.expectedCloseDate.toISOString();
      }
      await axios.post(`${API_BASE}/opportunities`, values, { headers: getHeaders() });
      message.success('商机创建成功');
      setIsCreateModal(false);
      form.resetFields();
      fetchOpportunities(1);
      fetchStats();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (values.deadline && values.deadline.toISOString) values.deadline = values.deadline.toISOString();
      if (values.expectedCloseDate && values.expectedCloseDate.toISOString) values.expectedCloseDate = values.expectedCloseDate.toISOString();
      await axios.put(`${API_BASE}/opportunities/${currentOpp.id}`, values, { headers: getHeaders() });
      message.success('商机更新成功');
      setIsEditModal(false);
      form.resetFields();
      fetchOpportunities(pagination.current);
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/opportunities/${id}`, { headers: getHeaders() });
      message.success('商机删除成功');
      fetchOpportunities(pagination.current);
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 打开任务管理抽屉
  const openTaskDrawer = (opp: any) => {
    setTaskOpp(opp);
    setTaskDrawerOpen(true);
  };

  // 启动/完成任务
  const handleStartTask = async (taskKey: string) => {
    if (!taskOpp) return;
    const task = taskList.find(t => t.key === taskKey);
    if (!task) return;

    Modal.confirm({
      title: `启动「${task.label}」任务`,
      content: `确定为商机「${taskOpp.title}」启动${task.label}任务吗？启动后将推进阶段到${task.label}。`,
      okText: '确认启动',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await axios.put(`${API_BASE}/opportunities/${taskOpp.id}`, {
            stage: task.stage,
          }, { headers: getHeaders() });
          if (res.data.code === 0 || res.data.code === 200) {
            message.success(`已启动「${task.label}」任务，阶段已推进`);
            fetchOpportunities(pagination.current);
            // 更新抽屉中的商机数据
            setTaskOpp((prev: any) => prev ? { ...prev, stage: task.stage } : prev);
          } else {
            message.error('操作失败');
          }
        } catch {
          message.error('操作失败');
        }
      },
    });
  };

  // 判断任务是否已完成
  const isTaskCompleted = (opp: any, taskKey: string) => {
    if (!opp) return false;
    const stageOrder = ['phone_contact', 'customer_visit', 'project_publish', 'project_docking', 'project_landing'];
    const taskStageMap: Record<string, string> = {
      project_publish: 'project_publish',
      project_docking: 'project_docking',
      project_landing: 'project_landing',
    };
    const currentIdx = stageOrder.indexOf(opp.stage);
    const taskIdx = stageOrder.indexOf(taskStageMap[taskKey]);
    return currentIdx >= taskIdx;
  };

  const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    supply_demand: { label: '供需信息', color: 'blue', icon: <SwapOutlined /> },
    bidding: { label: '招投标', color: 'orange', icon: <FileTextOutlined /> },
    trade: { label: '买卖关系', color: 'green', icon: <TeamOutlined /> },
    resource: { label: '资源对接', color: 'purple', icon: <GiftOutlined /> },
  };

  const stageColors: Record<string, string> = {
    phone_contact: 'blue',
    customer_visit: 'cyan',
    project_publish: 'purple',
    project_docking: 'gold',
    project_landing: 'green'
  };
  const stageLabels: Record<string, string> = {
    phone_contact: '电话联络',
    customer_visit: '客户拜访',
    project_publish: '项目发布',
    project_docking: '项目对接',
    project_landing: '项目落地'
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => {
        const config = typeConfig[type];
        return <Tag color={config?.color} icon={config?.icon}>{config?.label || type}</Tag>;
      },
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (stage: string) => <Tag color={stageColors[stage]}>{stageLabels[stage] || stage}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      sorter: (a: any, b: any) => (a.amount || 0) - (b.amount || 0),
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-',
    },
    {
      title: '对方单位',
      dataIndex: 'counterparty',
      key: 'counterparty',
      width: 150,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '赢单概率',
      dataIndex: 'probability',
      key: 'probability',
      width: 90,
      sorter: (a: any, b: any) => (a.probability || 0) - (b.probability || 0),
      render: (v: number) => `${v || 0}%`,
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 110,
      render: (d: string) => d ? new Date(d).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
              setCurrentOpp(record);
              setOppType(record.type);
              const values = { ...record };
              if (values.deadline) values.deadline = typeof values.deadline === 'string' ? values.deadline : values.deadline;
              if (values.expectedCloseDate) values.expectedCloseDate = typeof values.expectedCloseDate === 'string' ? values.expectedCloseDate : values.expectedCloseDate;
              form.setFieldsValue(values);
              setIsEditModal(true);
            }} />
          </Tooltip>
          <Tooltip title="任务管理">
            <Button type="link" size="small" icon={<RocketOutlined />} style={{ color: '#722ed1' }} onClick={() => openTaskDrawer(record)} />
          </Tooltip>
          <Popconfirm title="确定删除此商机？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 根据类型渲染不同表单字段
  const renderTypeFields = (prefix = '') => {
    const namePrefix = '';
    switch (oppType) {
      case 'bidding':
        return (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="budget" label="预算金额">
                <InputNumber style={{ width: '100%' }} placeholder="预算" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deadline" label="投标截止日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="counterparty" label="招标单位">
                <Input placeholder="招标单位名称" />
              </Form.Item>
            </Col>
          </Row>
        );
      case 'trade':
        return (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="counterparty" label="合作方">
                <Input placeholder="合作方名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="amount" label="交易规模">
                <InputNumber style={{ width: '100%' }} placeholder="金额" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expectedCloseDate" label="合同期限">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        );
      case 'resource':
        return (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="counterparty" label="对接方">
                <Input placeholder="资源对接方" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cooperationMode" label="合作模式">
                <Select placeholder="选择合作模式">
                  <Option value="exchange">资源互换</Option>
                  <Option value="share">资源共享</Option>
                  <Option value="purchase">资源采购</Option>
                  <Option value="joint">联合开发</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="amount" label="预估金额">
                <InputNumber style={{ width: '100%' }} placeholder="金额" min={0} />
              </Form.Item>
            </Col>
          </Row>
        );
      default: // supply_demand
        return (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="amount" label="预估金额">
                <InputNumber style={{ width: '100%' }} placeholder="金额" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="industry" label="行业领域">
                <Input placeholder="所属行业" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="counterparty" label="对方单位">
                <Input placeholder="买方/卖方" />
              </Form.Item>
            </Col>
          </Row>
        );
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>
          <FundOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          商机管理
        </h3>
        <span style={{ color: '#888' }}>管理供需信息、招投标、买卖关系、资源对接等多类型商机</span>
      </div>

      {/* 统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={5}>
          <Card size="small">
            <Statistic title="商机总数" value={stats.total} prefix={<FundOutlined />} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic title="待确认" value={stats.pending} valueStyle={{ color: '#8c8c8c' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic title="跟进中" value={stats.following} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic title="已成交" value={stats.won} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="总金额" value={stats.totalAmount} prefix="¥" precision={0} valueStyle={{ color: '#faad14', fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input
              placeholder="搜索商机名称"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 130 }}>
              <Option value="all">全部类型</Option>
              <Option value="supply_demand">供需信息</Option>
              <Option value="bidding">招投标</Option>
              <Option value="trade">买卖关系</Option>
              <Option value="resource">资源对接</Option>
            </Select>
            <Select value={stageFilter} onChange={setStageFilter} style={{ width: 130 }}>
              <Option value="all">全部阶段</Option>
              <Option value="phone_contact">电话联络</Option>
              <Option value="customer_visit">客户拜访</Option>
              <Option value="project_publish">项目发布</Option>
              <Option value="project_docking">项目对接</Option>
              <Option value="project_landing">项目落地</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setOppType('supply_demand');
            setIsCreateModal(true);
          }}>
            新建商机
          </Button>
        </div>
      </Card>

      {/* 商机列表 */}
      <Table
        columns={columns}
        dataSource={opportunities}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: false,
          showTotal: total => `共 ${total} 条商机`,
          onChange: (page) => fetchOpportunities(page),
        }}
      />

      {/* 新建商机 */}
      <Modal
        title="新建商机"
        open={isCreateModal}
        onCancel={() => { setIsCreateModal(false); form.resetFields(); }}
        onOk={handleCreate}
        width={650}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="商机名称" rules={[{ required: true }]}>
            <Input placeholder="输入商机名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="商机类型" initialValue="supply_demand">
                <Select onChange={(v: string) => setOppType(v)}>
                  <Option value="supply_demand">供需信息</Option>
                  <Option value="bidding">招投标</Option>
                  <Option value="trade">买卖关系</Option>
                  <Option value="resource">资源对接</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stage" label="阶段" initialValue="phone_contact">
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
              <Form.Item name="customerId" label="关联客户">
                <Select placeholder="选择关联客户（可选）" allowClear showSearch optionFilterProp="label">
                  {customers.map((c: any) => (
                    <Option key={c.id} value={c.id} label={c.name}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={3} placeholder="描述需求/资源/招标详情等" />
          </Form.Item>
          {renderTypeFields()}
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={8}>
              <Form.Item name="probability" label="赢单概率(%)" initialValue={50}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expectedCloseDate" label="预计成交日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务管理抽屉 */}
      <Drawer
        title={taskOpp ? `任务管理 - ${taskOpp.title}` : '任务管理'}
        open={taskDrawerOpen}
        onClose={() => { setTaskDrawerOpen(false); setTaskOpp(null); }}
        width={600}
      >
        {taskOpp && (() => {
          const stageOrder = ['phone_contact', 'customer_visit', 'project_publish', 'project_docking', 'project_landing'];
          const currentIdx = stageOrder.indexOf(taskOpp.stage);

          return (
            <div>
              {/* 商机基本信息 */}
              <Card size="small" style={{ marginBottom: 20 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="商机名称" span={2}><strong>{taskOpp.title}</strong></Descriptions.Item>
                  <Descriptions.Item label="关联客户">{taskOpp.customer?.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="当前阶段">
                    <Tag color={stageColors[taskOpp.stage]}>{stageLabels[taskOpp.stage] || taskOpp.stage}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="金额">{taskOpp.amount ? `¥${Number(taskOpp.amount).toLocaleString()}` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="概率">{taskOpp.probability || 0}%</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 全流程进度 */}
              <Card size="small" title="全流程进度" style={{ marginBottom: 20 }}>
                <Steps
                  current={currentIdx}
                  size="small"
                  items={stageOrder.map((s) => ({
                    title: stageLabels[s],
                    status: stageOrder.indexOf(s) < currentIdx ? 'finish' : stageOrder.indexOf(s) === currentIdx ? 'process' : 'wait',
                  }))}
                />
              </Card>

              {/* 三项任务卡片 */}
              <Divider orientation="left" style={{ fontSize: 15, fontWeight: 600 }}>
                <RocketOutlined style={{ marginRight: 6 }} />商机任务（启动后前端可见）
              </Divider>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {taskList.map((task, idx) => {
                  const completed = isTaskCompleted(taskOpp, task.key);
                  const prevCompleted = idx === 0 || isTaskCompleted(taskOpp, taskList[idx - 1].key);

                  return (
                    <Card
                      key={task.key}
                      size="small"
                      style={{
                        borderLeft: `3px solid ${completed ? '#52c41a' : task.color === 'orange' ? '#faad14' : task.color === 'purple' ? '#722ed1' : '#f5222d'}`,
                        background: completed ? '#f6ffed' : '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Space>
                            {task.icon}
                            <span style={{ fontSize: 15, fontWeight: 600 }}>{task.label}</span>
                            {completed ? (
                              <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
                            ) : (
                              <Tag color="default" icon={<ClockCircleOutlined />}>待启动</Tag>
                            )}
                          </Space>
                          <div style={{ color: '#888', fontSize: 13, marginTop: 4, marginLeft: 24 }}>
                            {task.desc}
                          </div>
                        </div>
                        <div>
                          {completed ? (
                            <Tag color="success" style={{ fontSize: 13, padding: '4px 12px' }}>✓ 已推进</Tag>
                          ) : (
                            <Button
                              type="primary"
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

              {/* 提示信息 */}
              <div style={{ marginTop: 20, padding: 12, background: '#e6f7ff', borderRadius: 6, fontSize: 13, color: '#1890ff' }}>
                💡 任务按顺序启动：项目发布 → 项目对接 → 项目落地。启动后前端 Web 将实时展示任务完成状态。
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* 编辑商机 */}
      <Modal
        title="编辑商机"
        open={isEditModal}
        onCancel={() => { setIsEditModal(false); form.resetFields(); }}
        onOk={handleUpdate}
        width={650}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="商机名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="类型">
                <Select onChange={(v: string) => setOppType(v)}>
                  <Option value="supply_demand">供需信息</Option>
                  <Option value="bidding">招投标</Option>
                  <Option value="trade">买卖关系</Option>
                  <Option value="resource">资源对接</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stage" label="阶段">
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
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          {renderTypeFields()}
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OpportunityManagement;
