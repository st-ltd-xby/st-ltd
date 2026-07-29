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
  Typography 
} from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('front-users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`http://localhost:4001/api/v1/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 200) {
        setUsers(response.data.data.list);
      } else {
        message.error(response.data.message || '获取用户列表失败');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`http://localhost:4001/api/v1/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.code === 200) {
        message.success('删除成功');
        fetchUsers();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      message.error('删除失败');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      const token = localStorage.getItem('adminToken');
      let response;
      
      if (editingUser) {
        // 更新用户
        response = await axios.put(
          `http://localhost:4001/api/v1/admin/users/${editingUser.id}`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        // 创建用户
        response = await axios.post(
          'http://localhost:4001/api/v1/admin/users',
          { ...values, password: '123456' }, // 默认密码
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }

      if (response.data.code === 200) {
        message.success(editingUser ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchUsers();
      } else {
        message.error(response.data.message || (editingUser ? '更新失败' : '创建失败'));
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      message.error('保存失败');
    }
  };

  const frontUserColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: Record<string, string> = {
          admin: '管理员',
          manager: '经理',
          staff: '员工',
          member: '会员'
        };
        return roleMap[role] || role;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          active: '启用',
          inactive: '禁用'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditUser(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const adminUserColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '登录名',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: Record<string, string> = {
          admin: '超级管理员',
          manager: '管理员',
          staff: '操作员'
        };
        return roleMap[role] || role;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          active: '启用',
          inactive: '禁用'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '最后登录',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditUser(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个管理员吗？"
            onConfirm={() => handleDeleteUser(record.id)}
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
      <Card title={<Title level={4}>用户管理</Title>} style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="前台用户管理" key="front-users">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleAddUser}>添加前台用户</Button>
            </div>
            <Table 
              dataSource={users} 
              columns={frontUserColumns} 
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
          <TabPane tab="后台管理员管理" key="admin-users">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleAddUser}>添加管理员</Button>
            </div>
            <Table 
              dataSource={users.filter(user => user.role === 'admin')} 
              columns={adminUserColumns} 
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
        title={editingUser ? "编辑用户" : "添加用户"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          name="user_form"
          initialValues={editingUser || {}}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱/登录名"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入正确的邮箱格式!' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色!' }]}
          >
            <Select>
              {activeTab === 'front-users' ? (
                <>
                  <Option value="member">会员</Option>
                  <Option value="staff">员工</Option>
                </>
              ) : (
                <>
                  <Option value="admin">超级管理员</Option>
                  <Option value="manager">管理员</Option>
                  <Option value="staff">操作员</Option>
                </>
              )}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态!' }]}
          >
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;