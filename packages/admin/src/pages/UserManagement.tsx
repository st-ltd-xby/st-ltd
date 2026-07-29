import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, Modal, Form, message, Select, Tag, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Option } = Select;

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  tenantId: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  
  const roles = [
    { value: 'admin', label: '管理员', color: 'red' },
    { value: 'manager', label: '经理', color: 'blue' },
    { value: 'employee', label: '员工', color: 'green' },
    { value: 'user', label: '普通用户', color: 'orange' },
  ];
  
  const statuses = [
    { value: 'active', label: '激活', color: 'success' },
    { value: 'inactive', label: '未激活', color: 'default' },
    { value: 'pending', label: '待审核', color: 'warning' },
    { value: 'suspended', label: '已停用', color: 'error' },
  ];

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        setUsers(response.data.data.list || response.data.data);
      } else {
        message.error(response.data.message || '获取用户列表失败');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      message.error(error.response?.data?.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取用户列表
  useEffect(() => {
    fetchUsers();
  }, []);

  // 显示新增用户模态框
  const showModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 显示编辑用户模态框
  const showEditModal = (user: User) => {
    setCurrentUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    });
    setIsEditModalVisible(true);
  };

  // 创建新用户
  const handleCreateUser = async () => {
    try {
      const values = await form.validateFields();
      
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/users`, {
        ...values,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success(`用户创建成功！邮箱：${values.email}，密码：${values.password}`);
        setIsModalVisible(false);
        form.resetFields();
        fetchUsers(); // 重新获取用户列表
      } else {
        message.error(response.data.message || '用户创建失败');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      message.error(error.response?.data?.message || '用户创建失败');
    }
  };

  // 更新用户
  const handleUpdateUser = async () => {
    if (!currentUser) return;
    
    try {
      const values = await form.validateFields();
      
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`${API_BASE_URL}/api/v1/admin/users/${currentUser.id}`, values, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('用户更新成功');
        setIsEditModalVisible(false);
        setCurrentUser(null);
        form.resetFields();
        fetchUsers(); // 重新获取用户列表
      } else {
        message.error(response.data.message || '用户更新失败');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      message.error(error.response?.data?.message || '用户更新失败');
    }
  };

  // 删除用户
  const handleDeleteUser = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`${API_BASE_URL}/api/v1/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.code === 0 || response.data.code === 200) {
        message.success('用户删除成功');
        fetchUsers(); // 重新获取用户列表
      } else {
        message.error(response.data.message || '用户删除失败');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      message.error(error.response?.data?.message || '用户删除失败');
    }
  };

  // 处理取消
  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditModalVisible(false);
    setCurrentUser(null);
    form.resetFields();
  };

  // 过滤用户
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Card 
        title="前端用户列表" 
        extra={
          <Space>
            <Input 
              placeholder="搜索用户（姓名/邮箱/ID）..." 
              prefix={<SearchOutlined />} 
              style={{ width: 300 }} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              新增前端用户
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={filteredUsers} 
          rowKey="id" 
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`
          }}
        >
          <Table.Column title="ID" dataIndex="id" key="id" width={120} />
          <Table.Column 
            title="姓名" 
            dataIndex="name" 
            key="name" 
            sorter={(a: User, b: User) => a.name.localeCompare(b.name)}
          />
          <Table.Column 
            title="邮箱" 
            dataIndex="email" 
            key="email" 
            width={200}
          />
          <Table.Column 
            title="手机号" 
            dataIndex="phone" 
            key="phone" 
            hidden
            render={(phone) => phone || '-'}
          />
          <Table.Column 
            title="角色" 
            dataIndex="role" 
            key="role" 
            render={(role) => {
              const roleInfo = roles.find(r => r.value === role);
              return (
                <Tag color={roleInfo?.color}>
                  {roleInfo?.label || role}
                </Tag>
              );
            }}
            filters={roles.map(role => ({ text: role.label, value: role.value }))}
            onFilter={(value, record) => record.role === value}
          />
          <Table.Column 
            title="状态" 
            dataIndex="status" 
            key="status" 
            render={(status) => {
              const statusInfo = statuses.find(s => s.value === status);
              return (
                <Tag color={statusInfo?.color}>
                  {statusInfo?.label || status}
                </Tag>
              );
            }}
            filters={statuses.map(status => ({ text: status.label, value: status.value }))}
            onFilter={(value, record) => record.status === value}
          />
          <Table.Column 
            title="租户ID" 
            dataIndex="tenantId" 
            key="tenantId" 
            width={150}
            ellipsis={true}
            hidden
          />
          <Table.Column 
            title="创建时间" 
            dataIndex="createdAt" 
            key="createdAt" 
            render={(date) => new Date(date).toLocaleString('zh-CN')}
            sorter={(a: User, b: User) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()}
          />
          <Table.Column 
            title="最后登录" 
            dataIndex="lastLoginAt" 
            key="lastLoginAt" 
            render={(date) => date ? new Date(date).toLocaleString('zh-CN') : '-'}
            hidden
          />
          <Table.Column
            title="操作"
            key="action"
            width={200}
            render={(_: any, record: User) => (
              <Space size="middle">
                <Button 
                  type="link" 
                  icon={<EyeOutlined />} 
                  onClick={() => showEditModal(record)}
                  title="查看/编辑"
                >
                  查看
                </Button>
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={() => showEditModal(record)}
                  title="编辑"
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除这个用户吗？"
                  onConfirm={() => handleDeleteUser(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="link" 
                    danger 
                    icon={<DeleteOutlined />}
                    title="删除"
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            )}
          />
        </Table>
      </Card>
      
      {/* 新增前端用户模态框 */}
      <Modal
        title="新增前端用户"
        open={isModalVisible}
        onOk={handleCreateUser}
        onCancel={handleCancel}
        destroyOnClose
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="userForm"
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名!' }]}
          >
            <Input placeholder="请输入用户姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱!' }
            ]}
          >
            <Input placeholder="请输入用户邮箱" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
          >
            <Input placeholder="请输入用户手机号" />
          </Form.Item>
          <Form.Item
            name="password"
            label="登录密码"
            rules={[
              { required: true, message: '请设置登录密码!' },
              { min: 6, message: '密码至少6位!' }
            ]}
          >
            <Input.Password placeholder="请设置用户登录密码（创建后可用于前端登录）" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色!' }]}
          >
            <Select placeholder="请选择用户角色">
              {roles.map(role => (
                <Option key={role.value} value={role.value}>{role.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态!' }]}
            initialValue="active"
          >
            <Select placeholder="请选择用户状态">
              {statuses.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 编辑前端用户模态框 */}
      <Modal
        title="编辑前端用户"
        open={isEditModalVisible}
        onOk={handleUpdateUser}
        onCancel={handleCancel}
        destroyOnClose
        okText="更新"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="editUserForm"
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名!' }]}
          >
            <Input placeholder="请输入用户姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱!' }
            ]}
          >
            <Input placeholder="请输入用户邮箱" disabled={!!currentUser?.email} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
          >
            <Input placeholder="请输入用户手机号" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色!' }]}
          >
            <Select placeholder="请选择用户角色">
              {roles.map(role => (
                <Option key={role.value} value={role.value}>{role.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态!' }]}
          >
            <Select placeholder="请选择用户状态">
              {statuses.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;