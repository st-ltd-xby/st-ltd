import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tabs,
  message, 
  Space, 
  Popconfirm,
  Typography,
  Upload,
  InputNumber
} from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface Product {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  images?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category?: string;
  tags?: string;
  externalUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNo: string;
  customerId?: string;
  contactName?: string;
  contactPhone?: string;
  totalAmount: number;
  payAmount: number;
  discount?: number;
  status: string;
  payMethod?: string;
  paidAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

const MallManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDataByTab();
  }, [activeTab]);

  const fetchDataByTab = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      switch(activeTab) {
        case 'products':
          const productResponse = await axios.get('http://localhost:4001/api/v1/admin/products', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (productResponse.data.code === 200) {
            setProducts(productResponse.data.data.list);
          }
          break;
        case 'orders':
          const orderResponse = await axios.get('http://localhost:4001/api/v1/admin/orders', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (orderResponse.data.code === 200) {
            setOrders(orderResponse.data.data.list);
          }
          break;
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      let response;

      switch(activeTab) {
        case 'products':
          response = await axios.delete(`http://localhost:4001/api/v1/admin/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          break;
        case 'orders':
          response = await axios.delete(`http://localhost:4001/api/v1/admin/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          break;
      }

      if (response.data.code === 200) {
        message.success('删除成功');
        fetchDataByTab();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);
      message.error('删除失败');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      const token = localStorage.getItem('adminToken');
      let response;

      if (editingItem) {
        // 更新
        switch(activeTab) {
          case 'products':
            response = await axios.put(
              `http://localhost:4001/api/v1/admin/products/${editingItem.id}`,
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          case 'orders':
            response = await axios.put(
              `http://localhost:4001/api/v1/admin/orders/${editingItem.id}`,
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
        }
      } else {
        // 创建
        switch(activeTab) {
          case 'products':
            response = await axios.post(
              'http://localhost:4001/api/v1/admin/products',
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          case 'orders':
            response = await axios.post(
              'http://localhost:4001/api/v1/admin/orders',
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
        }
      }

      if (response.data.code === 200) {
        message.success(editingItem ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchDataByTab();
      } else {
        message.error(response.data.message || (editingItem ? '更新失败' : '创建失败'));
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      message.error('保存失败');
    }
  };

  const productColumns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '原价',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      render: (originalPrice: number) => originalPrice ? `¥${originalPrice.toFixed(2)}` : '-'
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          draft: '草稿',
          active: '上架',
          inactive: '下架',
          offline: '仓库'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '外部链接',
      dataIndex: 'externalUrl',
      key: 'externalUrl',
      render: (url: string) => url ? <a href={url} target="_blank" rel="noopener noreferrer">查看</a> : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditItem(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个商品吗？"
            onConfirm={() => handleDeleteItem(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户',
      dataIndex: 'contactName',
      key: 'contactName',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '实付金额',
      dataIndex: 'payAmount',
      key: 'payAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          pending: '待支付',
          paid: '已支付',
          shipped: '已发货',
          completed: '已完成',
          cancelled: '已取消',
          refunded: '已退款'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '支付方式',
      dataIndex: 'payMethod',
      key: 'payMethod',
      render: (method: string) => {
        const methodMap: Record<string, string> = {
          wechat: '微信支付',
          alipay: '支付宝',
          transfer: '银行转账'
        };
        return methodMap[method] || method || '-';
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditItem(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个订单吗？"
            onConfirm={() => handleDeleteItem(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getModalTitle = () => {
    switch(activeTab) {
      case 'products': return editingItem ? '编辑商品' : '添加商品';
      case 'orders': return editingItem ? '编辑订单' : '添加订单';
      default: return '编辑';
    }
  };

  const getFormItems = () => {
    switch(activeTab) {
      case 'products':
        return (
          <>
            <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="商品描述">
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="coverImage" label="封面图">
              <Input />
            </Form.Item>
            <Form.Item name="images" label="商品图片">
              <Input.TextArea placeholder="多个图片URL，用逗号分隔" />
            </Form.Item>
            <Form.Item name="price" label="价格" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="originalPrice" label="原价">
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="stock" label="库存" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Input />
            </Form.Item>
            <Form.Item name="tags" label="标签">
              <Input placeholder="多个标签用逗号分隔" />
            </Form.Item>
            <Form.Item name="externalUrl" label="外部链接">
              <Input placeholder="商品外部购买链接" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="active">上架</Select.Option>
                <Select.Option value="inactive">下架</Select.Option>
                <Select.Option value="offline">仓库</Select.Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'orders':
        return (
          <>
            <Form.Item name="orderNo" label="订单号" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="customerId" label="客户ID">
              <Input />
            </Form.Item>
            <Form.Item name="contactName" label="联系人">
              <Input />
            </Form.Item>
            <Form.Item name="contactPhone" label="联系电话">
              <Input />
            </Form.Item>
            <Form.Item name="totalAmount" label="总金额" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="payAmount" label="实付金额" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="discount" label="折扣">
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="pending">待支付</Select.Option>
                <Select.Option value="paid">已支付</Select.Option>
                <Select.Option value="shipped">已发货</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
                <Select.Option value="cancelled">已取消</Select.Option>
                <Select.Option value="refunded">已退款</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="payMethod" label="支付方式">
              <Select>
                <Select.Option value="wechat">微信支付</Select.Option>
                <Select.Option value="alipay">支付宝</Select.Option>
                <Select.Option value="transfer">银行转账</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="paidAt" label="支付时间">
              <Input type="datetime-local" />
            </Form.Item>
            <Form.Item name="note" label="备注">
              <TextArea rows={4} />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Card title={<Title level={4}>商城管理</Title>} style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="商品管理" key="products">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleAddItem}>
                <PlusOutlined /> 添加商品
              </Button>
            </div>
            <Table 
              dataSource={products} 
              columns={productColumns} 
              rowKey="id"
              loading={loading}
              pagination={{
                defaultPageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>
          <TabPane tab="订单管理" key="orders">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleAddItem}>
                <PlusOutlined /> 添加订单
              </Button>
            </div>
            <Table 
              dataSource={orders} 
              columns={orderColumns} 
              rowKey="id"
              loading={loading}
              pagination={{
                defaultPageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>
          <TabPane tab="电子商城网址管理" key="urls">
            <Card title="电子商城网址配置">
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Typography.Text type="secondary">电子商城网址管理功能将在后续版本中实现</Typography.Text>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={getModalTitle()}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          name={`${activeTab}_form`}
        >
          {getFormItems()}
        </Form>
      </Modal>
    </div>
  );
};

export default MallManagementPage;