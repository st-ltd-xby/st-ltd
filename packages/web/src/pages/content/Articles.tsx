import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, Tabs, message, Typography, Card, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { contentApi } from '../../services/api';
const { Title } = Typography;
const { Meta } = Card;
export default function Articles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const res: any = await contentApi.getArticles(); if (res.code === 0) setArticles(res.data || []); } catch {} finally { setLoading(false); } };
  const handleCreate = async (values: any) => { try { const res: any = await contentApi.createArticle(values); if (res.code === 0) { message.success('内容创建成功'); setModalOpen(false); load(); } } catch {} };
  return (<div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><Title level={4} style={{ margin: 0 }}>内容营销</Title><Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>发布内容</Button></div>
    <Tabs items={[{ key: 'all', label: '全部' }, { key: 'article', label: '图文' }, { key: 'video', label: '视频' }, { key: 'whitepaper', label: '白皮书' }]} style={{ marginBottom: 16 }} />
    <Row gutter={[16, 16]}>
      {articles.map(a => (
        <Col span={6} key={a.id}>
          <Card hoverable cover={<div style={{ height: 130, background: 'linear-gradient(135deg, #1677ff, #36cfc9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32 }}>{a.type === 'video' ? '🎬' : '📄'}</div>}>
            <Meta title={a.title} description={`阅读 ${a.viewCount || 0} · 线索 ${a.leadCount || 0}`} />
            <div style={{ marginTop: 8 }}><Tag color={a.status === 'published' ? 'green' : 'default'}>{a.status === 'published' ? '已发布' : '草稿'}</Tag></div>
          </Card>
        </Col>
      ))}
      {!articles.length && <Col span={24}><Card><div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无内容，点击"发布内容"开始创建</div></Card></Col>}
    </Row>
    <Modal title="发布内容" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose width={640}>
      <Form form={form} onFinish={handleCreate} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="type" label="类型"><Select defaultValue="article"><Select.Option value="article">图文</Select.Option><Select.Option value="video">视频</Select.Option><Select.Option value="whitepaper">白皮书</Select.Option></Select></Form.Item>
        <Form.Item name="summary" label="摘要"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="content" label="正文内容"><Input.TextArea rows={6} /></Form.Item>
      </Form>
    </Modal>
  </div>);
}
