import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { cmsApi } from '../../services/api';

const { Title } = Typography;

export default function Sites() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await cmsApi.getSites();
      if (res.code === 0) setSites(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async (values: any) => {
    try {
      const res: any = await cmsApi.createSite(values);
      if (res.code === 0) { message.success('站点创建成功'); setModalOpen(false); form.resetFields(); load(); }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await cmsApi.deleteSite(id); message.success('删除成功'); load(); } catch {}
  };

  const typeColors: Record<string, string> = { pc: 'blue', h5: 'green', miniapp: 'purple', mall: 'orange' };
  const typeLabels: Record<string, string> = { pc: 'PC官网', h5: 'H5', miniapp: '小程序', mall: '商城' };

  const columns = [
    { title: '站点名称', dataIndex: 'name', key: 'name', render: (v: string) => <strong>{v}</strong> },
    { title: '域名', dataIndex: 'domain', key: 'domain', render: (v: string) => v || '-' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={typeColors[v]}>{typeLabels[v] || v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'published' ? 'green' : v === 'draft' ? 'default' : 'red'}>{v === 'published' ? '已上线' : v === 'draft' ? '草稿' : '已下线'}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space><Button size="small">编辑</Button><Button size="small" danger onClick={() => handleDelete(record.id)}>删除</Button></Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>站点管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建站点</Button>
      </div>
      <Table dataSource={sites} columns={columns} rowKey="id" loading={loading} />
      <Modal title="新建站点" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="站点名称" rules={[{ required: true }]}><Input placeholder="如：企业官网" /></Form.Item>
          <Form.Item name="type" label="站点类型" rules={[{ required: true }]}>
            <Select placeholder="选择类型"><Select.Option value="pc">PC官网</Select.Option><Select.Option value="h5">H5</Select.Option><Select.Option value="miniapp">小程序</Select.Option><Select.Option value="mall">商城</Select.Option></Select>
          </Form.Item>
          <Form.Item name="domain" label="域名"><Input placeholder="如：www.example.com" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
