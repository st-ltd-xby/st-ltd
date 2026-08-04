import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, TeamOutlined, AppstoreOutlined, ContactsOutlined, 
  RiseOutlined, ShopOutlined, LinkOutlined, SettingOutlined,
  FileTextOutlined, MailOutlined, QrcodeOutlined, MessageOutlined,
  UserOutlined, LogoutOutlined, FundOutlined, FireOutlined,
  ApiOutlined, SafetyCertificateOutlined, CloudSyncOutlined,
  DatabaseOutlined, ToolOutlined, BookOutlined, BellOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, UserAddOutlined, RobotOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Avatar, Dropdown, Space, Badge, Breadcrumb } from 'antd';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  {
    key: 'user-management', icon: <TeamOutlined />, label: '用户管理',
    children: [
      { key: '/admin/users', icon: <UserOutlined />, label: '前端用户列表' },
      { key: '/admin/admin-users', icon: <UserOutlined />, label: '后端管理员管理' },
      { key: '/admin/registrations', icon: <UserAddOutlined />, label: '注册审核' },
    ],
  },
  {
    key: 'site-management', icon: <AppstoreOutlined />, label: '建站中心',
    children: [
      { key: '/admin/sites', icon: <AppstoreOutlined />, label: '网站管理' },
      { key: '/admin/pages', icon: <FileTextOutlined />, label: '页面搭建' },
    ],
  },
  {
    key: 'customer-hub', icon: <ContactsOutlined />, label: '客户枢纽',
    children: [
      { key: '/admin/customers', icon: <ContactsOutlined />, label: '客户管理' },
      { key: '/admin/leads', icon: <UserOutlined />, label: '线索管理' },
      { key: '/admin/opportunities', icon: <FundOutlined />, label: '商机管理' },
      { key: '/admin/opportunity-board', icon: <DashboardOutlined />, label: '商机看板' },
    ],
  },
  {
    key: 'marketing-center', icon: <RiseOutlined />, label: '营销中心',
    children: [
      { key: '/admin/marketing?tab=content', icon: <FileTextOutlined />, label: '内容管理' },
      { key: '/admin/marketing?tab=marketing', icon: <UserOutlined />, label: '全员营销' },
    ],
  },
  {
    key: 'mall-management', icon: <ShopOutlined />, label: '商城管理',
    children: [
      { key: '/admin/mall?tab=mall-review', icon: <ShopOutlined />, label: '商城审核' },
      { key: '/admin/mall?tab=hot-products', icon: <FireOutlined />, label: '爆品推广' },
    ],
  },
  {
    key: 'promotion-center', icon: <LinkOutlined />, label: '推广中心',
    children: [
      { key: '/admin/promotion?tab=promotion', icon: <RiseOutlined />, label: '页面推广' },
      { key: '/admin/promotion?tab=tracking', icon: <LinkOutlined />, label: '追踪链接' },
      { key: '/admin/promotion?tab=seo', icon: <SafetyCertificateOutlined />, label: 'SEO优化' },
    ],
  },
  { key: '/admin/ai-agent', icon: <RobotOutlined />, label: 'AI智囊' },
  {
    key: 'system-settings', icon: <SettingOutlined />, label: '系统设置',
    children: [
      { key: '/admin/settings?tab=basic', icon: <SettingOutlined />, label: '基础设置' },
      { key: '/admin/settings?tab=notification', icon: <BellOutlined />, label: '通知设置' },
      { key: '/admin/settings?tab=security', icon: <SafetyCertificateOutlined />, label: '安全设置' },
      { key: '/admin/settings?tab=api', icon: <ApiOutlined />, label: 'API设置' },
      { key: '/admin/settings?tab=apidocs', icon: <BookOutlined />, label: 'API文档' },
      { key: '/admin/settings?tab=integration', icon: <CloudSyncOutlined />, label: '集成设置' },
      { key: '/admin/settings?tab=backup', icon: <DatabaseOutlined />, label: '备份设置' },
      { key: '/admin/settings?tab=tools', icon: <ToolOutlined />, label: '系统工具' },
    ],
  },
];

// 菜单key到标签的映射
const menuLabelMap: Record<string, string> = {
  '/admin/dashboard': '仪表盘',
  '/admin/users': '前端用户列表',
  '/admin/admin-users': '后端管理员管理',
  '/admin/registrations': '注册审核',
  '/admin/sites': '网站管理',
  '/admin/pages': '页面搭建',
  '/admin/customers': '客户管理',
  '/admin/leads': '线索管理',
  '/admin/opportunities': '商机管理',
  '/admin/opportunity-board': '商机看板',
  '/admin/marketing?tab=content': '内容管理',
  '/admin/marketing?tab=marketing': '全员营销',
  '/admin/mall?tab=mall-review': '商城审核',
  '/admin/mall?tab=hot-products': '爆品推广',
  '/admin/promotion?tab=promotion': '页面推广',
  '/admin/promotion?tab=tracking': '追踪链接',
  '/admin/promotion?tab=seo': 'SEO优化',
  '/admin/settings?tab=basic': '基础设置',
  '/admin/settings?tab=security': '安全设置',
  '/admin/settings?tab=api': 'API设置',
  '/admin/settings?tab=apidocs': 'API文档',
  '/admin/settings?tab=integration': '集成设置',
  '/admin/settings?tab=backup': '备份设置',
  '/admin/settings?tab=tools': '系统工具',
  '/admin/ai-agent': 'AI智囊',
};

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('adminToken');
  const userInfo = token ? JSON.parse(localStorage.getItem('adminUserInfo') || '{}') : {};

  const handleMenuClick = (key: string) => {
    if (key.startsWith('/admin/')) navigate(key);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUserInfo');
    navigate('/login');
  };

  const userMenu = (
    <Menu items={[
      { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: logout },
    ]} />
  );

  // 当前页面标签
  const currentLabel = menuLabelMap[location.pathname + location.search] || '仪表盘';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        theme="dark"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          borderRight: 'none',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo区域 */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>ST</span>
          </div>
          {!collapsed && (
            <div style={{ marginLeft: 12, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, lineHeight: '20px' }}>ST-LTD</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: '16px' }}>运营管理平台</div>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname + location.search]}
          defaultOpenKeys={['user-management', 'site-management', 'customer-hub', 'marketing-center', 'mall-management', 'promotion-center', 'system-settings']}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            borderRight: 'none',
            background: 'transparent',
          }}
        />
      </Sider>

      {/* 主内容区 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        {/* 顶部导航 */}
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          height: 64,
          lineHeight: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {collapsed
              ? <MenuUnfoldOutlined onClick={() => setCollapsed(false)} style={{ fontSize: 18, cursor: 'pointer', color: '#666' }} />
              : <MenuFoldOutlined onClick={() => setCollapsed(true)} style={{ fontSize: 18, cursor: 'pointer', color: '#666' }} />
            }
            <Breadcrumb
              items={[
                { title: '首页' },
                { title: currentLabel },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={0} size="small" offset={[-4, 4]}>
              <BellOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />
            </Badge>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size={32}
                  style={{ backgroundColor: '#667eea', fontWeight: 600, fontSize: 14 }}
                >
                  {userInfo.name?.[0] || userInfo.email?.[0]?.toUpperCase() || 'A'}
                </Avatar>
                <span style={{ fontSize: 14, color: '#333' }}>{userInfo.name || userInfo.email || '管理员'}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>

        {/* 内容 */}
        <Content style={{ margin: 0, padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <Outlet />
        </Content>

        {/* 底部版权 */}
        <div style={{
          textAlign: 'center', padding: '16px 0', color: '#bbb', fontSize: 12,
          borderTop: '1px solid #f0f0f0', background: '#fff',
        }}>
          Copyright &copy; {new Date().getFullYear()} 辽宁高新安防科技有限公司 版权所有
        </div>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
