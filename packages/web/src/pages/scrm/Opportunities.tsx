import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Typography, message, Modal, Form, Input, InputNumber, Select, Drawer, Descriptions, Divider, Steps, Timeline, Empty, Card, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, PhoneOutlined, CameraOutlined, FileTextOutlined, SwapOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { scrmApi } from '../../services/api';
const { Title } = Typography;

// 商机三项任务（管理后台启动，前端展示执行成果）
const taskConfig: Record<string, { label: string; color: string; stage: string }> = {
  project_publish: { label: '项目发布', color: 'orange', stage: 'project_publish' },
  project_docking: { label: '项目对接', color: 'purple', stage: 'project_docking' },
  project_landing: { label: '项目落地', color: 'red', stage: 'project_landing' },
};
const taskOrder = ['project_publish', 'project_docking', 'project_landing'];

// 全部五阶段（用于进度条）
const stageConfig: Record<string, { label: string; color: string }> = {
  phone_contact: { label: '电话联络', color: 'blue' },
  customer_visit: { label: '客户拜访', color: 'green' },
  project_publish: { label: '项目发布', color: 'orange' },
  project_docking: { label: '项目对接', color: 'purple' },
  project_landing: { label: '项目落地', color: 'red' },
};

const getStageIcon = (stage: string) => {
  switch (stage) {
    case 'phone_contact': return <PhoneOutlined />;
    case 'customer_visit': return <CameraOutlined />;
    case 'project_publish': return <FileTextOutlined />;
    case 'project_docking': return <SwapOutlined />;
    case 'project_landing': return <CheckCircleOutlined />;
    default: return null;
  }
};

const stageOrder = ['phone_contact', 'customer_visit', 'project_publish', 'project_docking', 'project_landing'];

export default function Opportunities() {
  const { t } = useTranslation();
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [viewDrawer, setViewDrawer] = useState(false);
  const [currentOpp, setCurrentOpp] = useState<any>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const typeLabels: Record<string, string> = {
    supply_demand: t('opportunities.supplyDemand'),
    bidding: t('opportunities.bidding'),
    trade: t('opportunities.trade'),
    resource: t('opportunities.resourceDocking'),
  };

  useEffect(() => {
    loadOpportunities();
    loadCustomers();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const res: any = await scrmApi.getOpportunities();
      if (res.code === 0) setOpps(res.data || []);
      else message.error('加载失败');
    } catch {
      message.error(t('opportunities.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res: any = await scrmApi.getCustomers({ page: 1, pageSize: 200 });
      if (res.code === 0) setCustomers(res.data?.list || res.data || []);
    } catch {}
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      if (values.expectedCloseDate && values.expectedCloseDate.toISOString) {
        values.expectedCloseDate = values.expectedCloseDate.toISOString();
      }
      const res: any = await scrmApi.createOpportunity(values);
      if (res.code === 0) {
        message.success(t('opportunities.createSuccess'));
        setCreateModal(false);
        createForm.resetFields();
        loadOpportunities();
      } else {
        message.error(res.message || t('opportunities.createFailed'));
      }
    } catch {
      message.error(t('opportunities.fillRequired'));
    }
  };

  const handleEdit = async () => {
    try {
      const values = await form.validateFields();
      if (values.expectedCloseDate && values.expectedCloseDate.toISOString) {
        values.expectedCloseDate = values.expectedCloseDate.toISOString();
      }
      const res: any = await scrmApi.updateOpportunity(currentOpp.id, values);
      if (res.code === 0) {
        message.success(t('opportunities.updateSuccess'));
        setEditModal(false);
        form.resetFields();
        loadOpportunities();
      } else {
        message.error(res.message || t('opportunities.updateFailed'));
      }
    } catch {
      message.error(t('opportunities.updateFailed'));
    }
  };

  const handleQuickStage = async (opp: any, newStage: string) => {
    const res: any = await scrmApi.updateOpportunity(opp.id, { stage: newStage });
    if (res.code === 0) {
      message.success(`已推进到：${stageConfig[newStage]?.label}`);
      loadOpportunities();
    } else {
      message.error(t('opportunities.updateFailed'));
    }
  };

  const openEdit = (opp: any) => {
    setCurrentOpp(opp);
    form.setFieldsValue({
      ...opp,
      expectedCloseDate: opp.expectedCloseDate ? new Date(opp.expectedCloseDate) : undefined,
    });
    setEditModal(true);
  };

  // 获取当前阶段索引
  const getStageIndex = (stage: string) => stageOrder.indexOf(stage);

  // 获取阶段成果
  const getStageAchievements = (opp: any) => opp.stageAchievements || {};

  // 判断任务完成状态
  const isTaskDone = (opp: any, task: string) => {
    const idx = getStageIndex(opp.stage);
    const taskIdx = taskOrder.indexOf(task);
    return idx >= taskIdx;
  };

  const columns = [
    {
      title: t('opportunities.opportunityName'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text: string, record: any) => (
        <a onClick={() => { setCurrentOpp(record); setViewDrawer(true); }} style={{ fontWeight: 500 }}>{text}</a>
      ),
    },
    {
      title: t('opportunities.customer'),
      dataIndex: 'customer',
      key: 'customer',
      width: 130,
      render: (c: any) => c?.name || '-',
    },
    {
      title: t('opportunities.type'),
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (v: string) => <Tag color="blue">{typeLabels[v] || v || '-'}</Tag>,
    },
    {
      title: '当前阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 160,
      render: (v: string, record: any) => {
        const idx = getStageIndex(v);
        const nextStage = idx < stageOrder.length - 1 ? stageOrder[idx + 1] : null;
        const config = stageConfig[v];
        return (
          <Space size={4}>
            <Tag color={config?.color}>{getStageIcon(v)} {config?.label || v}</Tag>
            {nextStage && (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, fontSize: 12, color: '#1677ff' }}
                onClick={() => handleQuickStage(record, nextStage)}
              >
                → {stageConfig[nextStage]?.label}
              </Button>
            )}
          </Space>
        );
      },
    },
    {
      title: t('opportunities.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      sorter: (a: any, b: any) => (a.amount || 0) - (b.amount || 0),
      render: (v: number) => v ? `¥${Number(v).toLocaleString()}` : '-',
    },
    {
      title: t('opportunities.winRate'),
      dataIndex: 'probability',
      key: 'probability',
      width: 90,
      sorter: (a: any, b: any) => (a.probability || 0) - (b.probability || 0),
      render: (v: number) => <span style={{ color: v >= 80 ? '#52c41a' : v >= 50 ? '#faad14' : '#999' }}>{v || 0}%</span>,
    },
    {
      title: '进度',
      key: 'progress',
      width: 120,
      render: (_: any, record: any) => {
        const idx = getStageIndex(record.stage);
        return (
          <span style={{ fontSize: 12, color: '#888' }}>
            {idx + 1} / {stageOrder.length}
          </span>
        );
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentOpp(record); setViewDrawer(true); }} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>{t('opportunities.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>{t('opportunities.addOpportunity')}</Button>
      </div>

      <Table
        columns={columns}
        dataSource={opps}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => t('opportunities.totalRecords', { total }),
        }}
      />

      {/* 新建商机 */}
      <Modal
        title={t('opportunities.addOpportunity')}
        open={createModal}
        onCancel={() => { setCreateModal(false); createForm.resetFields(); }}
        onOk={handleCreate}
        width={560}
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="title" label={t('opportunities.opportunityName')} rules={[{ required: true, message: t('opportunities.inputOppName') }]}>
            <Input placeholder={t('opportunities.inputOppName')} />
          </Form.Item>
          <Form.Item name="customerId" label={t('opportunities.customer')}>
            <Select placeholder={t('opportunities.selectCustomer')} allowClear showSearch optionFilterProp="label">
              {customers.map((c: any) => (
                <Select.Option key={c.id} value={c.id} label={c.name}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="type" label={t('opportunities.type')} initialValue="supply_demand" style={{ flex: 1 }}>
              <Select>
                <Select.Option value="supply_demand">{t('opportunities.supplyDemand')}</Select.Option>
                <Select.Option value="bidding">{t('opportunities.bidding')}</Select.Option>
                <Select.Option value="trade">{t('opportunities.trade')}</Select.Option>
                <Select.Option value="resource">{t('opportunities.resourceDocking')}</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="stage" label="起始阶段" initialValue="phone_contact" style={{ flex: 1 }}>
              <Select>
                {stageOrder.map(s => (
                  <Select.Option key={s} value={s}>{stageConfig[s].label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="amount" label={t('opportunities.estimatedAmount')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder={t('opportunities.amountPlaceholder')} min={0} />
            </Form.Item>
            <Form.Item name="probability" label={`${t('opportunities.winRate')}(%)`} initialValue={50} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} max={100} />
            </Form.Item>
          </div>
          <Form.Item name="expectedCloseDate" label={t('opportunities.expectedCloseDate')}>
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label={t('opportunities.note')}>
            <Input.TextArea rows={2} placeholder={t('opportunities.remarkPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑商机 */}
      <Modal
        title={t('opportunities.editOpportunity')}
        open={editModal}
        onCancel={() => { setEditModal(false); form.resetFields(); }}
        onOk={handleEdit}
        width={560}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label={t('opportunities.opportunityName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="stage" label="当前阶段" style={{ flex: 1 }}>
              <Select>
                {stageOrder.map(s => (
                  <Select.Option key={s} value={s}>{stageConfig[s].label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="probability" label={`${t('opportunities.winRate')}(%)`} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} max={100} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="amount" label={t('opportunities.amount')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="expectedCloseDate" label={t('opportunities.expectedCloseDate')} style={{ flex: 1 }}>
              <Input type="date" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="note" label={t('opportunities.note')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情抽屉 */}
      <Drawer
        title={currentOpp?.title || t('opportunities.opportunityDetail')}
        open={viewDrawer}
        onClose={() => setViewDrawer(false)}
        width={640}
      >
        {currentOpp && (() => {
          const currentIdx = getStageIndex(currentOpp.stage);
          const achievements = getStageAchievements(currentOpp);

          return (
            <Tabs defaultActiveKey="overview">
              {/* 概览 */}
              <Tabs.TabPane tab="概览" key="overview">
                {/* 五阶段进度条 */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>全流程进度</div>
                  <Steps
                    current={currentIdx}
                    size="small"
                    items={stageOrder.map((s) => ({
                      title: stageConfig[s].label,
                      status: stageOrder.indexOf(s) < currentIdx ? 'finish' : stageOrder.indexOf(s) === currentIdx ? 'process' : 'wait',
                      icon: getStageIcon(s),
                    }))}
                  />
                </Card>

                {/* 三项任务状态 */}
                <Card size="small" title="任务进度" style={{ marginBottom: 16 }}>
                  <Steps
                    current={taskOrder.filter(t => isTaskDone(currentOpp, t)).length}
                    size="small"
                    items={taskOrder.map((task) => ({
                      title: taskConfig[task].label,
                      status: isTaskDone(currentOpp, task) ? 'finish' : 'wait',
                      icon: isTaskDone(currentOpp, task) ? <CheckCircleOutlined /> : getStageIcon(task),
                      description: isTaskDone(currentOpp, task) ? '已完成' : '待执行',
                    }))}
                  />
                </Card>

                {/* 基本信息 */}
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="商机名称" span={2}><strong>{currentOpp.title}</strong></Descriptions.Item>
                  <Descriptions.Item label="关联客户">{currentOpp.customer?.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="类型">{typeLabels[currentOpp.type] || currentOpp.type || '-'}</Descriptions.Item>
                  <Descriptions.Item label="金额">{currentOpp.amount ? `¥${Number(currentOpp.amount).toLocaleString()}` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="概率">{currentOpp.probability || 0}%</Descriptions.Item>
                  <Descriptions.Item label="预计成交">{currentOpp.expectedCloseDate ? new Date(currentOpp.expectedCloseDate).toLocaleDateString() : '-'}</Descriptions.Item>
                  <Descriptions.Item label="对方单位">{currentOpp.counterparty || '-'}</Descriptions.Item>
                </Descriptions>
              </Tabs.TabPane>

              {/* 项目发布 */}
              <Tabs.TabPane tab={<span>{isTaskDone(currentOpp, 'project_publish') ? <CheckCircleOutlined style={{color:'#52c41a'}} /> : <FileTextOutlined />} 项目发布 {isTaskDone(currentOpp, 'project_publish') && <Tag color="green" style={{marginLeft:4}}>已完成</Tag>}</span>} key="publish">
                {isTaskDone(currentOpp, 'project_publish') ? (
                  <div>
                    {achievements.project_publish ? (
                      <div>
                        <div style={{ marginBottom: 8 }}>{achievements.project_publish.content}</div>
                        {achievements.project_publish.time && (
                          <div style={{ fontSize: 12, color: '#999' }}>完成时间：{new Date(achievements.project_publish.time).toLocaleString()}</div>
                        )}
                        {achievements.project_publish.photos && (
                          <div style={{ fontSize: 13, color: '#1890ff', marginTop: 8 }}> 附件 {achievements.project_publish.photos.length} 个</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 30 }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>项目发布已完成</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Empty description="任务待执行" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                    <div style={{ color: '#999' }}>等待管理后台启动"项目发布"任务</div>
                  </Empty>
                )}
              </Tabs.TabPane>

              {/* 项目对接 */}
              <Tabs.TabPane tab={<span>{isTaskDone(currentOpp, 'project_docking') ? <CheckCircleOutlined style={{color:'#52c41a'}} /> : <SwapOutlined />} 项目对接 {isTaskDone(currentOpp, 'project_docking') && <Tag color="green" style={{marginLeft:4}}>已完成</Tag>}</span>} key="docking">
                {isTaskDone(currentOpp, 'project_docking') ? (
                  <div>
                    {achievements.project_docking ? (
                      <div>
                        <div style={{ marginBottom: 8 }}>{achievements.project_docking.content}</div>
                        {achievements.project_docking.time && (
                          <div style={{ fontSize: 12, color: '#999' }}>完成时间：{new Date(achievements.project_docking.time).toLocaleString()}</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 30 }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>项目对接已完成</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Empty description="任务待执行" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                    <div style={{ color: '#999' }}>等待管理后台启动"项目对接"任务</div>
                  </Empty>
                )}
              </Tabs.TabPane>

              {/* 项目落地 */}
              <Tabs.TabPane tab={<span>{isTaskDone(currentOpp, 'project_landing') ? <CheckCircleOutlined style={{color:'#52c41a'}} /> : <CheckCircleOutlined />} 项目落地 {isTaskDone(currentOpp, 'project_landing') && <Tag color="green" style={{marginLeft:4}}>已完成</Tag>}</span>} key="landing">
                {isTaskDone(currentOpp, 'project_landing') ? (
                  <div>
                    {achievements.project_landing ? (
                      <div>
                        <div style={{ marginBottom: 8 }}>{achievements.project_landing.content}</div>
                        {achievements.project_landing.time && (
                          <div style={{ fontSize: 12, color: '#999' }}>完成时间：{new Date(achievements.project_landing.time).toLocaleString()}</div>
                        )}
                        {achievements.project_landing.photos && (
                          <div style={{ fontSize: 13, color: '#1890ff', marginTop: 8 }}>📷 成果照片 {achievements.project_landing.photos.length} 张</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 30 }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>项目已落地</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Empty description="任务待执行" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                    <div style={{ color: '#999' }}>等待管理后台启动"项目落地"任务</div>
                  </Empty>
                )}
              </Tabs.TabPane>
            </Tabs>
          );
        })()}
      </Drawer>
    </div>
  );
}
