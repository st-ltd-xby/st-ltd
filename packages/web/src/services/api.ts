import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
});

// 请求拦截器 - 自动附加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
  getFunnel: () => api.get('/dashboard/funnel'),
};

// CMS
export const cmsApi = {
  getSites: (params?: any) => api.get('/cms/sites', { params }),
  createSite: (data: any) => api.post('/cms/sites', data),
  getSite: (id: string) => api.get(`/cms/sites/${id}`),
  updateSite: (id: string, data: any) => api.put(`/cms/sites/${id}`, data),
  deleteSite: (id: string) => api.delete(`/cms/sites/${id}`),
  getPages: (siteId: string) => api.get(`/cms/sites/${siteId}/pages`),
  createPage: (siteId: string, data: any) => api.post(`/cms/sites/${siteId}/pages`, data),
  updatePage: (id: string, data: any) => api.put(`/cms/pages/${id}`, data),
  deletePage: (id: string) => api.delete(`/cms/pages/${id}`),
  getForms: (siteId: string) => api.get(`/cms/sites/${siteId}/forms`),
  createForm: (siteId: string, data: any) => api.post(`/cms/sites/${siteId}/forms`, data),
  getFormSubmissions: (id: string, params?: any) => api.get(`/cms/forms/${id}/submissions`, { params }),
  getMedia: (siteId: string, params?: any) => api.get(`/cms/sites/${siteId}/media`, { params }),
};

// SCRM
export const scrmApi = {
  getLeads: (params?: any) => api.get('/scrm/leads', { params }),
  createLead: (data: any) => api.post('/scrm/leads', data),
  getLead: (id: string) => api.get(`/scrm/leads/${id}`),
  updateLead: (id: string, data: any) => api.put(`/scrm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/scrm/leads/${id}`),
  assignLead: (id: string, assigneeId: string) => api.post(`/scrm/leads/${id}/assign`, { assigneeId }),
  addFollowUp: (leadId: string, data: any) => api.post(`/scrm/leads/${leadId}/follow-ups`, data),
  getCustomers: (params?: any) => api.get('/scrm/customers', { params }),
  createCustomer: (data: any) => api.post('/scrm/customers', data),
  getCustomer: (id: string) => api.get(`/scrm/customers/${id}`),
  updateCustomer: (id: string, data: any) => api.put(`/scrm/customers/${id}`, data),
  getOpportunities: (params?: any) => api.get('/scrm/opportunities', { params }),
  createOpportunity: (data: any) => api.post('/scrm/opportunities', data),
  updateOpportunity: (id: string, data: any) => api.put(`/scrm/opportunities/${id}`, data),
  getTags: () => api.get('/scrm/tags'),
  createTag: (data: any) => api.post('/scrm/tags', data),
};

// Content
export const contentApi = {
  getArticles: (params?: any) => api.get('/content/articles', { params }),
  createArticle: (data: any) => api.post('/content/articles', data),
  getArticle: (id: string) => api.get(`/content/articles/${id}`),
  updateArticle: (id: string, data: any) => api.put(`/content/articles/${id}`, data),
  deleteArticle: (id: string) => api.delete(`/content/articles/${id}`),
  createTrackingLink: (data: any) => api.post('/content/tracking-links', data),
  getEmployeeCards: () => api.get('/content/employee-cards'),
  createEmployeeCard: (data: any) => api.post('/content/employee-cards', data),
  getMaterials: (params?: any) => api.get('/content/materials', { params }),
  createMaterial: (data: any) => api.post('/content/materials', data),
  createShareRecord: (data: any) => api.post('/content/share-records', data),
  getShareStats: () => api.get('/content/share-records/stats'),
};

// Mall
export const mallApi = {
  getProducts: (params?: any) => api.get('/mall/products', { params }),
  createProduct: (data: any) => api.post('/mall/products', data),
  updateProduct: (id: string, data: any) => api.put(`/mall/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/mall/products/${id}`),
  getOrders: (params?: any) => api.get('/mall/orders', { params }),
  createOrder: (data: any) => api.post('/mall/orders', data),
  updateOrder: (id: string, data: any) => api.put(`/mall/orders/${id}`, data),
  getMembers: () => api.get('/mall/members'),
  getAppointments: () => api.get('/mall/appointments'),
  createAppointment: (data: any) => api.post('/mall/appointments', data),
  // 外部网站接入
  getExternalWebsites: () => api.get('/mall/external-websites'),
  createExternalWebsite: (data: any) => api.post('/mall/external-websites', data),
  updateExternalWebsite: (id: string, data: any) => api.put(`/mall/external-websites/${id}`, data),
  deleteExternalWebsite: (id: string) => api.delete(`/mall/external-websites/${id}`),
  syncExternalWebsite: (id: string) => api.post(`/mall/external-websites/${id}/sync`),
  getExternalProducts: (params?: any) => api.get('/mall/external-products', { params }),
  getPromotionTasks: () => api.get('/mall/promotion-tasks'),
  createPromotionTask: (data: any) => api.post('/mall/promotion-tasks', data),
  // 内容营销
  getContents: (params?: any) => api.get('/mall/contents', { params }),
  createContent: (data: any) => api.post('/mall/contents', data),
  updateContent: (id: string, data: any) => api.put(`/mall/contents/${id}`, data),
  deleteContent: (id: string) => api.delete(`/mall/contents/${id}`),
  publishContent: (id: string) => api.post(`/mall/contents/${id}/publish`),
  // 全员营销
  getEmployeeTasks: (params?: any) => api.get('/mall/employee-tasks', { params }),
  createEmployeeTask: (data: any) => api.post('/mall/employee-tasks', data),
  updateEmployeeTask: (id: string, data: any) => api.put(`/mall/employee-tasks/${id}`, data),
  deleteEmployeeTask: (id: string) => api.delete(`/mall/employee-tasks/${id}`),
  updateTaskProgress: (id: string, data: any) => api.put(`/mall/employee-tasks/${id}/progress`, data),
  getEmployees: () => api.get('/mall/employees'),
  // 线索管理
  getLeads: (params?: any) => api.get('/mall/leads', { params }),
  createLead: (data: any) => api.post('/mall/leads', data),
  updateLead: (id: string, data: any) => api.put(`/mall/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/mall/leads/${id}`),
  convertLead: (id: string) => api.post(`/mall/leads/${id}/convert`),
  getLeadSources: () => api.get('/mall/lead-sources'),
  // 客户管理
  getCustomers: (params?: any) => api.get('/mall/customers', { params }),
  createCustomer: (data: any) => api.post('/mall/customers', data),
  updateCustomer: (id: string, data: any) => api.put(`/mall/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/mall/customers/${id}`),
  convertLeadToCust: (id: string) => api.post(`/mall/leads/${id}/convert-to-customer`),
  // 建站中心
  getSites: (params?: any) => api.get('/mall/sites', { params }),
  createSite: (data: any) => api.post('/mall/sites', data),
  updateSite: (id: string, data: any) => api.put(`/mall/sites/${id}`, data),
  deleteSite: (id: string) => api.delete(`/mall/sites/${id}`),
  getPages: (params?: any) => api.get('/mall/pages', { params }),
  createPage: (data: any) => api.post('/mall/pages', data),
  updatePage: (id: string, data: any) => api.put(`/mall/pages/${id}`, data),
  deletePage: (id: string) => api.delete(`/mall/pages/${id}`),
  publishPage: (id: string) => api.post(`/mall/pages/${id}/publish`),
  previewPage: (id: string) => api.get(`/mall/pages/${id}/preview`),
  generatePageLink: (id: string, data: any) => api.post(`/mall/pages/${id}/generate-link`, data),
  // 表单管理
  getForms: (params?: any) => api.get('/mall/forms', { params }),
  createForm: (data: any) => api.post('/mall/forms', data),
  updateForm: (id: string, data: any) => api.put(`/mall/forms/${id}`, data),
  deleteForm: (id: string) => api.delete(`/mall/forms/${id}`),
  getFormData: (params?: any) => api.get('/mall/form-data', { params }),
  submitForm: (id: string, data: any) => api.post(`/mall/forms/${id}/submit`, data),
  // 数据看板
  getDashboardStats: () => api.get('/mall/dashboard/stats'),
  // 商机管理
  getOpportunities: (params?: any) => api.get('/mall/opportunities', { params }),
  createOpportunity: (data: any) => api.post('/mall/opportunities', data),
  updateOpportunity: (id: string, data: any) => api.put(`/mall/opportunities/${id}`, data),
  deleteOpportunity: (id: string) => api.delete(`/mall/opportunities/${id}`),
  convertLeadToOpportunity: (id: string) => api.post(`/mall/leads/${id}/convert-to-opportunity`),
};

// Promotion
export const promotionApi = {
  // 追踪链接
  getTrackingLinks: (params?: any) => api.get('/promotion/tracking-links', { params }),
  createTrackingLink: (data: any) => api.post('/promotion/tracking-links', data),
  deleteTrackingLink: (id: string) => api.delete(`/promotion/tracking-links/${id}`),
  simulateClick: (id: string, clicks?: number) => api.post(`/promotion/tracking-links/${id}/simulate-click`, { clicks }),
  getTrackingStats: () => api.get('/promotion/tracking-links/stats'),
  // 二维码
  getQrCodes: () => api.get('/promotion/qrcodes'),
  createQrCode: (data: any) => api.post('/promotion/qrcodes', data),
  generateQrCode: (data: any) => api.post('/promotion/qrcodes/generate', data),
  deleteQrCode: (id: string) => api.delete(`/promotion/qrcodes/${id}`),
  // 邮件营销
  getEmailTemplates: () => api.get('/promotion/email-templates'),
  createEmailTemplate: (data: any) => api.post('/promotion/email-templates', data),
  deleteEmailTemplate: (id: string) => api.delete(`/promotion/email-templates/${id}`),
  getEmailCampaigns: () => api.get('/promotion/email-campaigns'),
  createEmailCampaign: (data: any) => api.post('/promotion/email-campaigns', data),
  sendEmailCampaign: (id: string) => api.post(`/promotion/email-campaigns/${id}/send`),
  deleteEmailCampaign: (id: string) => api.delete(`/promotion/email-campaigns/${id}`),
  getEmailAddresses: () => api.get('/promotion/email-addresses'),
  createEmailAddress: (data: any) => api.post('/promotion/email-addresses', data),
  importEmailAddresses: (data: any) => api.post('/promotion/email-addresses/import', data),
  saveSmtpConfig: (data: any) => api.post('/promotion/smtp-config', data),
  getSmtpConfig: () => api.get('/promotion/smtp-config'),
  // SEO
  getSeoAnalysis: () => api.get('/promotion/seo/analysis'),
  getSitemapData: () => api.get('/promotion/seo/sitemap'),
  getRobotsTxt: () => api.get('/promotion/seo/robots.txt'),
  getStructuredData: (siteId?: string) => api.get('/promotion/seo/structured-data', { params: { siteId } }),
  autoFixSeo: (siteId: string) => api.post('/promotion/seo/auto-fix', { siteId }),
  exportSeoReport: () => api.get('/promotion/seo/report', { responseType: 'blob' }),
};
