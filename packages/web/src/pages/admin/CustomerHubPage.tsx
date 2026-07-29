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
  Tag
} from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface Customer {
  id: string;
  name: string;
  industry?: string;
  level: string;
  stage: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  website?: string;
  tags?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  source: string;
  assigneeId?: string;
  status: string;
  priority: string;
  tags?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface Opportunity {
  id: string;
  customerId: string;
  title: string;
  amount: number;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

const CustomerHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
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
        case 'customers':
          const customerResponse = await axios.get('http://localhost:4001/api/v1/admin/customers', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (customerResponse.data.code === 200) {
            setCustomers(customerResponse.data.data.list);
          }
          break;
        case 'leads':
          const leadResponse = await axios.get('http://localhost:4001/api/v1/admin/leads', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (leadResponse.data.code === 200) {
            setLeads(leadResponse.data.data.list);
          }
          break;
        case 'opportunities':
          const opportunityResponse = await axios.get('http://localhost:4001/api/v1/admin/opportunities', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (opportunityResponse.data.code === 200) {
            setOpportunities(opportunityResponse.data.data.list);
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
        case 'customers':
          response = await axios.delete(`http://localhost:4001/api/v1/admin/customers/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          break;
        case 'leads':
          response = await axios.delete(`http://localhost:4001/api/v1/admin/leads/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          break;
        case 'opportunities':
          response = await axios.delete(`http://localhost:4001/api/v1/admin/opportunities/${id}`, {
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
          case 'customers':
            response = await axios.put(
              `http://localhost:4001/api/v1/admin/customers/${editingItem.id}`,
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          case 'leads':
            response = await axios.put(
              `http://localhost:4001/api/v1/admin/leads/${editingItem.id}`,
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          case 'opportunities':
            response = await axios.put(
              `http://localhost:4001/api/v1/admin/opportunities/${editingItem.id}`,
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
        }
      } else {
        // 创建
        switch(activeTab) {
          case 'customers':
            response = await axios.post(
              'http://localhost:4001/api/v1/admin/customers',
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          case 'leads':
            response = await axios.post(
              'http://localhost:4001/api/v1/admin/leads',
              values,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          case 'opportunities':
            response = await axios.post(
              'http://localhost:4001/api/v1/admin/opportunities',
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

  const customerColumns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
    },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={
          level === 'A' ? 'red' : 
          level === 'B' ? 'orange' : 
          level === 'C' ? 'gold' : 'default'
        }>
          {level}
        </Tag>
      )
    },
    {
      title: '客户阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => {
        const stageMap: Record<string, string> = {
          prospect: '潜在客户',
          active: '活跃客户',
          churned: '流失客户'
        };
        return stageMap[stage] || stage;
      }
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Customer) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditItem(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个客户吗？"
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

  const leadColumns = [
    {
      title: '线索名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_, record: Lead) => `${record.phone || ''} ${record.email || ''}`
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => {
        const sourceMap: Record<string, string> = {
          baidu: '百度',
          douyin: '抖音',
          wechat: '微信',
          xiaohongshu: '小红书',
          card: '名片',
          form: '表单',
          referral: '推荐'
        };
        return sourceMap[source] || source;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          new: '新线索',
          following: '跟进中',
          qualified: '已合格',
          opportunity: '商机',
          won: '已成交',
          lost: '已丢失'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const priorityMap: Record<string, string> = {
          low: '低',
          medium: '中',
          high: '高'
        };
        return priorityMap[priority] || priority;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Lead) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditItem(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个线索吗？"
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

  const opportunityColumns = [
    {
      title: '商机名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '客户',
      dataIndex: 'customerId',
      key: 'customerId',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => {
        const stageMap: Record<string, string> = {
          demand: '需求确认',
          proposal: '方案制定',
          negotiation: '商务谈判',
          won: '已成交',
          lost: '已丢失'
        };
        return stageMap[stage] || stage;
      }
    },
    {
      title: '成功率',
      dataIndex: 'probability',
      key: 'probability',
      render: (prob: number) => `${prob}%`
    },
    {
      title: '预计成交日期',
      dataIndex: 'expectedCloseDate',
      key: 'expectedCloseDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString('zh-CN') : '未设置'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Opportunity) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditItem(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个商机吗？"
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
      case 'customers': return editingItem ? '编辑客户' : '添加客户';
      case 'leads': return editingItem ? '编辑线索' : '添加线索';
      case 'opportunities': return editingItem ? '编辑商机' : '添加商机';
      default: return '编辑';
    }
  };

  const getFormItems = () => {
    switch(activeTab) {
      case 'customers':
        return (
          <>
            <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="industry" label="行业">
              <Input />
            </Form.Item>
            <Form.Item name="level" label="客户等级" rules={[{ required: true }]}>
              <Select>
                <Option value="A">A级</Option>
                <Option value="B">B级</Option>
                <Option value="C">C级</Option>
              </Select>
            </Form.Item>
            <Form.Item name="stage" label="客户阶段" rules={[{ required: true }]}>
              <Select>
                <Option value="prospect">潜在客户</Option>
                <Option value="active">活跃客户</Option>
                <Option value="churned">流失客户</Option>
              </Select>
            </Form.Item>
            <Form.Item name="contactName" label="联系人姓名">
              <Input />
            </Form.Item>
            <Form.Item name="contactPhone" label="联系电话">
              <Input />
            </Form.Item>
            <Form.Item name="contactEmail" label="联系邮箱">
              <Input />
            </Form.Item>
            <Form.Item name="address" label="地址">
              <Input />
            </Form.Item>
            <Form.Item name="website" label="网站">
              <Input />
            </Form.Item>
            <Form.Item name="tags" label="标签">
              <Input />
            </Form.Item>
            <Form.Item name="note" label="备注">
              <Input.TextArea />
            </Form.Item>
          </>
        );
      case 'leads':
        return (
          <>
            <Form.Item name="name" label="线索名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="company" label="公司">
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="电话">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input />
            </Form.Item>
            <Form.Item name="position" label="职位">
              <Input />
            </Form.Item>
            <Form.Item name="source" label="来源" rules={[{ required: true }]}>
              <Select>
                <Option value="baidu">百度</Option>
                <Option value="douyin">抖音</Option>
                <Option value="wechat">微信</Option>
                <Option value="xiaohongshu">小红书</Option>
                <Option value="card">名片</Option>
                <Option value="form">表单</Option>
                <Option value="referral">推荐</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                <Option value="new">新线索</Option>
                <Option value="following">跟进中</Option>
                <Option value="qualified">已合格</Option>
                <Option value="opportunity">商机</Option>
                <Option value="won">已成交</Option>
                <Option value="lost">已丢失</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
              <Select>
                <Option value="low">低</Option>
                <Option value="medium">中</Option>
                <Option value="high">高</Option>
              </Select>
            </Form.Item>
            <Form.Item name="tags" label="标签">
              <Input />
            </Form.Item>
            <Form.Item name="note" label="备注">
              <Input.TextArea />
            </Form.Item>
          </>
        );
      case 'opportunities':
        return (
          <>
            <Form.Item name="title" label="商机名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="customerId" label="客户ID" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="stage" label="阶段" rules={[{ required: true }]}>
              <Select>
                <Option value="demand">需求确认</Option>
                <Option value="proposal">方案制定</Option>
                <Option value="negotiation">商务谈判</Option>
                <Option value="won">已成交</Option>
                <Option value="lost">已丢失</Option>
              </Select>
            </Form.Item>
            <Form.Item name="probability" label="成功率" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="expectedCloseDate" label="预计成交日期">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="note" label="备注">
              <Input.TextArea />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Card title={<Title level={4}>客户枢纽（简易CRM管理）</Title>} style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="客户管理" key="customers">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleAddItem}>添加客户</Button>
            </div>
            <Table 
              dataSource={customers} 
              columns={customerColumns} 
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
          <TabPane tab="线索管理" key="leads">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleAddItem}>添加线索</Button>
            </div>
            <Table 
              dataSource={leads} 
              columns={leadColumns} 
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
          <TabPane tab="商机管理" key="opportunities">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleAddItem}>添加商机</Button>
            </div>
            <Table 
              dataSource={opportunities} 
              columns={opportunityColumns} 
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
        </Tabs>
      </Card>

      <Modal
        title={getModalTitle()}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
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

export default CustomerHubPage;