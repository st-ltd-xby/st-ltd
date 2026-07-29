import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    // 如果没有令牌，重定向到登录页面
    return <Navigate to="/login" replace />;
  }
  
  // 如果有令牌，渲染子组件
  return children as JSX.Element;
};

export default PrivateRoute;