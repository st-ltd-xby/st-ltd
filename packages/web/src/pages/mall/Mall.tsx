import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select,
  message, Tag, Row, Col, Statistic
} from 'antd';
import {
  ShopOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  GlobalOutlined, PhoneOutlined, MailOutlined
} from '@ant-design/icons';
import { mallApi } from '../../services/api';

const { Option } = Select;

const platformOptions = [
  { value: 'shopify', label: 'Shopify' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'magento', label: 'Magento' },
  { value: 'prestashop', label: 'PrestaShop' },
  { value: 'opencart', label: 'OpenCart' },
  { value: 'custom', label: '自建商城' },
  { value: 'other', label: '其他' },
];

export default function Mall() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadWebsites(); }, []);

  const loadWebsites = async () => {
    setLoading(true);
    try {
      const res: any = await mallApi.getExternalWebsites();
      if (res.code === 0) setWebsites(res.data || []);
    } catch {
      message.error('加载商城列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      let res: any;
      if (editingWebsite) {
        res = await mallApi.updateExternalWebsite(editingWebsite.id, values);
      } else {
        res = await mallApi.createExternalWebsite(values);
      }
      if (res.code === 0) {
        message.success(editingWebsite ? '修改成功' : '添加成功');
        setModalVisible(false);
        form.resetFields();
        setEditingWebsite(null);
        loadWebsites();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: any) => {
    setEditingWebsite(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await mallApi.deleteExternalWebsite(id);
      message.success('删除成功');
      loadWebsites();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '商城名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '商城网址',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <GlobalOutlined style={{ marginRight: 4 }} />{url}
        </a>
      ),
    },
    {
      title: '平台类型',
      dataIndex: 'platform',
      key: 'platform',
      render: (p: string) => {
        const opt = platformOptions.find(o => o.value === p);
        return <Tag color="blue">{opt?.label || p}</Tag>;
      },
    },
    {
      title: '联系人',
      key: 'contact',
      render: (_: any, r: any) => (
        <div>
          {r.contactName && <div><PhoneOutlined style={{ marginRight: 4 }} />{r.contactName}</div>}
          {r.contactPhone && <div style={{ fontSize: 12, color: '#999' }}>{r.contactPhone}</div>}
          {r.contactEmail && <div style={{ fontSize: 12, color: '#999' }}><MailOutlined style={{ marginRight: 4 }} />{r.contactEmail}</div>}
        </div>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (s: string) => {
        const map: Record<string, { label: string; color: string }> = {
          pending: { label: '待审核', color: 'orange' },
          approved: { label: '已通过', color: 'green' },
          rejected: { label: '已驳回', color: 'red' },
        };
        const info = map[s] || { label: s || '未知', color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="已接入商城" value={websites.length} prefix={<ShopOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="已通过" value={websites.filter(w => w.reviewStatus === 'approved').length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="待审核" value={websites.filter(w => w.reviewStatus === 'pending').length} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="企业自有商城管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingWebsite(null);
            form.resetFields();
            setModalVisible(true);
          }}>
            添加商城
          </Button>
        }
      >
        <Table
          dataSource={websites}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无商城，点击右上角"添加商城"开始接入' }}
        />
      </Card>

      <Modal
        title={editingWebsite ? '编辑商城' : '添加企业自有商城'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); setEditingWebsite(null); }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item name="name" label="商城名称" rules={[{ required: true, message: '请输入商城名称' }]}>
            <Input placeholder="例如：XX品牌官方商城" />
          </Form.Item>
          <Form.Item name="url" label="商城网址" rules={[{ required: true, message: '请输入商城网址' }]}>
            <Input placeholder="https://shop.example.com" />
          </Form.Item>
          <Form.Item name="platform" label="平台类型" rules={[{ required: true, message: '请选择平台类型' }]}>
            <Select placeholder="请选择商城使用的平台">
              {platformOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="contactName" label="联系人">
                <Input placeholder="联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contactPhone" label="联系电话">
                <Input placeholder="手机号码" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contactEmail" label="联系邮箱">
                <Input placeholder="邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="config" label="备注">
            <Input.TextArea rows={3} placeholder="其他说明信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}