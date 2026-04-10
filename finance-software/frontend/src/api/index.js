import axios from 'axios';
import { ElMessage } from 'element-plus';

// 获取当前域名，判断是否为公开访问
const isPublicDeployment = window.location.hostname.includes('trycloudflare') || 
                           window.location.hostname.includes('loca.lt');

// 公开部署时使用完整URL，开发环境使用相对路径
// 使用当前可用的后端API
const getBaseURL = () => {
  if (isPublicDeployment) {
    // 使用当前运行的后端
    return 'https://pendant-supplied-sims-steady.trycloudflare.com/api';
  }
  // 本地开发 - 通过 Vite 代理
  return '/api';
};

// 创建 axios 实例
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 Token 和账套信息
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantId = localStorage.getItem('currentTenantId');
    const year = localStorage.getItem('currentYear');
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    if (year) {
      config.headers['X-Year'] = year;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      ElMessage.error('登录已过期，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (status === 403) {
      ElMessage.error('没有权限执行此操作');
    } else if (status >= 500) {
      ElMessage.error('服务器错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

// 导出 API 实例
export default api;

// 登录/认证 API
export const authApi = {
  login: (data) => api.post('/v1/auth/login', data),
  register: (data) => api.post('/v1/auth/register', data),
  getProfile: () => api.get('/v1/auth/profile'),
  changePassword: (data) => api.post('/v1/auth/change-password', data),
  resetPassword: (data) => api.post('/v1/auth/reset-password', data),
  verify: () => api.get('/v1/auth/verify'),
};

// 凭证 API
export const voucherApi = {
  list: (params) => api.get('/v1/vouchers', { params }),
  get: (id) => api.get(`/v1/vouchers/${id}`),
  create: (data) => api.post('/v1/vouchers', data),
  update: (id, data) => api.put(`/v1/vouchers/${id}`, data),
  delete: (id) => api.delete(`/v1/vouchers/${id}`),
  approve: (id) => api.post(`/v1/vouchers/${id}/approve`),
  unapprove: (id) => api.post(`/v1/vouchers/${id}/unapprove`),
  post: (id) => api.post(`/v1/vouchers/${id}/post`),
  unpost: (id) => api.post(`/v1/vouchers/${id}/unpost`),
  batchApprove: (ids) => api.post('/v1/vouchers/batch-approve', { ids }),
  batchDelete: (ids) => api.post('/v1/vouchers/batch-delete', { ids }),
};

// 账户 API
export const accountApi = {
  list: (params) => api.get('/v1/accounts', { params }),
  get: (id) => api.get(`/v1/accounts/${id}`),
  create: (data) => api.post('/v1/accounts', data),
  update: (id, data) => api.put(`/v1/accounts/${id}`, data),
  delete: (id) => api.delete(`/v1/accounts/${id}`),
  getTenants: () => api.get('/v1/tenants'),
};

// 账簿 API
export const accountBookApi = {
  getDetail: (params) => api.get('/v1/account-books/detail', { params }),
  getGeneral: (params) => api.get('/v1/account-books/general', { params }),
  getCash: (params) => api.get('/v1/account-books/cash', { params }),
  getBalance: (params) => api.get('/v1/account-books/balance', { params }),
  getMultiColumn: (params) => api.get('/v1/account-books/multi-column', { params }),
};

// 报表 API
export const reportApi = {
  getBalanceSheet: (params) => api.get('/v1/reports/balance-sheet', { params }),
  getProfitStatement: (params) => api.get('/v1/reports/profit-statement', { params }),
  getCashFlow: (params) => api.get('/v1/reports/cash-flow', { params }),
  getAccountBalance: () => api.get('/v1/reports/account-balance'),
};

// 发票 API
export const invoiceApi = {
  list: (params) => api.get('/v1/invoices', { params }),
  get: (id) => api.get(`/v1/invoices/${id}`),
  create: (data) => api.post('/v1/invoices', data),
  update: (id, data) => api.put(`/v1/invoices/${id}`, data),
  delete: (id) => api.delete(`/v1/invoices/${id}`),
  checkDuplicate: (data) => api.post('/v1/invoices/check', data),
  bindVoucher: (id, voucherId) => api.post(`/v1/invoices/${id}/bind-voucher`, { voucherId }),
  ocrRecognize: (imageUrl) => api.post('/v1/invoices/ocr/recognize', { imageUrl }),
};

// 税务 API
export const taxApi = {
  calculateVat: (data) => api.post('/v1/tax/vat/calculate', data),
  calculateIncomeTax: (data) => api.post('/v1/tax/income-tax/calculate', data),
  getRecords: (params) => api.get('/v1/tax/records', { params }),
  getDeclaration: (year, month) => api.get(`/v1/tax/declaration/${year}/${month}`),
};

// 期间 API
export const periodApi = {
  list: (params) => api.get('/v1/periods', { params }),
  getCurrent: () => api.get('/v1/periods/current'),
  close: (year, month, userId) => api.post(`/v1/periods/${year}/${month}/close`, { userId }),
  unclose: (year, month, userId) => api.post(`/v1/periods/${year}/${month}/unclose`, { userId }),
  closeYear: (year, userId) => api.post(`/v1/periods/${year}/close-year`, { userId }),
};

// 期末处理 API
export const periodEndApi = {
  getJobs: (params) => api.get('/v1/period-end/jobs', { params }),
  getTypes: () => api.get('/v1/period-end/types'),
  transferIncome: (data) => api.post('/v1/period-end/transfer-income', data),
  transferCost: (data) => api.post('/v1/period-end/transfer-cost', data),
  transferFee: (data) => api.post('/v1/period-end/transfer-fee', data),
  transferAll: (data) => api.post('/v1/period-end/transfer-all', data),
};

// 用户 API
export const userApi = {
  list: () => api.get('/v1/users'),
  get: (id) => api.get(`/v1/users/${id}`),
  create: (data) => api.post('/v1/users', data),
  update: (id, data) => api.put(`/v1/users/${id}`, data),
  delete: (id) => api.delete(`/v1/users/${id}`),
};

// 备份 API
export const backupApi = {
  list: () => api.get('/v1/backups'),
  create: () => api.post('/v1/backups'),
  download: (id) => api.get(`/v1/backups/${id}/download`),
  delete: (id) => api.delete(`/v1/backups/${id}`),
};

// 账套 API
export const tenantApi = {
  list: () => api.get('/v1/tenants'),
  get: (id) => api.get(`/v1/tenants/${id}`),
  create: (data) => api.post('/v1/tenants', data),
  update: (id, data) => api.put(`/v1/tenants/${id}`, data),
  delete: (id) => api.delete(`/v1/tenants/${id}`),
};

// 凭证字 API
export const voucherWordApi = {
  list: (params) => api.get('/v1/voucher-words', { params }),
  get: (id) => api.get(`/v1/voucher-words/${id}`),
  create: (data) => api.post('/v1/voucher-words', data),
  update: (id, data) => api.put(`/v1/voucher-words/${id}`, data),
  delete: (id) => api.delete(`/v1/voucher-words/${id}`),
  setDefault: (id, params) => api.put(`/v1/voucher-words/${id}/set-default`, {}, { params }),
  init: (params) => api.post('/v1/voucher-words/init', {}, { params }),
};

// 首页概览 API
export const summaryApi = {
  getDashboard: (params) => api.get('/v1/summary/dashboard', { params }),
  getPendingItems: () => api.get('/v1/summary/pending-items'),
  getRecentActivities: (params) => api.get('/v1/summary/recent-activities', { params }),
};

// 系统设置 API
export const systemApi = {
  getSettings: () => api.get('/v1/system/settings'),
  updateSettings: (data) => api.put('/v1/system/settings', data),
  getInfo: () => api.get('/v1/system/info'),
  healthCheck: () => api.get('/v1/system/health'),
};

// 科目初始化 API
export const accountInitApi = {
  init: (year) => api.post(`/v1/account-books/accounts/init?year=${year}`),
  getAccounts: (year) => api.get(`/v1/account-books/accounts?year=${year}`),
  getOpeningBalances: (year) => api.get(`/v1/account-books/opening-balances?year=${year}`),
  setOpeningBalance: (data) => api.post('/v1/account-books/opening-balances', data),
  deleteOpeningBalance: (id) => api.delete(`/v1/account-books/opening-balances/${id}`),
  getAuxTypes: () => api.get('/v1/account-books/aux-types'),
  createAuxType: (data) => api.post('/v1/account-books/aux-types', data),
  getAuxItems: (auxTypeCode) => api.get(`/v1/account-books/aux-items?auxTypeCode=${auxTypeCode}`),
  createAuxItem: (data) => api.post('/v1/account-books/aux-items', data),
};