import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, Badge, Button } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  UserOutlined, 
  ContactsOutlined, 
  FileTextOutlined, 
  ShopOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  AppstoreOutlined,
  RiseOutlined,
  LinkOutlined,
  MailOutlined,
  BarChartOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(5); // 示例通知数量
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 获取管理员用户信息
    const userInfo = localStorage.getItem('adminUserInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    } else {
      // 如果没有用户信息，跳转到登录页
      navigate('/admin/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUserInfo');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">仪表盘</Link>,
    },
    {
      key: 'user-management',
      icon: <TeamOutlined />,
      label: '用户管理',
      children: [
        {
          key: '/admin/users',
          icon: <UserOutlined />,
          label: <Link to="/admin/users">用户列表</Link>,
        },
        {
          key: '/admin/roles',
          icon: <ContactsOutlined />,
          label: <Link to="/admin/roles">角色管理</Link>,
        },
      ],
    },
    {
      key: 'customer-management',
      icon: <ContactsOutlined />,
      label: '客户管理',
      children: [
        {
          key: '/admin/customers',
          icon: <UserOutlined />,
          label: <Link to="/admin/customers">客户列表</Link>,
        },
        {
          key: '/admin/leads',
          icon: <RiseOutlined />,
          label: <Link to="/admin/leads">线索管理</Link>,
        },
        {
          key: '/admin/opportunities',
          icon: <RiseOutlined />,
          label: <Link to="/admin/opportunities">商机管理</Link>,
        },
      ],
    },
    {
      key: 'content-management',
      icon: <FileTextOutlined />,
      label: '内容管理',
      children: [
        {
          key: '/admin/articles',
          icon: <FileTextOutlined />,
          label: <Link to="/admin/articles">文章管理</Link>,
        },
        {
          key: '/admin/materials',
          icon: <AppstoreOutlined />,
          label: <Link to="/admin/materials">素材库</Link>,
        },
      ],
    },
    {
      key: 'site-management',
      icon: <AppstoreOutlined />,
      label: '建站管理',
      children: [
        {
          key: '/admin/sites',
          icon: <AppstoreOutlined />,
          label: <Link to="/admin/sites">站点管理</Link>,
        },
        {
          key: '/admin/pages',
          icon: <FileTextOutlined />,
          label: <Link to="/admin/pages">页面管理</Link>,
        },
      ],
    },
    {
      key: 'mall-management',
      icon: <ShopOutlined />,
      label: '商品管理',
      children: [
        {
          key: '/admin/products',
          icon: <ShopOutlined />,
          label: <Link to="/admin/products">商品列表</Link>,
        },
        {
          key: '/admin/orders',
          icon: <BarChartOutlined />,
          label: <Link to="/admin/orders">订单管理</Link>,
        },
      ],
    },
    {
      key: 'promotion-management',
      icon: <RiseOutlined />,
      label: '推广管理',
      children: [
        {
          key: '/admin/tracking-links',
          icon: <LinkOutlined />,
          label: <Link to="/admin/tracking-links">短链管理</Link>,
        },
        {
          key: '/admin/email-campaigns',
          icon: <MailOutlined />,
          label: <Link to="/admin/email-campaigns">邮件营销</Link>,
        },
      ],
    },
    {
      key: '/admin/system',
      icon: <SettingOutlined />,
      label: <Link to="/admin/system">系统管理</Link>,
    },
  ];

  const notificationMenu = (
    <div style={{ width: 300, padding: 16 }}>
      <Text strong>通知</Text>
      <div style={{ marginTop: 8 }}>
        <div>新线索到达: 3条</div>
        <div style={{ marginTop: 4 }}>商机更新: 2条</div>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{ background: '#fff' }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {!collapsed && 'LTD 后端管理'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div>
            <Text strong>{location.pathname.split('/').pop()?.replace('-', ' ') || '仪表盘'}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown overlay={notificationMenu} trigger={['click']}>
              <Badge count={notifications} overflowCount={99}>
                <Button type="text" shape="circle" size="large" style={{ fontSize: '18px' }}>
                  🛎
                </Button>
              </Badge>
            </Dropdown>
            
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    label: '个人资料',
                    icon: <UserOutlined />,
                  },
                  {
                    key: 'logout',
                    label: '退出登录',
                    icon: <LogoutOutlined />,
                    onClick: handleLogout,
                  },
                ],
              }}
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name || '管理员'}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;