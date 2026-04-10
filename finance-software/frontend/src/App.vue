<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container" v-if="isLoggedIn">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="logo">
          <div class="logo-icon">💰</div>
          <div class="logo-text">
            <span class="logo-title">财务系统</span>
            <span class="logo-subtitle">Finance</span>
          </div>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          class="sidebar-menu"
          background-color="linear-gradient(180deg, #1a1f2e 0%, #252b3b 100%)"
          text-color="#8b9dc3"
          active-text-color="#fff"
        >
          <el-menu-item index="/dashboard" class="menu-item">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          
          <div class="menu-group-title">会计核算</div>
          <el-menu-item index="/voucher" class="menu-item">
            <el-icon><Document /></el-icon>
            <span>凭证管理</span>
          </el-menu-item>
          <el-menu-item index="/account-book" class="menu-item">
            <el-icon><Notebook /></el-icon>
            <span>账簿查询</span>
          </el-menu-item>
          <el-menu-item index="/account-init" class="menu-item">
            <el-icon><Setting /></el-icon>
            <span>科目初始化</span>
          </el-menu-item>
          
          <div class="menu-group-title">期间处理</div>
          <el-menu-item index="/period" class="menu-item">
            <el-icon><Calendar /></el-icon>
            <span>会计期间</span>
          </el-menu-item>
          <el-menu-item index="/period-end" class="menu-item">
            <el-icon><TrendCharts /></el-icon>
            <span>期末处理</span>
          </el-menu-item>
          
          <div class="menu-group-title">报表中心</div>
          <el-menu-item index="/report" class="menu-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>财务报表</span>
          </el-menu-item>
          
          <div class="menu-group-title">业务管理</div>
          <el-menu-item index="/invoice" class="menu-item">
            <el-icon><Ticket /></el-icon>
            <span>发票管理</span>
          </el-menu-item>
          <el-menu-item index="/tax" class="menu-item">
            <el-icon><Coin /></el-icon>
            <span>税务管理</span>
          </el-menu-item>
          <el-menu-item index="/account" class="menu-item">
            <el-icon><Wallet /></el-icon>
            <span>账户管理</span>
          </el-menu-item>
          
          <div class="menu-group-title">系统管理</div>
          <el-menu-item index="/tenant" class="menu-item">
            <el-icon><Office /></el-icon>
            <span>账套管理</span>
          </el-menu-item>
          <el-menu-item index="/voucher-word" class="menu-item">
            <el-icon><Document /></el-icon>
            <span>凭证字管理</span>
          </el-menu-item>
          <el-menu-item index="/system" class="menu-item">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
          <el-menu-item index="/user" class="menu-item">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/backup" class="menu-item">
            <el-icon><Box /></el-icon>
            <span>数据备份</span>
          </el-menu-item>
        </el-menu>
      </aside>
      
      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 顶部导航 -->
        <header class="header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>{{ currentModule }}</el-breadcrumb-item>
              <el-breadcrumb-item class="current-page">{{ currentPage }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <!-- 账套和年度选择 -->
            <div class="tenant-selector" v-if="tenants.length > 0">
              <el-select v-model="currentTenantId" placeholder="选择账套" size="small" @change="handleTenantChange" style="width: 150px">
                <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
              <el-select v-model="currentYear" placeholder="年度" size="small" @change="handleYearChange" style="width: 90px; margin-left: 8px">
                <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
              </el-select>
            </div>
            <div class="header-time">
              <el-icon><Clock /></el-icon>
              <span>{{ currentTime }}</span>
            </div>
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <div class="user-avatar">{{ username.charAt(0) }}</div>
                <span class="user-name">{{ username }}</span>
                <el-icon class="arrow"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="user-dropdown">
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>设置
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </header>
        
        <!-- 页面内容 -->
        <div class="page-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>
    
    <!-- 未登录时显示登录页 -->
    <router-view v-else />
  </el-config-provider>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { House, Document, Notebook, Calendar, TrendCharts, DataAnalysis, Ticket, Coin, Wallet, School, User, Box, Clock, ArrowDown, Setting, SwitchButton, OfficeBuilding } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 检查登录状态
const token = localStorage.getItem('token')
const isLoggedIn = ref(!!token)
const username = ref(localStorage.getItem('username') || 'Admin')

// 当前时间
const currentTime = ref('')
let timer = null

const updateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  currentTime.value = `${year}-${month}-${day} ${hour}:${minute}`
}

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 菜单模块映射
const menuModules = {
  '/dashboard': '首页',
  '/voucher': '会计核算',
  '/account-book': '会计核算',
  '/account-init': '会计核算',
  '/period': '期间处理',
  '/period-end': '期间处理',
  '/report': '报表中心',
  '/invoice': '业务管理',
  '/tax': '业务管理',
  '/account': '业务管理',
  '/tenant': '系统管理',
  '/voucher-word': '系统管理',
  '/system': '系统管理',
  '/user': '系统管理',
  '/backup': '系统管理',
}

const currentModule = computed(() => menuModules[route.path] || '首页')
const currentPage = computed(() => route.meta.title || '')

// 账套选择相关
const tenants = ref([])
const currentTenantId = ref('')
const currentYear = ref(new Date().getFullYear())
const years = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1, y + 2]
})

// 加载账套列表
const loadTenants = async () => {
  try {
    const res = await api.get('/tenants')
    tenants.value = res || []
    // 如果没有选过账套，默认选中第一个
    const savedTenantId = localStorage.getItem('currentTenantId')
    if (!savedTenantId && tenants.value.length > 0) {
      currentTenantId.value = tenants.value[0].id
      localStorage.setItem('currentTenantId', currentTenantId.value)
    } else if (savedTenantId) {
      currentTenantId.value = savedTenantId
    }
  } catch (e) {
    // 模拟数据
    tenants.value = [
      { id: 'default', name: '默认账套' }
    ]
  }
}

// 切换账套
const handleTenantChange = (val) => {
  currentTenantId.value = val
  localStorage.setItem('currentTenantId', val)
  // 刷新当前页面数据
  window.location.reload()
}

// 切换年度
const handleYearChange = (val) => {
  currentYear.value = val
  localStorage.setItem('currentYear', val)
  // 刷新当前页面数据
  window.location.reload()
}

// 退出登录
const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('username')
    isLoggedIn.value = false
    router.push('/login')
  } else if (command === 'profile') {
    // TODO: 跳转到个人中心
  }
}

// 监听路由变化，更新登录状态
watch(() => route.path, () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
})

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 60000)
  loadTenants()
  
  // 读取已保存的年度
  const savedYear = localStorage.getItem('currentYear')
  if (savedYear) {
    currentYear.value = parseInt(savedYear)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

#app {
  height: 100vh;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 容器 */
.app-container {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1a1f2e 0%, #252b3b 100%);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.logo {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 28px;
  margin-right: 12px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.logo-subtitle {
  color: #6b7a99;
  font-size: 10px;
  letter-spacing: 2px;
}

.sidebar-menu {
  border-right: none;
  background: transparent !important;
  flex: 1;
  overflow-y: auto;
}

.sidebar-menu .el-menu-item {
  height: 44px;
  line-height: 44px;
  color: #8b9dc3;
  background: transparent;
  border-left: 3px solid transparent;
  margin: 2px 8px;
  border-radius: 6px;
  transition: all 0.3s;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(64, 158, 255, 0.1) !important;
  color: #fff;
}

.sidebar-menu .el-menu-item.is-active {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.2) 0%, transparent 100%) !important;
  color: #fff;
  border-left: 3px solid #409eff;
}

.sidebar-menu .el-menu-item .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.menu-group-title {
  padding: 16px 20px 8px;
  color: #4a5569;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航 */
.header {
  height: 60px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 10;
}

.header-left .el-breadcrumb {
  font-size: 14px;
}

.header-left .el-breadcrumb__item:last-child .el-breadcrumb__inner {
  color: #303133;
  font-weight: 500;
}

.header-left .current-page {
  color: #409eff !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.tenant-selector {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  background: #f0f2f5;
  border-radius: 6px;
}

.header-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.user-name {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.arrow {
  color: #909399;
  font-size: 12px;
}

/* 用户下拉菜单 */
.user-dropdown .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}

.user-dropdown .el-dropdown-menu__item .el-icon {
  font-size: 16px;
}

/* 页面内容 */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>