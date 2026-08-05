import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import { useAuthStore } from './stores/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Sites from './pages/cms/Sites';
import PageBuilder from './pages/cms/PageBuilder';
import Forms from './pages/cms/Forms';
import Leads from './pages/scrm/Leads';
import Customers from './pages/scrm/Customers';
import Opportunities from './pages/scrm/Opportunities';
import Articles from './pages/content/Articles';
import Marketing from './pages/marketing/Marketing';
import Mall from './pages/mall/Mall';
import Promotion from './pages/promotion/Promotion';
import Settings from './pages/settings/Settings';
import PageViewer from './pages/PageViewer';
import ShortLinkRedirect from './pages/ShortLinkRedirect';
import CustomerRegister from './pages/CustomerRegister';
import OpportunityTracker from './pages/OpportunityTracker';
import { adminRoutes } from './routes/adminRoutes';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cms/sites" element={<Sites />} />
            <Route path="cms/builder" element={<PageBuilder />} />
            <Route path="cms/forms" element={<Forms />} />
            <Route path="scrm/leads" element={<Leads />} />
            <Route path="scrm/customers" element={<Customers />} />
            <Route path="scrm/opportunities" element={<Opportunities />} />
            <Route path="content/articles" element={<Articles />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="mall" element={<Mall />} />
            <Route path="promotion" element={<Promotion />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          {/* 公开页面查看路由（无需登录） */}
          <Route path="/p/:slug" element={<PageViewer />} />
          {/* 短链跳转路由（无需登录） */}
          <Route path="/t/:shortCode" element={<ShortLinkRedirect />} />
          {/* 客户自助注册（无需登录） */}
          <Route path="/customer-register" element={<CustomerRegister />} />
          {/* 商机进度追踪（无需登录） */}
          <Route path="/track/:token" element={<OpportunityTracker />} />
          {/* 后端管理路由 */}
          {adminRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element}>
              {route.children && route.children.map((child, childIndex) => (
                <Route key={childIndex} path={child.path} element={child.element} />
              ))}
            </Route>
          ))}
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
