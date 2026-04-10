import { createRouter, createWebHistory } from 'vue-router'
import { authApi } from '@/api'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('@/views/Account.vue'),
    meta: { title: '账户管理' }
  },
  {
    path: '/voucher',
    name: 'Voucher',
    component: () => import('@/views/Voucher.vue'),
    meta: { title: '凭证管理' }
  },
  {
    path: '/account-book',
    name: 'AccountBook',
    component: () => import('@/views/AccountBook.vue'),
    meta: { title: '账簿查询' }
  },
  {
    path: '/period',
    name: 'Period',
    component: () => import('@/views/Period.vue'),
    meta: { title: '会计期间' }
  },
  {
    path: '/period-end',
    name: 'PeriodEnd',
    component: () => import('@/views/PeriodEnd.vue'),
    meta: { title: '期末处理' }
  },
  {
    path: '/account-init',
    name: 'AccountInit',
    component: () => import('@/views/AccountInit.vue'),
    meta: { title: '科目初始化' }
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/views/Report.vue'),
    meta: { title: '财务报表' }
  },
  {
    path: '/invoice',
    name: 'Invoice',
    component: () => import('@/views/Invoice.vue'),
    meta: { title: '发票管理' }
  },
  {
    path: '/tax',
    name: 'Tax',
    component: () => import('@/views/Tax.vue'),
    meta: { title: '税务管理' }
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/User.vue'),
    meta: { title: '用户管理' }
  },
  {
    path: '/backup',
    name: 'Backup',
    component: () => import('@/views/Backup.vue'),
    meta: { title: '数据备份' }
  },
  {
    path: '/tenant',
    name: 'Tenant',
    component: () => import('@/views/Tenant.vue'),
    meta: { title: '账套管理' }
  },
  {
    path: '/voucher-word',
    name: 'VoucherWord',
    component: () => import('@/views/VoucherWord.vue'),
    meta: { title: '凭证字管理' }
  },
  {
    path: '/system',
    name: 'System',
    component: () => import('@/views/System.vue'),
    meta: { title: '系统设置' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '财务系统'} - 小微企业财务系统`

  // 公开页面直接通过
  if (to.meta.public) {
    next()
    return
  }

  // 检查登录状态
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  if (!token || !user) {
    // 未登录，跳转到登录页
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 验证 Token 有效性（可选：每次路由跳转都验证）
  try {
    // 简单验证：有 token 就可以通过，实际项目可以调用验证接口
    next()
  } catch (error) {
    // Token 失效
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    next({ name: 'Login', query: { redirect: to.fullPath } })
  }
})

export default router