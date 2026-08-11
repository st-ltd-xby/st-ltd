import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Typography, message, Modal, Form, Input, InputNumber, Select, Drawer, Descriptions, Divider } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { scrmApi } from '../../services/api';
const { Title } = Typography;

const stageColors: Record<string, string> = {
  pending: 'default',
  following: 'blue',
  proposal: 'cyan',
  negotiation: 'gold',
  won: 'green',
  lost: 'red',
};

const stageOrder = ['pending', 'following', 'proposal', 'negotiation', 'won', 'lost'];

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

  const stageLabels: Record<string, string> = {
    pending: t('opportunities.pending'),
    following: t('opportunities.following'),
    proposal: t('opportunities.proposal'),
    negotiation: t('opportunities.negotiation'),
    won: t('opportunities.won'),
    lost: t('opportunities.lost'),
  };

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
      if (res.code === 0) {
        setOpps(res.data || []);
      } else {
        message.error('加载失败');
      }
    } catch {
      message.error(t('opportunities.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res: any = await scrmApi.getCustomers({ page: 1, pageSize: 200 });
      if (res.code === 0) {
        setCustomers(res.data?.list || res.data || []);
      }
    } catch { /* ignore */ }
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
      message.success(t('opportunities.updatedTo', { stage: stageLabels[newStage] }));
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
      title: t('opportunities.stage'),
      dataIndex: 'stage',
      key: 'stage',
      width: 120,
      render: (v: string, record: any) => {
        const idx = stageOrder.indexOf(v);
        const nextStage = idx < stageOrder.length - 1 ? stageOrder[idx + 1] : null;
        return (
          <Space size={4}>
            <Tag color={stageColors[v] || 'default'} style={{ cursor: 'default' }}>{stageLabels[v] || v}</Tag>
            {nextStage && (
              <Button
                type="link"
                size="small"
                style={{ padding: 0, fontSize: 12, color: '#1677ff' }}
                onClick={() => handleQuickStage(record, nextStage)}
              >
                → {stageLabels[nextStage]}
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
      title: t('opportunities.expectedCloseDate'),
      dataIndex: 'expectedCloseDate',
      key: 'expectedCloseDate',
      width: 110,
      render: (d: string) => d ? new Date(d).toLocaleDateString() : '-',
    },
    {
      title: t('common.action'),
      key: 'action',
      width: 120,
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
            <Form.Item name="stage" label={t('opportunities.stage')} initialValue="pending" style={{ flex: 1 }}>
              <Select>
                <Select.Option value="pending">{t('opportunities.pending')}</Select.Option>
                <Select.Option value="following">{t('opportunities.following')}</Select.Option>
                <Select.Option value="proposal">{t('opportunities.proposal')}</Select.Option>
                <Select.Option value="negotiation">{t('opportunities.negotiation')}</Select.Option>
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
            <Form.Item name="stage" label={t('opportunities.stage')} style={{ flex: 1 }}>
              <Select>
                <Select.Option value="pending">{t('opportunities.pending')}</Select.Option>
                <Select.Option value="following">{t('opportunities.following')}</Select.Option>
                <Select.Option value="proposal">{t('opportunities.proposal')}</Select.Option>
                <Select.Option value="negotiation">{t('opportunities.negotiation')}</Select.Option>
                <Select.Option value="won">{t('opportunities.won')}</Select.Option>
                <Select.Option value="lost">{t('opportunities.lost')}</Select.Option>
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
        title={t('opportunities.opportunityDetail')}
        open={viewDrawer}
        onClose={() => setViewDrawer(false)}
        width={480}
      >
        {currentOpp && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('opportunities.opportunityName')}>{currentOpp.title || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('opportunities.customer')}>{currentOpp.customer?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('opportunities.type')}>{typeLabels[currentOpp.type] || currentOpp.type || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('opportunities.stage')}>
                <Tag color={stageColors[currentOpp.stage]}>{stageLabels[currentOpp.stage] || currentOpp.stage}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('opportunities.estimatedAmount')}>{currentOpp.amount ? `¥${Number(currentOpp.amount).toLocaleString()}` : '-'}</Descriptions.Item>
              <Descriptions.Item label={t('opportunities.winRate')}>{currentOpp.probability || 0}%</Descriptions.Item>
              <Descriptions.Item label={t('opportunities.expectedCloseDate')}>{currentOpp.expectedCloseDate ? new Date(currentOpp.expectedCloseDate).toLocaleDateString() : '-'}</Descriptions.Item>
              <Descriptions.Item label={t('opportunities.counterparty')}>{currentOpp.counterparty || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('customers.industry')}>{currentOpp.industry || '-'}</Descriptions.Item>
            </Descriptions>
            {currentOpp.description && (
              <>
                <Divider style={{ margin: '16px 0 8px' }}>{t('common.description')}</Divider>
                <div style={{ color: '#555', lineHeight: 1.8, fontSize: 14 }}>{currentOpp.description}</div>
              </>
            )}
            {currentOpp.note && (
              <>
                <Divider style={{ margin: '16px 0 8px' }}>{t('opportunities.note')}</Divider>
                <div style={{ color: '#555', lineHeight: 1.8, fontSize: 14 }}>{currentOpp.note}</div>
              </>
            )}
            <Divider style={{ margin: '16px 0 8px' }}>{t('opportunities.timeInfo')}</Divider>
            <div style={{ fontSize: 13, color: '#999', lineHeight: 2 }}>
              <div>{t('common.createdAt')}：{currentOpp.createdAt ? new Date(currentOpp.createdAt).toLocaleString() : '-'}</div>
              <div>{t('common.updatedAt')}：{currentOpp.updatedAt ? new Date(currentOpp.updatedAt).toLocaleString() : '-'}</div>
              {currentOpp.wonAt && <div style={{ color: '#52c41a' }}>{t('opportunities.wonTime')}：{new Date(currentOpp.wonAt).toLocaleString()}</div>}
              {currentOpp.lostAt && <div style={{ color: '#ff4d4f' }}>{t('opportunities.lostTime')}：{new Date(currentOpp.lostAt).toLocaleString()}</div>}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
