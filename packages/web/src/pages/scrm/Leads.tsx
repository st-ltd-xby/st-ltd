import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, Tabs, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { scrmApi } from '../../services/api';
const { Title } = Typography;
export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); try { const res: any = await scrmApi.getLeads(); if (res.code === 0) setLeads(res.data || []); else message.error(res.message || '加载失败'); } catch (e: any) { message.error(e.message || '加载失败'); } finally { setLoading(false); } };
  const handleCreate = async (values: any) => { try { const res: any = await scrmApi.createLead(values); if (res.code === 0) { message.success('线索创建成功'); setModalOpen(false); form.resetFields(); load(); } else { message.error(res.message || '创建失败'); } } catch (e: any) { message.error(e.message || '创建失败，请检查网络'); } };
  const sourceColors: Record<string, string> = { baidu: 'blue', douyin: 'red', wechat: 'green', card: 'purple', xiaohongshu: 'cyan', manual: 'default' };
  const sourceLabels: Record<string, string> = { baidu: '百度', douyin: '抖音', wechat: '微信', xiaohongshu: '小红书', card: '电子名片', manual: '手动录入', form: '表单转化', promotion: '推广链接', website: '官网', auto: '自动采集', other: '其他' };
  const statusMap: Record<string, { color: string; text: string }> = { new: { color: 'orange', text: '新线索' }, following: { color: 'blue', text: '跟进中' }, qualified: { color: 'cyan', text: '已确认' }, opportunity: { color: 'purple', text: '商机' }, won: { color: 'green', text: '已成交' }, lost: { color: 'red', text: '已流失' } };
  const columns = [
    { title: '线索名称', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
    { title: '公司', dataIndex: 'company', render: (v: string) => v || '-' },
    { title: '来源', dataIndex: 'source', render: (v: string) => <Tag color={sourceColors[v] || 'default'}>{sourceLabels[v] || v}</Tag> },
    { title: '状态', dataIndex: 'status', render: (v: string) => { const s = statusMap[v] || { color: 'default', text: v }; return <Tag color={s.color}>{s.text}</Tag>; } },
    { title: '负责人', dataIndex: 'assignee', render: (v: any) => v?.name || <span style={{ color: '#999' }}>未分配</span> },
    { title: '创建时间', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: '操作', key: 'action', render: (_: any, r: any) => <Space><Button size="small">详情</Button></Space> },
  ];
  return (<div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><Title level={4} style={{ margin: 0 }}>线索管理</Title><Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>手动录入</Button></div>
    <Tabs items={[{ key: 'all', label: '全部线索' }, { key: 'new', label: '新线索' }, { key: 'following', label: '跟进中' }, { key: 'won', label: '已转化' }]} style={{ marginBottom: 16 }} />
    <Table dataSource={leads} columns={columns} rowKey="id" loading={loading} />
    <Modal title="新建线索" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
      <Form form={form} onFinish={handleCreate} layout="vertical">
        <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="phone" label="电话"><Input /></Form.Item>
        <Form.Item name="email" label="邮箱"><Input /></Form.Item>
        <Form.Item name="company" label="公司"><Input /></Form.Item>
        <Form.Item name="source" label="来源"><Select placeholder="选择来源"><Select.Option value="baidu">百度</Select.Option><Select.Option value="douyin">抖音</Select.Option><Select.Option value="wechat">微信</Select.Option><Select.Option value="xiaohongshu">小红书</Select.Option><Select.Option value="card">电子名片</Select.Option><Select.Option value="manual">手动录入</Select.Option></Select></Form.Item>
      </Form>
    </Modal>
  </div>);
}
