import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Typography, Select } from 'antd';
import { BankOutlined, UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, FileTextOutlined, LoginOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

const INDUSTRIES = [
  '制造业', 'IT/互联网', '金融', '房地产', '教育', '医疗',
  '零售/电商', '物流', '能源', '咨询', '其他',
];

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/public/customer-register`, {
        ...values,
        tenantId: 'test-tenant-001',
      });
      if (res.data.code === 0) {
        setSubmitted(true);
        message.success('注册成功，我们将尽快与您联系！');
      } else {
        message.error(res.data.message || '注册失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '提交失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 30%, #0f3460 70%, #1a5276 100%)',
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(10, 25, 50, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          padding: '60px 48px',
          border: '1px solid rgba(0, 180, 255, 0.15)',
          maxWidth: 480,
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <Title level={3} style={{ color: '#fff', marginBottom: 12 }}>提交成功</Title>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, display: 'block', marginBottom: 24 }}>
            我们已收到您的信息，工作人员将在 1-2 个工作日内与您联系。
          </Text>
          <Button
            type="primary"
            onClick={() => { setSubmitted(false); form.resetFields(); }}
            style={{
              background: 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)',
              border: 'none',
              borderRadius: 8,
            }}
          >
            继续提交
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 30%, #0f3460 70%, #1a5276 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 16px',
    }}>
      {/* 科技网格背景 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0, 180, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 180, 255, 0.05) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 150, 255, 0.15) 0%, transparent 70%)', filter: 'blur(40px)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
        background: 'rgba(10, 25, 50, 0.7)', backdropFilter: 'blur(20px)',
        borderRadius: 16, padding: '40px 36px',
        border: '1px solid rgba(0, 180, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 16px', borderRadius: 14,
            background: 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0, 150, 255, 0.3)',
          }}>
            <BankOutlined style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: 0, color: '#fff', fontSize: 22 }}>企业客户注册</Title>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>填写信息，获取专属服务方案</Text>
          <div style={{ marginTop: 16 }}>
            <Button
              type="default"
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              style={{
                background: 'rgba(0, 180, 255, 0.1)',
                border: '1px solid rgba(0, 180, 255, 0.3)',
                color: '#00b4ff',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              已有账号？去登录
            </Button>
          </div>
        </div>

        <Form form={form} onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="name" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
            <Input prefix={<BankOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />} placeholder="请输入企业/公司全称"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
          </Form.Item>

          <Form.Item name="industry" label="所属行业">
            <Select placeholder="请选择行业"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }}
              dropdownStyle={{ background: '#0d2137' }}>
              {INDUSTRIES.map(ind => <Option key={ind} value={ind}>{ind}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="contactName" label="联系人姓名" rules={[{ required: true, message: '请输入联系人' }]}>
            <Input prefix={<UserOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />} placeholder="请输入联系人姓名"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
          </Form.Item>

          <Form.Item name="contactPhone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input prefix={<PhoneOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />} placeholder="请输入手机号"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
          </Form.Item>

          <Form.Item name="contactEmail" label="联系邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
            <Input prefix={<MailOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />} placeholder="请输入邮箱（选填）"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
          </Form.Item>

          <Form.Item name="address" label="公司地址">
            <Input prefix={<EnvironmentOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />} placeholder="请输入公司地址（选填）"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
          </Form.Item>

          <Form.Item name="note" label="需求描述">
            <Input.TextArea prefix={<FileTextOutlined />} rows={3} placeholder="请简要描述您的需求（选填）"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block
              style={{
                height: 44, background: 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500,
                boxShadow: '0 4px 16px rgba(0, 150, 255, 0.3)',
              }}>
              提交注册
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
