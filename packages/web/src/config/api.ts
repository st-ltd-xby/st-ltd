// API 基础地址 - 生产环境直接访问Railway后端（绕过Cloudflare代理）FIX20260807
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://st-ltd-api-production.up.railway.app/api/v1');
