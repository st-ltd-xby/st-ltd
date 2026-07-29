import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/admin-login`, {
        email: values.username,
        password: values.password
      });

      if (response.data.code === 0 || response.data.code === 200) {
        localStorage.setItem('adminToken', response.data.data.token);
        localStorage.setItem('adminUserInfo', JSON.stringify(response.data.data.user));
        message.success('登录成功');
        navigate('/admin/dashboard');
      } else {
        message.error(response.data.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败，请检查用户名密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* 左侧品牌区域 */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 罗盘背景装饰 - 中国传统罗盘(风水罗盘) */}
        <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 580, height: 580, opacity: 0.15 }} viewBox="0 0 200 200">
          {/* 最外圈 */}
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
          {/* 第一层：二十四山(24个方位) */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          {/* 二十四山刻度分隔线 */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15) * Math.PI / 180;
            return (
              <line key={`m24-${i}`}
                x1={100 + 80 * Math.sin(angle)} y1={100 - 80 * Math.cos(angle)}
                x2={100 + 90 * Math.sin(angle)} y2={100 - 90 * Math.cos(angle)}
                stroke="rgba(255,255,255,0.6)" strokeWidth="0.4"
              />
            );
          })}
          {/* 二十四山文字 */}
          {['壬','子','癸','丑','艮','寅','甲','卯','乙','辰','巽','巳','丙','午','丁','未','坤','申','庚','酉','辛','戌','乾','亥'].map((char, i) => {
            const angle = (i * 15 + 7.5) * Math.PI / 180;
            const r = 85;
            const x = 100 + r * Math.sin(angle);
            const y = 100 - r * Math.cos(angle);
            return <text key={`mt-${i}`} x={x} y={y + 1.8} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="4.5" fontFamily="KaiTi, STKaiti, serif">{char}</text>;
          })}
          {/* 第二层：八卦(八宫) */}
          <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          {/* 八卦分隔线 */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            return (
              <line key={`bg-${i}`}
                x1={100 + 62 * Math.sin(angle)} y1={100 - 62 * Math.cos(angle)}
                x2={100 + 72 * Math.sin(angle)} y2={100 - 72 * Math.cos(angle)}
                stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"
              />
            );
          })}
          {/* 八卦符号(用卦名) */}
          {['坎','艮','震','巽','离','坤','兑','乾'].map((char, i) => {
            const angle = (i * 45 + 22.5) * Math.PI / 180;
            const r = 67;
            const x = 100 + r * Math.sin(angle);
            const y = 100 - r * Math.cos(angle);
            return <text key={`bg-${i}`} x={x} y={y + 2} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="5.5" fontWeight="bold" fontFamily="KaiTi, STKaiti, serif">{char}</text>;
          })}
          {/* 第三层：天干地支 */}
          <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="46" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          {/* 天干分隔线 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            return (
              <line key={`tg-${i}`}
                x1={100 + 46 * Math.sin(angle)} y1={100 - 46 * Math.cos(angle)}
                x2={100 + 55 * Math.sin(angle)} y2={100 - 55 * Math.cos(angle)}
                stroke="rgba(255,255,255,0.5)" strokeWidth="0.3"
              />
            );
          })}
          {/* 十二地支 */}
          {['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].map((char, i) => {
            const angle = (i * 30 + 15) * Math.PI / 180;
            const r = 50.5;
            const x = 100 + r * Math.sin(angle);
            const y = 100 - r * Math.cos(angle);
            return <text key={`dz-${i}`} x={x} y={y + 1.8} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="4.5" fontFamily="KaiTi, STKaiti, serif">{char}</text>;
          })}
          {/* 内圈：天池(中心池) */}
          <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
          {/* 十字红线(罗盘特征) */}
          <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(200,50,50,0.3)" strokeWidth="0.3" />
          <line x1="8" y1="100" x2="192" y2="100" stroke="rgba(200,50,50,0.3)" strokeWidth="0.3" />
          {/* 天池内指针 */}
          <polygon points="100,65 97,100 100,97" fill="rgba(200,50,50,0.8)" />
          <polygon points="100,65 103,100 100,97" fill="rgba(200,50,50,0.5)" />
          <polygon points="100,135 97,100 100,103" fill="rgba(255,255,255,0.5)" />
          <polygon points="100,135 103,100 100,103" fill="rgba(255,255,255,0.3)" />
          {/* 中心轴 */}
          <circle cx="100" cy="100" r="4" fill="rgba(200,50,50,0.6)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="2" fill="rgba(255,255,255,0.8)" />
        </svg>
        {/* 小罗盘装饰 - 右上 */}
        <svg style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, opacity: 0.08 }} viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15) * Math.PI / 180;
            return (
              <line key={i}
                x1={100 + 70 * Math.sin(angle)} y1={100 - 70 * Math.cos(angle)}
                x2={100 + 80 * Math.sin(angle)} y2={100 - 80 * Math.cos(angle)}
                stroke="rgba(255,255,255,0.5)" strokeWidth="0.3"
              />
            );
          })}
          <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
          <polygon points="100,50 97,100 100,97" fill="rgba(200,50,50,0.6)" />
          <polygon points="100,50 103,100 100,97" fill="rgba(200,50,50,0.3)" />
          <polygon points="100,150 97,100 100,103" fill="rgba(255,255,255,0.3)" />
          <circle cx="100" cy="100" r="4" fill="rgba(200,50,50,0.4)" />
          <circle cx="100" cy="100" r="2" fill="rgba(255,255,255,0.6)" />
        </svg>
        {/* 小罗盘装饰 - 左下 */}
        <svg style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, opacity: 0.06 }} viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15) * Math.PI / 180;
            return (
              <line key={i}
                x1={100 + 70 * Math.sin(angle)} y1={100 - 70 * Math.cos(angle)}
                x2={100 + 80 * Math.sin(angle)} y2={100 - 80 * Math.cos(angle)}
                stroke="rgba(255,255,255,0.5)" strokeWidth="0.3"
              />
            );
          })}
          <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
          <polygon points="100,50 97,100 100,97" fill="rgba(200,50,50,0.6)" />
          <polygon points="100,50 103,100 100,97" fill="rgba(200,50,50,0.3)" />
          <polygon points="100,150 97,100 100,103" fill="rgba(255,255,255,0.3)" />
          <circle cx="100" cy="100" r="4" fill="rgba(200,50,50,0.4)" />
          <circle cx="100" cy="100" r="2" fill="rgba(255,255,255,0.6)" />
        </svg>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* 罗盘Logo */}
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px', boxShadow: '0 20px 40px rgba(102,126,234,0.3)',
            position: 'relative', overflow: 'hidden',
          }}>
            <svg viewBox="0 0 40 40" width="44" height="44">
              <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
              <circle cx="20" cy="20" r="11" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
              {/* 24山刻度 */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 15) * Math.PI / 180;
                return (
                  <line key={i}
                    x1={20 + 14 * Math.sin(angle)} y1={20 - 14 * Math.cos(angle)}
                    x2={20 + 17 * Math.sin(angle)} y2={20 - 17 * Math.cos(angle)}
                    stroke="rgba(255,255,255,0.5)" strokeWidth="0.3"
                  />
                );
              })}
              {/* 天池指针 */}
              <polygon points="20,7 18.5,20 21.5,20" fill="rgba(255,255,255,0.9)" />
              <polygon points="20,33 18.5,20 21.5,20" fill="rgba(255,255,255,0.35)" />
              <circle cx="20" cy="20" r="2" fill="#fff" />
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: 42, fontWeight: 700, margin: '0 0 14px', letterSpacing: 2 }}>ST-LTD</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, margin: '0 0 10px' }}>运营管理平台</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>数据来源：世贸搜途跨境产业云平台 · www.sotool.cn</p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {['Lead to Deal · 从引导到交易', '建站 · 客户 · 营销 · 商城 · 推广', '数据驱动 · 智能运营'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#667eea' }} />
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 32, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          Copyright &copy; {new Date().getFullYear()} 辽宁高新安防科技有限公司
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div style={{
        width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 60px', background: '#fff',
      }}>
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px' }}>管理员登录</h2>
          <p style={{ color: '#999', fontSize: 14, margin: 0 }}>请使用管理员账号登录后台管理系统</p>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入管理员邮箱' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bbb' }} />}
              placeholder="管理员邮箱"
              style={{ height: 48, borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bbb' }} />}
              placeholder="密码"
              style={{ height: 48, borderRadius: 8 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%', height: 48, borderRadius: 8, fontSize: 16, fontWeight: 500,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none', boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AdminLogin;
