import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      // 调用后端管理登录API
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/admin-login`, {
        email: values.username,
        password: values.password
      });

      if (response.data.code === 200) {
        // 存储管理员token
        localStorage.setItem('adminToken', response.data.data.token);
        localStorage.setItem('adminUserInfo', JSON.stringify(response.data.data.user));
        
        message.success('登录成功');
        navigate('/admin/dashboard');
      } else {
        message.error(response.data.message || '登录失败');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      message.error(error.response?.data?.message || '登录失败，请检查用户名密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ 
          width: 400, 
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}
        title={
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ marginBottom: 0, color: '#1a1a2e' }}>LTD 后端管理系统</Title>
            <Text type="secondary">管理员登录</Text>
          </div>
        }
      >
        <Form
          name="admin_login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入管理员邮箱!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="管理员邮箱" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
              style={{ marginTop: 16 }}
            >
              登录
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">提示：管理员账号与前端用户账号不同</Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AdminLogin;