import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AdminLogin from './pages/Login';
import AdminLayout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import AdminManagement from './pages/AdminManagement';
import SiteManagement from './pages/SiteManagement';
import CustomerHub from './pages/CustomerHub';
import MarketingCenter from './pages/MarketingCenter';
import MallManagement from './pages/MallManagement';
import PromotionCenter from './pages/PromotionCenter';
import SystemSettings from './pages/SystemSettings';
import PageBuilder from './pages/PageBuilder';
import LeadManagement from './pages/LeadManagement';
import OpportunityManagement from './pages/OpportunityManagement';
import OpportunityBoard from './pages/OpportunityBoard';
import RegistrationReview from './pages/RegistrationReview';
import PrivateRoute from './components/PrivateRoute';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
            <Route index element={<PrivateRoute><Navigate to="/admin/dashboard" /></PrivateRoute>} />
            <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
            <Route path="admin-users" element={<PrivateRoute><AdminManagement /></PrivateRoute>} />
            <Route path="sites" element={<PrivateRoute><SiteManagement /></PrivateRoute>} />
            <Route path="pages" element={<PrivateRoute><PageBuilder /></PrivateRoute>} />
            <Route path="customers" element={<PrivateRoute><CustomerHub /></PrivateRoute>} />
            <Route path="leads" element={<PrivateRoute><LeadManagement /></PrivateRoute>} />
            <Route path="opportunities" element={<PrivateRoute><OpportunityManagement /></PrivateRoute>} />
            <Route path="opportunity-board" element={<PrivateRoute><OpportunityBoard /></PrivateRoute>} />
            <Route path="marketing" element={<PrivateRoute><MarketingCenter /></PrivateRoute>} />
            <Route path="mall" element={<PrivateRoute><MallManagement /></PrivateRoute>} />
            <Route path="promotion" element={<PrivateRoute><PromotionCenter /></PrivateRoute>} />
            <Route path="registrations" element={<PrivateRoute><RegistrationReview /></PrivateRoute>} />
            <Route path="settings" element={<PrivateRoute><SystemSettings /></PrivateRoute>} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;