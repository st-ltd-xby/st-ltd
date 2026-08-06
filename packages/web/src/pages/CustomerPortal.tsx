import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Typography, Card, Descriptions, Tag, Tabs, Table, Space, Modal, Row, Col, Statistic } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, LockOutlined, EditOutlined, SaveOutlined, LogoutOutlined, BankOutlined, FundOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const { Title, Text } = Typography;

const stageLabels: Record<string, string> = {
  pending: '待处理', quoting: '报价中', won: '已赢单', lost: '已丢单', closed: '已关闭',
};
const stageColors: Record<string, string> = {
  pending: 'orange', quoting: 'blue', won: 'green', lost: 'red', closed: 'default',
};

export default function CustomerPortal() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('customerToken'));
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [loginForm] = Form.useForm();

  // 获取客户信息
  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/public/customer-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.code === 0) {
        setCustomer(res.data.data);
      } else {
        message.error(res.data.message || '获取信息失败');
        handleLogout();
      }
    } catch (err: any) {
      message.error('登录已过期，请重新登录');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  // 登录
  const handleLogin = async (values: any) => {
    setLoginLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/public/customer-login`, {
        ...values,
        tenantId: 'test-tenant-001',
      });
      if (res.data.code === 0) {
        const { token: newToken, customer: info } = res.data.data;
        localStorage.setItem('customerToken', newToken);
        setToken(newToken);
        setCustomer(info);
        message.success('登录成功');
      } else {
        message.error(res.data.message || '登录失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '登录失败，请检查网络');
    } finally {
      setLoginLoading(false);
    }
  };

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    setToken(null);
    setCustomer(null);
    setEditing(false);
  };

  // 保存编辑
  const handleSave = async (values: any) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/v1/public/customer-profile`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.code === 0) {
        setCustomer(res.data.data);
        setEditing(false);
        message.success('信息更新成功');
      } else {
        message.error(res.data.message || '更新失败');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑
  const startEdit = () => {
    if (customer) {
      editForm.setFieldsValue(customer);
      setEditing(true);
    }
  };

  // 未登录 - 显示登录表单
  if (!token || !customer) {
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
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(0, 180, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 180, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '20%', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 150, 255, 0.12) 0%, transparent 70%)', filter: 'blur(40px)',
        }} />

        <div style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
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
            <Title level={3} style={{ margin: 0, color: '#fff', fontSize: 22 }}>客户门户登录</Title>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>使用注册时的手机号/邮箱和密码登录</Text>
          </div>

          <Form form={loginForm} onFinish={handleLogin} layout="vertical" size="large">
            <Form.Item name="contactPhone" label="手机号">
              <Input prefix={<PhoneOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />} placeholder="请输入注册时的手机号"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
            </Form.Item>

            <Form.Item name="contactEmail" label="邮箱">
              <Input prefix={<MailOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />} placeholder="或输入注册时的邮箱"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
            </Form.Item>

            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(0, 180, 255, 0.6)' }} />} placeholder="请输入密码"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#fff' }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button type="primary" htmlType="submit" loading={loginLoading} block
                style={{
                  height: 44, background: 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)',
                  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500,
                  boxShadow: '0 4px 16px rgba(0, 150, 255, 0.3)',
                }}>
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              还没有账号？
            </Text>
            <a href="/customer-register" style={{ color: '#00b4ff', fontSize: 13, marginLeft: 4 }}>
              立即注册
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 已登录 - 显示门户内容
  const opportunities = customer.opportunities || [];
  const activeOpps = opportunities.filter((o: any) => ['pending', 'quoting'].includes(o.stage));
  const wonOpps = opportunities.filter((o: any) => o.stage === 'won');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 30%, #0f3460 70%, #1a5276 100%)',
      padding: '24px 16px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* 顶部标题栏 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              <BankOutlined style={{ marginRight: 10, color: '#00b4ff' }} />
              我的信息中心
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              欢迎回来，{customer.contactName || customer.name}
            </Text>
          </div>
          <Space>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0, 180, 255, 0.2)', color: '#00b4ff', borderRadius: 8 }}>
              退出登录
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: 'rgba(10, 25, 50, 0.7)', border: '1px solid rgba(0, 180, 255, 0.15)', borderRadius: 12 }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>客户等级</span>}
                value={customer.level} prefix={<span style={{ color: '#faad14', fontSize: 20 }}>★</span>}
                valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: 'rgba(10, 25, 50, 0.7)', border: '1px solid rgba(0, 180, 255, 0.15)', borderRadius: 12 }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>进行中商机</span>}
                value={activeOpps.length} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#00b4ff' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: 'rgba(10, 25, 50, 0.7)', border: '1px solid rgba(0, 180, 255, 0.15)', borderRadius: 12 }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>已成交</span>}
                value={wonOpps.length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: 'rgba(10, 25, 50, 0.7)', border: '1px solid rgba(0, 180, 255, 0.15)', borderRadius: 12 }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>累计成交</span>}
                value={customer.totalDeal || 0} prefix={<FundOutlined />}
                formatter={(v) => `¥${Number(v).toLocaleString()}`} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
        </Row>

        {/* 主内容区 */}
        <Card style={{
          background: 'rgba(10, 25, 50, 0.7)', border: '1px solid rgba(0, 180, 255, 0.15)',
          borderRadius: 12, backdropFilter: 'blur(20px)',
        }}>
          <Tabs defaultActiveKey="profile" items={[
            {
              key: 'profile',
              label: <span><UserOutlined /> 企业信息</span>,
              children: editing ? (
                <div>
                  <Form form={editForm} onFinish={handleSave} layout="vertical">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="name" label="企业名称">
                          <Input placeholder="企业名称" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="industry" label="行业">
                          <Input placeholder="所属行业" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="contactName" label="联系人">
                          <Input placeholder="联系人姓名" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="contactPhone" label="联系电话">
                          <Input placeholder="手机号" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="contactEmail" label="联系邮箱">
                          <Input placeholder="邮箱地址" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="website" label="网站">
                          <Input placeholder="公司网站" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="address" label="地址">
                      <Input placeholder="公司地址" />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                          保存修改
                        </Button>
                        <Button onClick={() => setEditing(false)}>取消</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<EditOutlined />} onClick={startEdit}
                      style={{ background: 'linear-gradient(135deg, #00b4ff 0%, #0077ff 100%)', border: 'none', borderRadius: 8 }}>
                      编辑信息
                    </Button>
                  </div>
                  <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small"
                    labelStyle={{ background: 'rgba(0, 180, 255, 0.05)', color: 'rgba(255,255,255,0.7)' }}
                    contentStyle={{ color: '#fff' }}>
                    <Descriptions.Item label="企业名称">{customer.name}</Descriptions.Item>
                    <Descriptions.Item label="客户等级">
                      <Tag color={customer.level === 'A' ? 'gold' : customer.level === 'B' ? 'blue' : 'green'}>
                        {customer.level}级
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="行业">{customer.industry || '-'}</Descriptions.Item>
                    <Descriptions.Item label="网站">{customer.website || '-'}</Descriptions.Item>
                    <Descriptions.Item label="联系人">{customer.contactName || '-'}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{customer.contactPhone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="联系邮箱" span={2}>{customer.contactEmail || '-'}</Descriptions.Item>
                    <Descriptions.Item label="地址" span={2}>{customer.address || '-'}</Descriptions.Item>
                    <Descriptions.Item label="备注" span={2}>{customer.note || '-'}</Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
            {
              key: 'opportunities',
              label: <span><FundOutlined /> 我的商机</span>,
              children: opportunities.length > 0 ? (
                <Table
                  dataSource={opportunities}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '商机名称', dataIndex: 'title', key: 'title', width: 200 },
                    {
                      title: '阶段', dataIndex: 'stage', key: 'stage', width: 100,
                      render: (s: string) => <Tag color={stageColors[s]}>{stageLabels[s] || s}</Tag>,
                    },
                    {
                      title: '金额', dataIndex: 'amount', key: 'amount', width: 120,
                      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-',
                    },
                    {
                      title: '预计成交', dataIndex: 'expectedCloseDate', key: 'date', width: 120,
                      render: (d: string) => d ? new Date(d).toLocaleDateString() : '-',
                    },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
                  <FundOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
                  暂无商机信息，我们的工作人员会与您对接
                </div>
              ),
            },
            {
              key: 'contacts',
              label: <span><UserOutlined /> 联系人</span>,
              children: customer.contacts?.length > 0 ? (
                <Table
                  dataSource={customer.contacts}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '姓名', dataIndex: 'name', key: 'name' },
                    { title: '职位', dataIndex: 'position', key: 'position', render: (v: string) => v || '-' },
                    { title: '电话', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '-' },
                    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string) => v || '-' },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
                  <UserOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
                  暂无联系人信息
                </div>
              ),
            },
          ]} />
        </Card>
      </div>
    </div>
  );
}
