import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, Modal, Form, message, Select, Tag, Popconfirm, Badge } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Option } = Select;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');

  const roles = [
    { value: 'super_admin', label: '超级管理员', color: 'red' },
    { value: 'admin', label: '管理员', color: 'blue' },
    { value: 'operator', label: '运营人员', color: 'green' },
  ];

  const statuses = [
    { value: 'active', label: '正常', color: 'success' },
    { value: 'inactive', label: '已禁用', color: 'error' },
  ];

  // 获取管理员列表
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/admin-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.code === 0 || response.data.code === 200) {
        setAdmins(response.data.data.list || response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      // 模拟数据
      setAdmins([
        { id: '1', name: '超级管理员', email: 'admin@ltd.com', role: 'super_admin', status: 'active', createdAt: '2026-01-01T00:00:00Z', lastLoginAt: '2026-07-27T09:00:00Z' },
        { id: '2', name: '系统管理员', email: 'manager@ltd.com', role: 'admin', status: 'active', createdAt: '2026-03-15T00:00:00Z', lastLoginAt: '2026-07-26T14:30:00Z' },
        { id: '3', name: '运营专员', email: 'operator@ltd.com', role: 'operator', status: 'active', createdAt: '2026-05-20T00:00:00Z', lastLoginAt: '2026-07-25T10:15:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const showModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    form.setFieldsValue({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
    });
    setIsEditModalVisible(true);
  };

  const handleCreateAdmin = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/api/v1/admin/admin-users`, {
        ...values,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.code === 0 || response.data.code === 200) {
        message.success('管理员创建成功');
        setIsModalVisible(false);
        form.resetFields();
        fetchAdmins();
      } else {
        message.error(response.data.message || '创建失败');
      }
    } catch (error: any) {
      console.error('Error creating admin:', error);
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const handleUpdateAdmin = async () => {
    if (!currentAdmin) return;
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('adminToken');
      const { newPassword, ...updateData } = values;

      // 先更新基本信息
      const response = await axios.put(`${API_BASE_URL}/api/v1/admin/admin-users/${currentAdmin.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.code === 0 || response.data.code === 200) {
        // 如果填写了新密码，调用密码重置接口
        if (newPassword && newPassword.length >= 6) {
          await axios.put(`${API_BASE_URL}/api/v1/admin/users/${currentAdmin.id}/password`, { password: newPassword }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('管理员更新成功，密码已重置');
        } else {
          message.success('管理员更新成功');
        }
        setIsEditModalVisible(false);
        setCurrentAdmin(null);
        form.resetFields();
        fetchAdmins();
      } else {
        message.error(response.data.message || '更新失败');
      }
    } catch (error: any) {
      console.error('Error updating admin:', error);
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`${API_BASE_URL}/api/v1/admin/admin-users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.code === 0 || response.data.code === 200) {
        message.success('管理员删除成功');
        fetchAdmins();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditModalVisible(false);
    setCurrentAdmin(null);
    form.resetFields();
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined style={{ color: '#f5222d' }} />
            <span>后端管理员管理</span>
            <Tag color="red">系统后台</Tag>
          </div>
        }
        extra={
          <Space>
            <Input
              placeholder="搜索管理员（姓名/邮箱）..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              新增管理员
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Badge count={admins.filter(a => a.status === 'active').length} style={{ backgroundColor: '#52c41a' }} overflowCount={999}>
            <span style={{ marginLeft: 8, fontSize: 14 }}>正常管理员</span>
          </Badge>
          <span style={{ margin: '0 16px', color: '#d9d9d9' }}>|</span>
          <span style={{ fontSize: 14, color: '#8c8c8c' }}>管理LTD运营后台管理系统的管理员账号</span>
        </div>

        <Table
          dataSource={filteredAdmins}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条数据`
          }}
        >
          <Table.Column title="ID" dataIndex="id" key="id" width={80} />
          <Table.Column
            title="姓名"
            dataIndex="name"
            key="name"
            render={(name) => <strong>{name}</strong>}
          />
          <Table.Column title="邮箱" dataIndex="email" key="email" width={200} />
          <Table.Column
            title="手机号"
            dataIndex="phone"
            key="phone"
            render={(phone) => phone || '-'}
          />
          <Table.Column
            title="角色"
            dataIndex="role"
            key="role"
            render={(role) => {
              const roleInfo = roles.find(r => r.value === role);
              return (
                <Tag color={roleInfo?.color} icon={<SafetyCertificateOutlined />}>
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
            title="创建时间"
            dataIndex="createdAt"
            key="createdAt"
            render={(date) => new Date(date).toLocaleString('zh-CN')}
          />
          <Table.Column
            title="最后登录"
            dataIndex="lastLoginAt"
            key="lastLoginAt"
            render={(date) => date ? new Date(date).toLocaleString('zh-CN') : '-'}
          />
          <Table.Column
            title="操作"
            key="action"
            fixed="right"
            width={180}
            render={(_: any, record: AdminUser) => (
              <Space size="middle">
                <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除这个管理员吗？"
                  description="删除后该管理员将无法登录后台管理系统"
                  onConfirm={() => handleDeleteAdmin(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            )}
          />
        </Table>
      </Card>

      {/* 新增管理员模态框 */}
      <Modal
        title="新增后台管理员"
        open={isModalVisible}
        onOk={handleCreateAdmin}
        onCancel={handleCancel}
        destroyOnClose
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" name="adminForm" autoComplete="off">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名!' }]}>
            <Input placeholder="请输入管理员姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱（登录账号）" rules={[
            { required: true, message: '请输入邮箱!' },
            { type: 'email', message: '请输入有效的邮箱!' }
          ]}>
            <Input placeholder="请输入管理员邮箱，将作为登录账号" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入管理员手机号" />
          </Form.Item>
          <Form.Item name="password" label="登录密码" rules={[
            { required: true, message: '请设置登录密码!' },
            { min: 6, message: '密码至少6位!' }
          ]}>
            <Input.Password placeholder="请设置登录密码（至少6位）" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色!' }]}>
            <Select placeholder="请选择管理员角色">
              {roles.map(role => (
                <Option key={role.value} value={role.value}>{role.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态!' }]} initialValue="active">
            <Select placeholder="请选择状态">
              {statuses.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑管理员模态框 */}
      <Modal
        title="编辑后台管理员"
        open={isEditModalVisible}
        onOk={handleUpdateAdmin}
        onCancel={handleCancel}
        destroyOnClose
        okText="更新"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" name="editAdminForm" autoComplete="off">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名!' }]}>
            <Input placeholder="请输入管理员姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱（登录账号）" rules={[
            { required: true, message: '请输入邮箱!' },
            { type: 'email', message: '请输入有效的邮箱!' }
          ]}>
            <Input placeholder="管理员邮箱" disabled={!!currentAdmin?.email} />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入管理员手机号" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色!' }]}>
            <Select placeholder="请选择管理员角色">
              {roles.map(role => (
                <Option key={role.value} value={role.value}>{role.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态!' }]}>
            <Select placeholder="请选择状态">
              {statuses.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="newPassword" label="重置密码" extra="留空则不修改密码">
            <Input.Password placeholder="输入新密码以重置（至少6位，留空不修改）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminManagement;
