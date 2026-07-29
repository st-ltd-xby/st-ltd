import { create } from 'zustand';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface TenantInfo {
  id: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  tenant: TenantInfo | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserInfo, tenant: TenantInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

  setAuth: (token, user, tenant) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tenant', JSON.stringify(tenant));
    set({ token, user, tenant, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    set({ token: null, user: null, tenant: null, isAuthenticated: false });
  },
}));
