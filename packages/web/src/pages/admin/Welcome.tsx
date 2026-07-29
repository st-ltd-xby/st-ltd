import React from 'react';
import { Card, Row, Col, Typography, Divider } from 'antd';
import { 
  TeamOutlined, 
  AppstoreOutlined, 
  ContactsOutlined, 
  RiseOutlined, 
  ShopOutlined, 
  LinkOutlined, 
  SettingOutlined,
  FileTextOutlined,
  MailOutlined,
  QrcodeOutlined,
  MessageOutlined,
  UserOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const AdminWelcome: React.FC = () => {
  const quickAccessItems = [
    {
      title: '用户管理',
      icon: <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      description: '管理前台用户与后台管理员',
      path: '/admin/users',
      color: '#e6f7ff'
    },
    {
      title: '建站中心',
      icon: <AppstoreOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      description: '网站管理与页面搭建',
      path: '/admin/sites',
      color: '#f6ffed'
    },
    {
      title: '客户枢纽',
      icon: <ContactsOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      description: '简易CRM管理系统',
      path: '/admin/customers',
      color: '#f9f0ff'
    },
    {
      title: '营销中心',
      icon: <RiseOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      description: '内容营销与全员营销',
      path: '/admin/articles',
      color: '#fff7e6'
    },
    {
      title: '商城管理',
      icon: <ShopOutlined style={{ fontSize: 24, color: '#f5222d' }} />,
      description: '电子商城与商品管理',
      path: '/admin/products',
      color: '#fff1f0'
    },
    {
      title: '推广中心',
      icon: <LinkOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
      description: '二维码与邮件营销',
      path: '/admin/tracking-links',
      color: '#e6fffb'
    },
    {
      title: '系统设置',
      icon: <SettingOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />,
      description: 'API与大模型接口管理',
      path: '/admin/system',
      color: '#f0f0f0'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2}>ST-LTD 运营管理系统</Title>
        <Text type="secondary">Lead to Deal · 从引导到交易 · 全链路运营管理系统</Text>
      </div>

      <Divider orientation="left">快速访问</Divider>
      <Row gutter={[24, 24]}>
        {quickAccessItems.map((item, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <Link to={item.path}>
              <Card 
                hoverable
                style={{ 
                  backgroundColor: item.color,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  height: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                bodyStyle={{ padding: 16, textAlign: 'center' }}
              >
                <div style={{ marginBottom: 12 }}>{item.icon}</div>
                <Title level={5} style={{ margin: 0 }}>{item.title}</Title>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                  {item.description}
                </Text>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Divider orientation="left">系统概览</Divider>
      <Row gutter={24}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <UserOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
              <div>
                <Text strong>总用户数</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>1,234</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ContactsOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 12 }} />
              <div>
                <Text strong>客户数</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>567</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <RiseOutlined style={{ fontSize: 24, color: '#fa8c16', marginRight: 12 }} />
              <div>
                <Text strong>线索数</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>890</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <BarChartOutlined style={{ fontSize: 24, color: '#f5222d', marginRight: 12 }} />
              <div>
                <Text strong>转化率</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>23.5%</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">功能模块</Divider>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card title="内容管理">
            <ul style={{ paddingLeft: 20 }}>
              <li>文章管理</li>
              <li>图片库</li>
              <li>视频管理</li>
              <li>白皮书管理</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="推广工具">
            <ul style={{ paddingLeft: 20 }}>
              <li>二维码生成</li>
              <li>邮件营销</li>
              <li>短链管理</li>
              <li>跟踪链接</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="系统配置">
            <ul style={{ paddingLeft: 20 }}>
              <li>API接口管理</li>
              <li>大模型配置</li>
              <li>搜索引擎接口</li>
              <li>数据调用管理</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminWelcome;