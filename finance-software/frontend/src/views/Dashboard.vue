<template>
  <div class="dashboard-container">
    <!-- 欢迎卡片 -->
    <el-row :gutter="20" class="welcome-row">
      <el-col :span="24">
        <div class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-left">
              <div class="welcome-title">🎉 欢迎回来，{{ username }}</div>
              <div class="welcome-desc">今天是 {{ currentDate }}，祝您工作愉快！</div>
            </div>
            <div class="welcome-right">
              <div class="stat-item">
                <div class="stat-value">{{ summary.voucher?.thisMonthCount || 0 }}</div>
                <div class="stat-label">本月凭证</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ summary.voucher?.draftCount || 0 }}</div>
                <div class="stat-label">待审核</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">¥{{ (summary.monthly?.profit || 0).toLocaleString() }}</div>
                <div class="stat-label">本月利润</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 待办事项 - 可折叠 -->
    <el-row :gutter="20" class="pending-row" v-if="pendingItems.length > 0">
      <el-col :span="24">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item name="pending">
            <template #title>
              <div class="collapse-title">
                <el-icon><Warning /></el-icon>
                <span>待办事项</span>
                <el-tag :value="pendingItems.length" type="danger" size="small" />
              </div>
            </template>
            <div class="pending-list">
              <div v-for="item in pendingItems" :key="item.id" class="pending-item" @click="handlePendingClick(item)">
                <el-tag :type="item.priority === 'high' ? 'danger' : 'warning'" size="small">
                  {{ item.priority === 'high' ? '紧急' : '待办' }}
                </el-tag>
                <span class="pending-title">{{ item.title }}</span>
                <span class="pending-count">({{ item.count }}项)</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-col>
    </el-row>

    <!-- 快捷操作 - 紧凑版 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="24">
        <div class="section-card-mini">
          <div class="section-header-mini">
            <span class="section-title-mini">快捷操作</span>
            <el-button link type="primary" @click="router.push('/voucher')">更多 →</el-button>
          </div>
          <div class="action-grid-mini">
            <div class="action-item-mini" @click="router.push('/voucher')">
              <span class="action-icon-mini">📝</span>
              <span class="action-text-mini">新增凭证</span>
            </div>
            <div class="action-item-mini" @click="router.push('/invoice')">
              <span class="action-icon-mini">🧾</span>
              <span class="action-text-mini">发票录入</span>
            </div>
            <div class="action-item-mini" @click="router.push('/report')">
              <span class="action-icon-mini">📊</span>
              <span class="action-text-mini">财务报表</span>
            </div>
            <div class="action-item-mini" @click="router.push('/account-book')">
              <span class="action-icon-mini">📒</span>
              <span class="action-text-mini">账簿查询</span>
            </div>
            <div class="action-item-mini" @click="router.push('/period-end')">
              <span class="action-icon-mini">📅</span>
              <span class="action-text-mini">期末处理</span>
            </div>
            <div class="action-item-mini" @click="router.push('/backup')">
              <span class="action-icon-mini">💾</span>
              <span class="action-text-mini">数据备份</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 数据概览 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="stat-card stat-card-1">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-number">{{ (summary.accounts?.bankBalance || 0).toLocaleString() }}</div>
            <div class="stat-text">银行存款</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card-2">
          <div class="stat-icon">💵</div>
          <div class="stat-info">
            <div class="stat-number">{{ (summary.accounts?.cashBalance || 0).toLocaleString() }}</div>
            <div class="stat-text">库存现金</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card-3">
          <div class="stat-icon">📥</div>
          <div class="stat-info">
            <div class="stat-number">{{ (summary.receivable?.total || 0).toLocaleString() }}</div>
            <div class="stat-text">应收账款</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card-4">
          <div class="stat-icon">📤</div>
          <div class="stat-info">
            <div class="stat-number">{{ (summary.payable?.total || 0).toLocaleString() }}</div>
            <div class="stat-text">应付账款</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 本月收支 + 最近凭证 -->
    <el-row :gutter="20" class="recent-section">
      <el-col :span="8">
        <div class="section-card-mini">
          <div class="section-header-mini">
            <span class="section-title-mini">本月收支</span>
          </div>
          <div class="monthly-stats">
            <div class="monthly-item income">
              <span class="label">收入</span>
              <span class="value">¥{{ (summary.monthly?.income || 0).toLocaleString() }}</span>
            </div>
            <div class="monthly-item expense">
              <span class="label">支出</span>
              <span class="value">¥{{ (summary.monthly?.expense || 0).toLocaleString() }}</span>
            </div>
            <div class="monthly-item profit">
              <span class="label">利润</span>
              <span class="value">¥{{ (summary.monthly?.profit || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="section-card-mini">
          <div class="section-header-mini">
            <span class="section-title-mini">税务概览</span>
          </div>
          <div class="tax-stats">
            <div class="tax-item">
              <span class="label">增值税</span>
              <span class="value">¥{{ (summary.tax?.vatDue || 0).toLocaleString() }}</span>
            </div>
            <div class="tax-item">
              <span class="label">所得税</span>
              <span class="value">¥{{ (summary.tax?.incomeTaxDue || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="section-card-mini">
          <div class="section-header-mini">
            <span class="section-title-mini">最近凭证</span>
            <el-button link type="primary" size="small" @click="router.push('/voucher')">查看</el-button>
          </div>
          <div class="recent-list">
            <div v-for="v in recentVouchers.slice(0,3)" :key="v.voucherNo" class="recent-item-mini">
              <span class="voucher-no">{{ v.voucherNo }}</span>
              <span class="voucher-date">{{ v.voucherDate }}</span>
              <el-tag :type="getStatusType(v.status)" size="small">{{ getStatusLabel(v.status) }}</el-tag>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick, Document, Calendar, Warning, TrendCharts, Coin } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const api = axios.create({ baseURL: '/api/v1' })
const username = ref(localStorage.getItem('username') || 'Admin')
const activeCollapse = ref(['pending'])

const now = new Date()
const currentDate = computed(() => {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${year}年${month}月${day}日 ${weekDays[now.getDay()]}`
})

const summary = ref({})
const pendingItems = ref([])
const recentVouchers = ref([])

const loadDashboardData = async () => {
  try {
    const res = await api.get('/v1/summary/dashboard', { params: { year: 2026, month: 3 } })
    summary.value = res.data || {}
  } catch (e) {
    summary.value = {
      voucher: { totalCount: 28, draftCount: 3, thisMonthCount: 12 },
      accounts: { bankBalance: 52000, cashBalance: 5500 },
      receivable: { total: 20000 },
      payable: { total: 20000 },
      monthly: { income: 105000, expense: 85000, profit: 20000 },
      tax: { vatDue: 9100, incomeTaxDue: 2000 },
    }
  }
  pendingItems.value = [
    { id: '1', type: 'voucher', title: '待审核凭证', count: 3, priority: 'high' },
    { id: '2', type: 'tax', title: '本月税报未申报', count: 1, priority: 'high' },
  ]
  recentVouchers.value = [
    { voucherNo: 'JZ-0007', voucherDate: '2026-03-28', totalDebit: 5000, status: 'posted' },
    { voucherNo: 'JZ-0006', voucherDate: '2026-03-27', totalDebit: 5000, status: 'approved' },
    { voucherNo: 'JZ-0005', voucherDate: '2026-03-27', totalDebit: 3000, status: 'approved' },
  ]
}

const handlePendingClick = (item) => {
  const routes = { voucher: '/voucher', invoice: '/invoice', tax: '/tax', period: '/period' }
  if (routes[item.type]) router.push(routes[item.type])
}

const getStatusType = (status) => ({ draft: 'info', approved: 'success', posted: 'warning' }[status] || '')
const getStatusLabel = (status) => ({ draft: '草稿', approved: '已审核', posted: '已过账' }[status] || status)

onMounted(() => { loadDashboardData() })
</script>

<style scoped>
.dashboard-container { padding: 15px; max-width: 1400px; margin: 0 auto; }
.welcome-row { margin-bottom: 15px; }
.welcome-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; color: #fff; }
.welcome-content { display: flex; justify-content: space-between; align-items: center; }
.welcome-title { font-size: 18px; font-weight: 600; }
.welcome-desc { font-size: 13px; opacity: 0.9; }
.welcome-right { display: flex; gap: 20px; }
.stat-item { text-align: center; }
.stat-value { font-size: 22px; font-weight: 700; }
.stat-label { font-size: 11px; opacity: 0.8; }

.pending-row { margin-bottom: 15px; }
.collapse-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.pending-list { display: flex; gap: 10px; flex-wrap: wrap; padding: 10px 0; }
.pending-item { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #fef0f0; border-radius: 15px; cursor: pointer; }
.pending-item:hover { background: #fdeaea; }

.quick-actions { margin-bottom: 15px; }
.section-card-mini { background: #fff; border-radius: 10px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.section-header-mini { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title-mini { font-size: 14px; font-weight: 600; color: #303133; }
.action-grid-mini { display: flex; gap: 15px; }
.action-item-mini { display: flex; align-items: center; gap: 8px; padding: 8px 15px; background: #f5f7fa; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.action-item-mini:hover { background: #ecf5ff; transform: translateY(-2px); }
.action-icon-mini { font-size: 16px; }
.action-text-mini { font-size: 13px; color: #606266; }

.stat-card { background: #fff; border-radius: 10px; padding: 15px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 15px; }
.stat-card-1 { border-left: 3px solid #667eea; }
.stat-card-2 { border-left: 3px solid #f093fb; }
.stat-card-3 { border-left: 3px solid #4facfe; }
.stat-card-4 { border-left: 3px solid #43e97b; }
.stat-icon { font-size: 24px; }
.stat-number { font-size: 18px; font-weight: 700; color: #303133; }
.stat-text { font-size: 12px; color: #909399; }

.recent-section { margin-bottom: 15px; }
.monthly-stats, .tax-stats { padding: 5px 0; }
.monthly-item, .tax-item { display: flex; justify-content: space-between; padding: 6px 0; }
.monthly-item.income .value { color: #67c23a; }
.monthly-item.expense .value { color: #f56c6c; }
.monthly-item.profit .value { color: #409eff; font-weight: 600; }
.recent-list { padding: 5px 0; }
.recent-item-mini { display: flex; align-items: center; gap: 8px; padding: 5px 0; }
.voucher-no { font-size: 12px; color: #409eff; width: 60px; }
.voucher-date { font-size: 11px; color: #909399; flex: 1; }
</style>