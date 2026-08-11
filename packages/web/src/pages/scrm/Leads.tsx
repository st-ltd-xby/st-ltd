import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, Tabs, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
    { title: t('common.action'), key: 'action', render: (_: any, __: any) => <Space><Button size="small">{t('leads.details')}</Button></Space> },
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
    </div>
  );
}
