import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

export default function Login() { // API配置已更新为直接访问Railway后端
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 首先尝试普通用户登录
      let res: any;
      try {
        res = await authApi.login(values);
      } catch (normalLoginErr) {
        // 如果普通登录失败，尝试管理员登录
        console.log('普通登录失败，尝试管理员登录');
        res = await authApi.adminLogin(values);
      }
      
      if (res.code === 0) {
        setAuth(res.data.token, res.data.user, res.data.tenant);
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (err: any) {
      message.error(err?.message || '登录失败，请检查网络');
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
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 30%, #0f3460 70%, #1a5276 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 科技网格背景 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 180, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 180, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
      {/* 光晕效果 */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '30%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 150, 255, 0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 200, 255, 0.1) 0%, transparent 70%)',
        filter: 'blur(30px)',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: 420,
        background: 'rgba(10, 25, 50, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: '40px 36px',
        border: '1px solid rgba(0, 180, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 60px rgba(0, 150, 255, 0.05)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            margin: '0 auto 16px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0, 150, 255, 0.3)',
          }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
              <circle cx="12" cy="12" r="7" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              <polygon points="12,3 10.5,12 13.5,12" fill="rgba(255,255,255,0.9)" />
              <polygon points="12,21 10.5,12 13.5,12" fill="rgba(255,255,255,0.3)" />
              <circle cx="12" cy="12" r="1.5" fill="#fff" />
            </svg>
          </div>
          <Title level={3} style={{ margin: 0, color: '#fff', fontSize: 22 }}>ST-LTD 运营系统</Title>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Lead to Deal · 从引导到交易</Text>
        </div>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />}
              placeholder="邮箱"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(0, 180, 255, 0.2)',
                color: '#fff',
              }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />}
              placeholder="密码"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(0, 180, 255, 0.2)',
                color: '#fff',
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                background: 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                boxShadow: '0 4px 16px rgba(0, 150, 255, 0.3)',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>还没有账号？</Text>
          <a onClick={() => navigate('/register')} style={{ color: '#00b4ff', marginLeft: 4 }}>立即注册</a>
        </div>
      </div>
    </div>
  );
}
