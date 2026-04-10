<template>
  <div class="report-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>财务报表</span>
          <el-button-group>
            <el-button type="primary" @click="exportReport('excel')">导出Excel</el-button>
            <el-button @click="exportReport('csv')">导出CSV</el-button>
          </el-button-group>
        </div>
      </template>

      <!-- 选择报表类型和时间 -->
      <el-form :inline="true" class="report-form">
        <el-form-item label="报表类型">
          <el-select v-model="reportType" @change="loadReport">
            <el-option label="资产负债表" value="balance-sheet" />
            <el-option label="利润表" value="profit-statement" />
            <el-option label="现金流量表" value="cash-flow" />
            <el-option label="科目余额表" value="account-balance" />
          </el-select>
        </el-form-item>
        <el-form-item label="年份">
          <el-select v-model="year" @change="loadReport">
            <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份" v-if="reportType !== 'account-balance'">
          <el-select v-model="month" @change="loadReport">
            <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="对比期">
          <el-select v-model="compareYear" @change="loadCompareReport" placeholder="选择对比期" clearable>
            <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 资产负债表 -->
      <div v-if="reportType === 'balance-sheet'">
        <h3 class="report-title">资产负债表</h3>
        <p class="report-subtitle">{{ year }}年{{ month }}月</p>
        <div class="report-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <h4 class="table-title">资产</h4>
              <el-table :data="balanceData.assets || []" border size="small">
                <el-table-column prop="name" label="项目" />
                <el-table-column prop="balance" label="金额" align="right">
                  <template #default="{ row }">
                    {{ formatMoney(row.balance) }}
                  </template>
                </el-table-column>
              </el-table>
            </el-col>
            <el-col :span="12">
              <h4 class="table-title">负债和所有者权益</h4>
              <el-table :data="[...balanceData.liabilities || [], ...balanceData.equity || []]" border size="small">
                <el-table-column prop="name" label="项目" />
                <el-table-column prop="balance" label="金额" align="right">
                  <template #default="{ row }">
                    {{ formatMoney(row.balance) }}
                  </template>
                </el-table-column>
              </el-table>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 利润表 -->
      <div v-if="reportType === 'profit-statement'">
        <h3 class="report-title">利润表</h3>
        <p class="report-subtitle">{{ year }}年{{ month }}月</p>
        <el-table :data="profitData.revenue || []" border>
          <el-table-column prop="name" label="项目" />
          <el-table-column prop="amount" label="金额" align="right">
            <template #default="{ row }">
              {{ formatMoney(row.amount) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 现金流量表 -->
      <div v-if="reportType === 'cash-flow'">
        <h3 class="report-title">现金流量表</h3>
        <p class="report-subtitle">{{ year }}年{{ month }}月</p>
        
        <el-table :data="[]" border v-if="!cashFlowData.operating">
          <el-table-column label="项目" prop="name" />
          <el-table-column label="金额" align="right">
            <template #default>
              <span class="text-muted">加载中...</span>
            </template>
          </el-table-column>
        </el-table>

        <div v-else class="cash-flow-content">
          <!-- 经营活动 -->
          <div class="cf-section">
            <h4 class="cf-title">一、经营活动产生的现金流量</h4>
            <el-table :data="cashFlowData.operating.items || []" border size="small">
              <el-table-column prop="name" label="项目" />
              <el-table-column prop="amount" label="金额" align="right">
                <template #default="{ row }">
                  {{ formatMoney(row.amount) }}
                </template>
              </el-table-column>
            </el-table>
            <div class="cf-summary">
              <span>经营活动产生的现金流量净额：</span>
              <span class="amount">{{ formatMoney(cashFlowData.operating.netCash) }}</span>
            </div>
          </div>

          <!-- 投资活动 -->
          <div class="cf-section">
            <h4 class="cf-title">二、投资活动产生的现金流量</h4>
            <el-table :data="cashFlowData.investing.items || []" border size="small">
              <el-table-column prop="name" label="项目" />
              <el-table-column prop="amount" label="金额" align="right">
                <template #default="{ row }">
                  {{ formatMoney(row.amount) }}
                </template>
              </el-table-column>
            </el-table>
            <div class="cf-summary">
              <span>投资活动产生的现金流量净额：</span>
              <span class="amount">{{ formatMoney(cashFlowData.investing.netCash) }}</span>
            </div>
          </div>

          <!-- 筹资活动 -->
          <div class="cf-section">
            <h4 class="cf-title">三、筹资活动产生的现金流量</h4>
            <el-table :data="cashFlowData.financing.items || []" border size="small">
              <el-table-column prop="name" label="项目" />
              <el-table-column prop="amount" label="金额" align="right">
                <template #default>
                  -
                </template>
              </el-table-column>
            </el-table>
            <div class="cf-summary">
              <span>筹资活动产生的现金流量净额：</span>
              <span class="amount">{{ formatMoney(cashFlowData.financing.netCash) }}</span>
            </div>
          </div>

          <!-- 合计 -->
          <div class="cf-total">
            <div class="cf-total-item">
              <span>期初现金余额：</span>
              <span>{{ formatMoney(cashFlowData.beginningCash) }}</span>
            </div>
            <div class="cf-total-item">
              <span>期末现金余额：</span>
              <span>{{ formatMoney(cashFlowData.endingCash) }}</span>
            </div>
            <div class="cf-total-item">
              <span>现金净增加额：</span>
              <span :class="{ 'text-red': cashFlowData.netChange < 0 }">
                {{ formatMoney(cashFlowData.netChange) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 科目余额表 -->
      <div v-if="reportType === 'account-balance'">
        <h3 class="report-title">科目余额表</h3>
        <el-table :data="accountBalanceData" border>
          <el-table-column prop="code" label="科目编码" width="100" />
          <el-table-column prop="name" label="科目名称" />
          <el-table-column label="借方余额" align="right">
            <template #default="{ row }">
              {{ row.direction === 'debit' ? formatMoney(Math.abs(row.balance)) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="贷方余额" align="right">
            <template #default="{ row }">
              {{ row.direction === 'credit' ? formatMoney(Math.abs(row.balance)) : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import * as XLSX from 'xlsx'

const api = axios.create({ baseURL: '/api/v1' })

// 查询条件
const reportType = ref('balance-sheet')
const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const years = ref([2026, 2025, 2024])
const compareYear = ref(null)  // 对比年份
const compareData = ref({})  // 对比期数据

// 报表数据
const balanceData = ref({})
const profitData = ref({})
const cashFlowData = ref({})
const accountBalanceData = ref([])

// 格式化金额
const formatMoney = (value) => {
  if (value === null || value === undefined) return '-'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

// 加载对比期报表
const loadCompareReport = async () => {
  if (!compareYear.value) {
    compareData.value = {}
    return
  }
  
  try {
    if (reportType.value === 'balance-sheet') {
      const res = await api.get(`/v1/reports/balance-sheet`, { params: { year: compareYear.value, month: month.value } })
      compareData.value = res.data || {}
    } else if (reportType.value === 'profit-statement') {
      const res = await api.get(`/v1/reports/profit-statement`, { params: { year: compareYear.value, month: month.value } })
      compareData.value = res.data || {}
    } else if (reportType.value === 'cash-flow') {
      const res = await api.get(`/v1/reports/cash-flow`, { params: { year: compareYear.value, month: month.value } })
      compareData.value = res.data || {}
    }
    ElMessage.success('对比数据已加载')
  } catch (e) {
    console.error('加载对比数据失败', e)
    ElMessage.error('加载对比数据失败')
  }
}

// 加载报表
const loadReport = async () => {
  compareData.value = {}  // 清空对比数据
  try {
    if (reportType.value === 'balance-sheet') {
      const res = await api.get(`/v1/reports/balance-sheet`, { params: { year: year.value, month: month.value } })
      balanceData.value = res.data || {}
    } else if (reportType.value === 'profit-statement') {
      const res = await api.get(`/v1/reports/profit-statement`, { params: { year: year.value, month: month.value } })
      profitData.value = res.data || {}
    } else if (reportType.value === 'cash-flow') {
      const res = await api.get(`/v1/reports/cash-flow`, { params: { year: year.value, month: month.value } })
      cashFlowData.value = res.data || {}
    } else {
      const res = await api.get('/v1/reports/account-balance')
      accountBalanceData.value = res.data || []
    }
  } catch (e) {
    // Mock 数据
    if (reportType.value === 'balance-sheet') {
      balanceData.value = {
        assets: [
          { name: '银行存款', balance: 52000 },
          { name: '库存现金', balance: 5500 },
          { name: '应收账款', balance: 20000 },
          { name: '原材料', balance: 12000 },
        ],
        liabilities: [
          { name: '短期借款', balance: 10000 },
          { name: '应付账款', balance: 20000 },
          { name: '应交税费', balance: 5000 },
        ],
        equity: [
          { name: '实收资本', balance: 50000 },
          { name: '本年利润', balance: 34000 },
        ],
      }
    } else if (reportType.value === 'profit-statement') {
      profitData.value = {
        revenue: [
          { name: '主营业务收入', amount: 100000 },
          { name: '其他业务收入', amount: 5000 },
        ],
        cost: [
          { name: '主营业务成本', amount: 60000 },
        ],
      }
    } else if (reportType.value === 'cash-flow') {
      cashFlowData.value = {
        operating: {
          netCash: 17000,
          items: [
            { name: '销售商品、提供劳务收到的现金', amount: 80000 },
            { name: '购买商品、接受劳务支付的现金', amount: 50000 },
            { name: '支付给职工的工资', amount: 15000 },
          ]
        },
        investing: { netCash: -20000, items: [{ name: '购建固定资产', amount: 20000 }] },
        financing: { netCash: 0, items: [] },
        beginningCash: 58000,
        endingCash: 55000,
        netChange: -3000,
      }
    } else {
      accountBalanceData.value = [
        { code: '1001', name: '银行存款', balance: 52000, direction: 'debit' },
        { code: '1002', name: '库存现金', balance: 5500, direction: 'debit' },
        { code: '1122', name: '应收账款', balance: 20000, direction: 'debit' },
      ]
    }
  }
}

// 导出报表
const exportReport = async (format) => {
  try {
    let data = null
    let fileName = ''
    let sheetName = ''
    
    if (reportType.value === 'balance-sheet') {
      // 获取最新数据
      await loadReport()
      data = balanceData.value
      fileName = `资产负债表_${year.value}年${month.value}月`
      sheetName = '资产负债表'
    } else if (reportType.value === 'profit-statement') {
      await loadReport()
      data = profitData.value
      fileName = `利润表_${year.value}年${month.value}月`
      sheetName = '利润表'
    } else if (reportType.value === 'cash-flow') {
      await loadReport()
      data = cashFlowData.value
      fileName = `现金流量表_${year.value}年${month.value}月`
      sheetName = '现金流量表'
    } else {
      await loadReport()
      data = accountBalanceData.value
      fileName = '科目余额表'
      sheetName = '科目余额表'
    }

    // 构建Excel工作簿
    const wb = XLSX.utils.book_new()
    
    if (reportType.value === 'balance-sheet') {
      // 资产负债表：资产、负债、权益三列
      const wsData = [
        [`资产负债表 ${year.value}年${month.value}月`, '', ''],
        ['', '', ''],
        ['资产', '负债和所有者权益', ''],
        ...(data.assets || []).map(item => [item.name, '', item.balance]),
        ['资产合计', '', data.totalAssets],
        ['', '', ''],
        ...(data.liabilities || []).map(item => ['', item.name, item.balance]),
        ['负债合计', '', data.totalLiabilities],
        ['', '', ''],
        ...(data.equity || []).map(item => ['', item.name, item.balance]),
        ['权益合计', '', data.totalEquity],
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    } else if (reportType.value === 'profit-statement') {
      const wsData = [
        [`利润表 ${year.value}年${month.value}月`, ''],
        ['', ''],
        ['项目', '金额'],
        ...(data.revenue || []).map(item => [item.name, item.amount]),
        ...(data.cost || []).map(item => [item.name, item.amount]),
        ...(data.expenses || []).map(item => [item.name, item.amount]),
        ['营业利润', data.operatingProfit || 0],
        ['净利润', data.netProfit || 0],
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    } else if (reportType.value === 'cash-flow') {
      const wsData = [
        [`现金流量表 ${year.value}年${month.value}月`, ''],
        ['', ''],
        ['项目', '金额'],
        ['一、经营活动产生的现金流量', ''],
        ...(data.operating?.items || []).map(item => [item.name, item.amount]),
        ['经营活动产生的现金流量净额', data.operating?.netCash || 0],
        ['', ''],
        ['二、投资活动产生的现金流量', ''],
        ...(data.investing?.items || []).map(item => [item.name, item.amount]),
        ['投资活动产生的现金流量净额', data.investing?.netCash || 0],
        ['', ''],
        ['三、筹资活动产生的现金流量', ''],
        ['筹资活动产生的现金流量净额', data.financing?.netCash || 0],
        ['', ''],
        ['现金净增加额', data.netChange || 0],
        ['期末现金余额', data.endingCash || 0],
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    } else {
      // 科目余额表
      const wsData = [
        ['科目余额表', ''],
        ['', ''],
        ['科目编码', '科目名称', '借方余额', '贷方余额'],
        ...data.map(item => [
          item.code,
          item.name,
          item.direction === 'debit' ? Math.abs(item.balance) : 0,
          item.direction === 'credit' ? Math.abs(item.balance) : 0,
        ])
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }

    // 生成文件并下载
    if (format === 'csv') {
      XLSX.writeFile(wb, `${fileName}.csv`)
    } else {
      XLSX.writeFile(wb, `${fileName}.xlsx`)
    }
    
    ElMessage.success('导出成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped>
.report-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.report-form { margin: 20px 0; }
.report-title { text-align: center; margin: 20px 0 10px; }
.report-subtitle { text-align: center; color: #666; margin-bottom: 20px; }
.table-title { margin: 10px 0; color: #303133; }
.text-muted { color: #909399; }
.text-red { color: #f56c6c; }

/* 现金流量表样式 */
.cash-flow-content { padding: 0 20px; }
.cf-section { margin-bottom: 20px; }
.cf-title { margin: 15px 0 10px; color: #303133; font-size: 14px; }
.cf-summary { margin-top: 10px; padding: 10px; background: #f5f7fa; border-radius: 4px; display: flex; justify-content: space-between; }
.cf-summary .amount { font-weight: 600; color: #409eff; }
.cf-total { margin-top: 20px; padding: 15px; background: #ecf5ff; border-radius: 8px; }
.cf-total-item { display: flex; justify-content: space-between; padding: 5px 0; }
.cf-total-item:last-child { font-weight: 600; font-size: 16px; color: #409eff; }
</style>