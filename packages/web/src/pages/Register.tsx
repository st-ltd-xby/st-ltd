import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';

const { Title, Text } = Typography;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await authApi.register(values);
      if (res.code === 0) {
        message.success('注册成功！请等待管理员审核，审核通过后可登录');
        navigate('/login');
      } else {
        message.error(res.message || '注册失败');
      }
    } catch (err: any) {
      message.error(err?.message || '注册失败，请检查网络');
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
        width: 460,
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
          <Title level={3} style={{ margin: 0, color: '#fff', fontSize: 22 }}>创建账号</Title>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>填写信息，立即开始使用</Text>
        </div>
        <Form onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入姓名' }, { min: 2, message: '姓名至少2个字符' }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />}
              placeholder="姓名"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(0, 180, 255, 0.2)',
                color: '#fff',
              }}
            />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />}
              placeholder="邮箱"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(0, 180, 255, 0.2)',
                color: '#fff',
              }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
            style={{ marginBottom: 16 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />}
              placeholder="密码（至少6位）"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(0, 180, 255, 0.2)',
                color: '#fff',
              }}
            />
          </Form.Item>
          <Form.Item
            name="companyName"
            rules={[{ required: true, message: '请输入企业名称' }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<BankOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />}
              placeholder="企业名称"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(0, 180, 255, 0.2)',
                color: '#fff',
              }}
            />
          </Form.Item>
          <Form.Item
            name="phone"
            style={{ marginBottom: 24 }}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />}
              placeholder="手机号（可选）"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(0, 180, 255, 0.2)',
                color: '#fff',
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 16 }}>
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
              立即注册
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>已有账号？</Text>
          <a onClick={() => navigate('/login')} style={{ color: '#00b4ff', marginLeft: 4, cursor: 'pointer' }}>返回登录</a>
        </div>
      </div>
    </div>
  );
}
