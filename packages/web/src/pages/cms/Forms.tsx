import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, message, Typography, Statistic, Row, Col, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { cmsApi } from '../../services/api';
const { Title } = Typography;
export default function Forms() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const res: any = await cmsApi.getForms('default'); if (res.code === 0) setForms(res.data || []); } catch {} finally { setLoading(false); } };
  const handleCreate = async (values: any) => { try { const res: any = await cmsApi.createForm('default', values); if (res.code === 0) { message.success('表单创建成功'); setModalOpen(false); load(); } } catch {} };
  return (<div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><Title level={4} style={{ margin: 0 }}>表单管理</Title><Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建表单</Button></div>
    <Row gutter={16} style={{ marginBottom: 16 }}><Col span={8}><Card><Statistic title="总表单数" value={forms.length} /></Card></Col><Col span={8}><Card><Statistic title="总提交数" value={0} /></Card></Col><Col span={8}><Card><Statistic title="转化率" value={0} suffix="%" /></Card></Col></Row>
    <Table dataSource={forms} rowKey="id" loading={loading} columns={[
      { title: '表单名称', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
      { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '启用中' : '已停用'}</Tag> },
      { title: '创建时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
      { title: '操作', key: 'action', render: (_: any, r: any) => <Space><Button size="small">编辑</Button><Button size="small">数据</Button></Space> },
    ]} />
    <Modal title="新建表单" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
      <Form form={form} onFinish={handleCreate} layout="vertical">
        <Form.Item name="name" label="表单名称" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>
  </div>);
}
