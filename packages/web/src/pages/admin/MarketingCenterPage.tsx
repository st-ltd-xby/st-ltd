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
  Upload, 
  message,
  Space,
  Popconfirm,
  Typography,
  DatePicker,
  Tag
} from 'antd';
import { PlusOutlined, UploadOutlined, PictureOutlined, VideoCameraOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { TabPane } = Tabs;
const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Content {
  id: string;
  title: string;
  type: string;
  status: string;
  publishDate: string;
  views: number;
  likes: number;
  shares: number;
}

interface EmployeeCard {
  id: string;
  name: string;
  title: string;
  department: string;
  status: string;
  createdAt: string;
}

const MarketingCenterPage: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [employees, setEmployees] = useState<EmployeeCard[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeCard | null>(null);
  const [contentForm] = Form.useForm();
  const [employeeForm] = Form.useForm();

  useEffect(() => {
    // 模拟加载数据
    setContents([
      { id: '1', title: '春季新品发布', type: 'article', status: 'published', publishDate: '2026-03-15', views: 1250, likes: 89, shares: 42 },
      { id: '2', title: '产品使用教程视频', type: 'video', status: 'published', publishDate: '2026-03-20', views: 2100, likes: 156, shares: 87 },
      { id: '3', title: '行业趋势白皮书', type: 'whitepaper', status: 'draft', publishDate: '', views: 0, likes: 0, shares: 0 },
      { id: '4', title: '夏季促销活动海报', type: 'image', status: 'published', publishDate: '2026-03-25', views: 890, likes: 67, shares: 23 },
    ]);
    
    setEmployees([
      { id: '1', name: '张三', title: '销售经理', department: '销售部', status: 'active', createdAt: '2026-01-15' },
      { id: '2', name: '李四', title: '市场专员', department: '市场部', status: 'active', createdAt: '2026-02-20' },
      { id: '3', name: '王五', title: '产品经理', department: '产品部', status: 'inactive', createdAt: '2026-01-10' },
    ]);
  }, []);

  const handleAddContent = () => {
    setEditingContent(null);
    contentForm.resetFields();
    setContentModalVisible(true);
  };

  const handleEditContent = (content: Content) => {
    setEditingContent(content);
    contentForm.setFieldsValue(content);
    setContentModalVisible(true);
  };

  const handleDeleteContent = (id: string) => {
    setContents(contents.filter(content => content.id !== id));
    message.success('内容删除成功');
  };

  const handleContentOk = async () => {
    try {
      const values = await contentForm.validateFields();
      
      if (editingContent) {
        // 更新内容
        setContents(contents.map(content => content.id === editingContent.id ? { ...content, ...values } : content));
      } else {
        // 添加新内容
        const newContent: Content = {
          id: `${contents.length + 1}`,
          ...values,
          views: 0,
          likes: 0,
          shares: 0,
          publishDate: new Date().toISOString().split('T')[0],
        };
        setContents([...contents, newContent]);
      }
      
      setContentModalVisible(false);
      message.success(editingContent ? '内容更新成功' : '内容创建成功');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    employeeForm.resetFields();
    setEmployeeModalVisible(true);
  };

  const handleEditEmployee = (employee: EmployeeCard) => {
    setEditingEmployee(employee);
    employeeForm.setFieldsValue(employee);
    setEmployeeModalVisible(true);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    message.success('员工名片删除成功');
  };

  const handleEmployeeOk = async () => {
    try {
      const values = await employeeForm.validateFields();
      
      if (editingEmployee) {
        // 更新员工名片
        setEmployees(employees.map(emp => emp.id === editingEmployee.id ? { ...emp, ...values } : emp));
      } else {
        // 添加新员工名片
        const newEmployee: EmployeeCard = {
          id: `${employees.length + 1}`,
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setEmployees([...employees, newEmployee]);
      }
      
      setEmployeeModalVisible(false);
      message.success(editingEmployee ? '员工名片更新成功' : '员工名片创建成功');
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  const contentColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { text: string, icon: React.ReactNode }> = {
          article: { text: '文章', icon: <FileTextOutlined /> },
          video: { text: '视频', icon: <VideoCameraOutlined /> },
          image: { text: '图片', icon: <PictureOutlined /> },
          whitepaper: { text: '白皮书', icon: <FileTextOutlined /> },
        };
        const typeInfo = typeMap[type];
        return typeInfo ? (
          <span>
            {typeInfo.icon} {typeInfo.text}
          </span>
        ) : type;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string, color: string }> = {
          draft: { text: '草稿', color: 'default' },
          published: { text: '已发布', color: 'success' },
          archived: { text: '已归档', color: 'warning' },
        };
        const statusInfo = statusMap[status];
        return statusInfo ? (
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        ) : status;
      }
    },
    {
      title: '发布时间',
      dataIndex: 'publishDate',
      key: 'publishDate',
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
    },
    {
      title: '点赞数',
      dataIndex: 'likes',
      key: 'likes',
    },
    {
      title: '分享数',
      dataIndex: 'shares',
      key: 'shares',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Content) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditContent(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这篇内容吗？"
            onConfirm={() => handleDeleteContent(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const employeeColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '职位',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string, color: string }> = {
          active: { text: '启用', color: 'success' },
          inactive: { text: '停用', color: 'default' },
        };
        const statusInfo = statusMap[status];
        return statusInfo ? (
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        ) : status;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: EmployeeCard) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditEmployee(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个员工名片吗？"
            onConfirm={() => handleDeleteEmployee(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>营销中心管理</Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="内容营销" key="content">
          <Card 
            title="内容管理"
            extra={
              <Button type="primary" onClick={handleAddContent}>
                <PlusOutlined /> 添加内容
              </Button>
            }
          >
            <Table 
              dataSource={contents} 
              columns={contentColumns} 
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>
        <TabPane tab="全员营销" key="employee">
          <Card 
            title="员工名片管理"
            extra={
              <Button type="primary" onClick={handleAddEmployee}>
                <PlusOutlined /> 添加员工名片
              </Button>
            }
          >
            <Table 
              dataSource={employees} 
              columns={employeeColumns} 
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 内容编辑模态框 */}
      <Modal
        title={editingContent ? "编辑内容" : "添加内容"}
        open={contentModalVisible}
        onOk={handleContentOk}
        onCancel={() => setContentModalVisible(false)}
        destroyOnClose
        width={800}
      >
        <Form
          form={contentForm}
          layout="vertical"
          name="content_form"
          initialValues={editingContent || {}}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入内容标题!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="内容类型"
            rules={[{ required: true, message: '请选择内容类型!' }]}
          >
            <Select>
              <Select.Option value="article">文章</Select.Option>
              <Select.Option value="video">视频</Select.Option>
              <Select.Option value="image">图片</Select.Option>
              <Select.Option value="whitepaper">白皮书</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态!' }]}
          >
            <Select>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="published">已发布</Select.Option>
              <Select.Option value="archived">已归档</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
          >
            <TextArea rows={6} placeholder="请输入内容..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 员工名片编辑模态框 */}
      <Modal
        title={editingEmployee ? "编辑员工名片" : "添加员工名片"}
        open={employeeModalVisible}
        onOk={handleEmployeeOk}
        onCancel={() => setEmployeeModalVisible(false)}
        destroyOnClose
      >
        <Form
          form={employeeForm}
          layout="vertical"
          name="employee_form"
          initialValues={editingEmployee || {}}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="title"
            label="职位"
            rules={[{ required: true, message: '请输入职位!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请输入部门!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态!' }]}
          >
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MarketingCenterPage;