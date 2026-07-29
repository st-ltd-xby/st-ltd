import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// 懒加载组件
const AdminLogin = lazy(() => import('../pages/admin/Login'));
const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const AdminWelcome = lazy(() => import('../pages/admin/Welcome'));

// 后端管理路由配置
export const adminRoutes = [
  {
    path: '/admin',
    element: <Navigate to="/admin/welcome" />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        path: 'welcome',
        element: <AdminWelcome />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/admin/welcome" replace/>,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'roles',
        element: <div>角色管理页面</div>,
      },
      {
        path: 'customers',
        element: <div>客户管理页面</div>,
      },
      {
        path: 'leads',
        element: <div>线索管理页面</div>,
      },
      {
        path: 'opportunities',
        element: <div>商机管理页面</div>,
      },
      {
        path: 'articles',
        element: <div>文章管理页面</div>,
      },
      {
        path: 'materials',
        element: <div>素材库页面</div>,
      },
      {
        path: 'sites',
        element: <div>站点管理页面</div>,
      },
      {
        path: 'pages',
        element: <div>页面管理页面</div>,
      },
      {
        path: 'products',
        element: <div>商品管理页面</div>,
      },
      {
        path: 'orders',
        element: <div>订单管理页面</div>,
      },
      {
        path: 'tracking-links',
        element: <div>短链管理页面</div>,
      },
      {
        path: 'email-campaigns',
        element: <div>邮件营销页面</div>,
      },
      {
        path: 'system',
        element: <div>系统管理页面</div>,
      },
    ],
  },
];