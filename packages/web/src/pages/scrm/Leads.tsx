import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, Tabs, message, Typography, Drawer, Descriptions, Timeline, Divider } from 'antd';
import { PlusOutlined, EyeOutlined, SwapOutlined, PhoneOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { scrmApi } from '../../services/api';
const { Title } = Typography;

const sourceColors: Record<string, string> = {
  baidu: 'blue',
  douyin: 'red',
  wechat: 'green',
  card: 'purple',
  xiaohongshu: 'cyan',
  manual: 'default',
};

export default function Leads() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  
  // 详情抽屉状态
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<any>(null);

  const sourceLabels: Record<string, string> = {
    baidu: t('leads.sourceBaidu'),
    douyin: t('leads.sourceDouyin'),
    wechat: t('leads.sourceWechat'),
    xiaohongshu: t('leads.sourceXiaohongshu'),
    card: t('leads.sourceCard'),
    manual: t('leads.sourceManual'),
    form: t('leads.sourceForm'),
    promotion: t('leads.sourcePromotion'),
    website: t('leads.sourceWebsite'),
    auto: t('leads.sourceAuto'),
    other: t('leads.sourceOther'),
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    new: { color: 'orange', text: t('leads.statusNew') },
    following: { color: 'blue', text: t('leads.statusFollowing') },
    qualified: { color: 'cyan', text: t('leads.statusQualified') },
    opportunity: { color: 'purple', text: t('leads.statusOpportunity') },
    won: { color: 'green', text: t('leads.statusWon') },
    lost: { color: 'red', text: t('leads.statusLost') },
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await scrmApi.getLeads();
      if (res.code === 0) setLeads(res.data || []);
      else message.error(res.message || t('common.failed'));
    } catch (e: any) {
      message.error(e.message || t('common.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const res: any = await scrmApi.createLead(values);
      if (res.code === 0) {
        message.success(t('leads.createLeadSuccess'));
        setModalOpen(false);
        form.resetFields();
        load();
      } else {
        message.error(res.message || t('leads.createLeadFailed'));
      }
    } catch (e: any) {
      message.error(e.message || t('leads.networkCheck'));
    }
  };

  // 查看线索详情
  const handleViewDetail = async (lead: any) => {
    setCurrentLead(lead);
    setDetailDrawerOpen(true);
    // TODO: 加载跟进记录
    // const res: any = await scrmApi.getLeadFollowUps(lead.id);
  };

  // 转化为客户
  const handleConvertToCustomer = async (lead: any) => {
    Modal.confirm({
      title: '转化为客户',
      content: `确定将线索 "${lead.name}" 转化为客户吗？`,
      okText: '确认转化',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: 调用后端 API 转化为客户
          // const res: any = await scrmApi.convertLeadToCustomer(lead.id);
          // if (res.code === 0) {
          //   message.success('转化成功');
          //   load();
          //   setDetailDrawerOpen(false);
          //   // 跳转到客户详情页
          //   window.location.href = `/scrm/customers/${res.data.id}`;
          // }
          
          message.success('转化成功（演示模式）');
          setDetailDrawerOpen(false);
        } catch (error) {
          message.error('转化失败');
        }
      },
    });
  };

  const columns = [
    { title: t('leads.leadName'), dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
    { title: t('leads.company'), dataIndex: 'company', render: (v: string) => v || '-' },
    {
      title: t('leads.source'),
      dataIndex: 'source',
      render: (v: string) => {
        const label = sourceLabels[v] || v;
        return <Tag color={sourceColors[v] || 'default'}>{label}</Tag>;
      },
    },
    {
      title: t('leads.status'),
      dataIndex: 'status',
      render: (v: string) => {
        const s = statusMap[v] || { color: 'default', text: v };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: t('leads.assignee'), dataIndex: 'assignee', render: (v: any) => v?.name || <span style={{ color: '#999' }}>{t('leads.unassigned')}</span> },
    { title: t('leads.createdAt'), dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: t('common.action'), key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          {t('leads.details')}
        </Button>
      </Space>
    ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('leads.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('leads.manualEntry')}
        </Button>
      </div>
      <Tabs
        items={[
          { key: 'all', label: t('leads.allLeads') },
          { key: 'new', label: t('leads.newLeads') },
          { key: 'following', label: t('leads.statusFollowing') },
          { key: 'won', label: t('leads.convertedLeads') },
        ]}
        style={{ marginBottom: 16 }}
      />
      <Table dataSource={leads} columns={columns} rowKey="id" loading={loading} />
      <Modal title={t('leads.newLead')} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label={t('leads.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label={t('leads.phone')}><Input /></Form.Item>
          <Form.Item name="email" label={t('leads.email')}><Input /></Form.Item>
          <Form.Item name="company" label={t('leads.company')}><Input /></Form.Item>
          <Form.Item name="source" label={t('leads.source')}>
            <Select placeholder={t('leads.selectSource')}>
              <Select.Option value="baidu">{t('leads.sourceBaidu')}</Select.Option>
              <Select.Option value="douyin">{t('leads.sourceDouyin')}</Select.Option>
              <Select.Option value="wechat">{t('leads.sourceWechat')}</Select.Option>
              <Select.Option value="xiaohongshu">{t('leads.sourceXiaohongshu')}</Select.Option>
              <Select.Option value="card">{t('leads.sourceCard')}</Select.Option>
              <Select.Option value="manual">{t('leads.sourceManual')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 线索详情抽屉 */}
      <Drawer
        title="线索详情"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={600}
        extra={
          currentLead?.status === 'new' && (
            <Button 
              type="primary" 
              icon={<SwapOutlined />}
              onClick={() => handleConvertToCustomer(currentLead)}
            >
              转化为客户
            </Button>
          )
        }
      >
        {currentLead && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="线索名称" span={2}>
                <strong>{currentLead.name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="公司">{currentLead.company || '-'}</Descriptions.Item>
              <Descriptions.Item label="来源">
                <Tag color={sourceColors[currentLead.source] || 'default'}>
                  {sourceLabels[currentLead.source] || currentLead.source}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentLead.status]?.color || 'default'}>
                  {statusMap[currentLead.status]?.text || currentLead.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="负责人" span={2}>
                {currentLead.assignee?.name ? (
                  <Tag color="blue">
                    <UserOutlined /> {currentLead.assignee.name}
                  </Tag>
                ) : (
                  <span style={{ color: '#999' }}>未分配</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="电话" span={2}>
                {currentLead.phone ? (
                  <Space>
                    <PhoneOutlined />
                    {currentLead.phone}
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱" span={2}>
                {currentLead.email ? (
                  <Space>
                    <MailOutlined />
                    {currentLead.email}
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {new Date(currentLead.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider>分配的任务</Divider>
            {currentLead.assignedTask ? (
              <div style={{ marginBottom: 16 }}>
                <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                  {currentLead.assignedTask === 'phone_contact' && '📞 电话联络'}
                  {currentLead.assignedTask === 'customer_visit' && '📸 客户拜访（需拍照打卡）'}
                  {currentLead.assignedTask === 'follow_up' && '🔄 持续跟进'}
                  {currentLead.assignedTask === 'qualification' && '✅ 资质审核'}
                </Tag>
              </div>
            ) : (
              <div style={{ color: '#999', marginBottom: 16 }}>暂无分配任务</div>
            )}

            <Divider>跟进记录</Divider>
            <Timeline>
              <Timeline.Item color="blue">
                <div style={{ fontSize: 13, color: '#999' }}>
                  {new Date(currentLead.createdAt).toLocaleString()}
                </div>
                <div>线索创建</div>
              </Timeline.Item>
              {/* TODO: 加载真实跟进记录 */}
            </Timeline>
          </>
        )}
      </Drawer>
    </div>
  );
}
