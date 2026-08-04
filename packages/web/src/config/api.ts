// API 基础地址 - 生产环境走Cloudflare Pages Functions代理
export const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:4000' : '';
