import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Dropdown, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined, GlobalOutlined, EditOutlined, FormOutlined,
  FunnelPlotOutlined, TeamOutlined, StarOutlined, FileTextOutlined,
  HeartOutlined, ShopOutlined, SettingOutlined, BellOutlined,
  LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  RocketOutlined, ScanOutlined, CameraOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useVisitorTrack } from '../hooks/useVisitorTrack';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, logout } = useAuthStore();
  const { token: { colorBgContainer } } = theme.useToken();

  // 强制使用当前语言，确保翻译生效
  const currentLang = i18n.language || 'zh';

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard'), groupKey: 'overview', groupLabel: t('nav.overview', 'Overview') },
    { key: '/cms/sites', icon: <GlobalOutlined />, label: t('nav.sites', 'Sites'), groupKey: 'siteBuilder', groupLabel: t('nav.siteBuilder', 'Site Builder') },
    { key: '/cms/builder', icon: <EditOutlined />, label: t('nav.pageBuilder', 'Page Builder'), groupKey: 'siteBuilder', groupLabel: t('nav.siteBuilder', 'Site Builder') },
    { key: '/cms/forms', icon: <FormOutlined />, label: t('nav.forms', 'Forms'), groupKey: 'siteBuilder', groupLabel: t('nav.siteBuilder', 'Site Builder') },
    { key: '/scan', icon: <ScanOutlined />, label: t('nav.scan'), groupKey: 'customerHub', groupLabel: t('nav.customerHub') },
    { key: '/scrm/leads', icon: <FunnelPlotOutlined />, label: t('nav.leads'), groupKey: 'customerHub', groupLabel: t('nav.customerHub'), badge: 12 },
    { key: '/scrm/customers', icon: <TeamOutlined />, label: t('nav.customers'), groupKey: 'customerHub', groupLabel: t('nav.customerHub') },
    { key: '/scrm/opportunities', icon: <StarOutlined />, label: t('nav.opportunities'), groupKey: 'customerHub', groupLabel: t('nav.customerHub') },
    { key: '/content/articles', icon: <FileTextOutlined />, label: t('nav.contentMarketing', 'Content Marketing'), groupKey: 'marketingCenter', groupLabel: t('nav.marketingCenter', 'Marketing Center') },
    { key: '/marketing', icon: <HeartOutlined />, label: t('nav.employeeMarketing', 'Employee Marketing'), groupKey: 'marketingCenter', groupLabel: t('nav.marketingCenter', 'Marketing Center') },
    { key: '/mall', icon: <ShopOutlined />, label: t('nav.mall'), groupKey: 'tradeCenter', groupLabel: t('nav.tradeCenter', 'Trade Center') },
    { key: '/promotion', icon: <RocketOutlined />, label: t('nav.promotion'), groupKey: 'promotionCenter', groupLabel: t('nav.promotionCenter', 'Promotion Center') },
    { key: '/settings', icon: <SettingOutlined />, label: t('nav.settings'), groupKey: 'system', groupLabel: t('nav.system', 'System') },
  ];

  // 访客追踪
  useVisitorTrack(tenant?.id);

  // 根据当前路径确定选中的菜单项
  const selectedKey = menuItems.find(item => location.pathname.startsWith(item.key))?.key || '/dashboard';

  // 按 groupKey 分组（稳定 key，不随语言变化）
  const groupedItems: Record<string, typeof menuItems> = {};
  menuItems.forEach(item => {
    if (!groupedItems[item.groupKey]) groupedItems[item.groupKey] = [];
    groupedItems[item.groupKey].push(item);
  });

  const siderMenuItems = Object.entries(groupedItems).map(([groupKey, items]) => ({
    type: 'group' as const,
    label: items[0].groupLabel,
    children: items.map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.badge ? (
        <span>{item.label} <Badge count={item.badge} size="small" style={{ marginLeft: 8 }} /></span>
      ) : item.label,
    })),
  }));

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={240}
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10 }}>
          <span style={{ color: '#1677ff', fontSize: 22 }}>&#9670;</span>
          {!collapsed && <h1 style={{ color: '#fff', fontSize: 17, margin: 0 }}>ST-LTD</h1>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={siderMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {collapsed ? <MenuUnfoldOutlined onClick={() => setCollapsed(false)} style={{ fontSize: 18, cursor: 'pointer' }} /> : <MenuFoldOutlined onClick={() => setCollapsed(true)} style={{ fontSize: 18, cursor: 'pointer' }} />}
            <span style={{ color: '#999', fontSize: 14 }}>首页 / {menuItems.find(m => m.key === selectedKey)?.label || '数据看板'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }} size="small">{user?.name?.[0] || 'U'}</Avatar>
                <span style={{ fontSize: 14 }}>{user?.name || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#999', fontSize: 13, borderTop: '1px solid #f0f0f0' }}>
          Copyright &copy; {new Date().getFullYear()} ST-LTD. 保留所有权利。
        </div>
      </Layout>
    </Layout>
  );
}
