import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, Tabs, message, Typography, Timeline, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { scrmApi } from '../../services/api';
const { Title } = Typography;
export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const res: any = await scrmApi.getCustomers(); if (res.code === 0) setCustomers(res.data || []); } catch {} finally { setLoading(false); } };
  const handleCreate = async (values: any) => { try { const res: any = await scrmApi.createCustomer(values); if (res.code === 0) { message.success('客户创建成功'); setModalOpen(false); load(); } } catch {} };
  const levelColors: Record<string, string> = { A: 'red', B: 'orange', C: 'blue' };
  return (<div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><Title level={4} style={{ margin: 0 }}>客户管理</Title><Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建客户</Button></div>
    <Tabs items={[{ key: 'all', label: '全部客户' }, { key: 'A', label: 'A类 (重点)' }, { key: 'B', label: 'B类 (一般)' }, { key: 'C', label: 'C类 (潜力)' }]} style={{ marginBottom: 16 }} />
    <Table dataSource={customers} rowKey="id" loading={loading} columns={[
      { title: '客户名称', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
      { title: '行业', dataIndex: 'industry', render: (v: string) => v || '-' },
      { title: '等级', dataIndex: 'level', render: (v: string) => <Tag color={levelColors[v]}>{v}类</Tag> },
      { title: '联系人', dataIndex: 'contactName', render: (v: string) => v || '-' },
      { title: '累计成交', dataIndex: 'totalDeal', render: (v: number) => v > 0 ? `¥${v}万` : '-' },
      { title: '操作', key: 'action', render: () => <Space><Button size="small">详情</Button></Space> },
    ]} />
    <Modal title="新建客户" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
      <Form form={form} onFinish={handleCreate} layout="vertical">
        <Form.Item name="name" label="客户名称" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="industry" label="行业"><Input /></Form.Item>
        <Form.Item name="level" label="等级"><Select placeholder="选择等级"><Select.Option value="A">A类</Select.Option><Select.Option value="B">B类</Select.Option><Select.Option value="C">C类</Select.Option></Select></Form.Item>
        <Form.Item name="contactName" label="联系人"><Input /></Form.Item>
        <Form.Item name="contactPhone" label="联系电话"><Input /></Form.Item>
      </Form>
    </Modal>
  </div>);
}
