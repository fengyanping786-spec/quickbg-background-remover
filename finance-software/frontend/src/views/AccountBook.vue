<template>
  <div class="account-book-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>账簿查询</span>
        </div>
      </template>

      <!-- 账簿类型切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="明细账" name="detail" />
        <el-tab-pane label="总账" name="general" />
        <el-tab-pane label="日记账" name="cash" />
        <el-tab-pane label="科目余额表" name="balance" />
      </el-tabs>

      <!-- 查询条件 -->
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="会计年度">
          <el-select v-model="queryForm.year" placeholder="选择年度">
            <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="月份" v-if="activeTab === 'general' || activeTab === 'balance'">
          <el-select v-model="queryForm.month" placeholder="选择月份">
            <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
          </el-select>
        </el-form-item>

        <el-form-item label="科目" v-if="activeTab !== 'balance'">
          <el-select v-model="queryForm.accountCode" placeholder="选择科目" filterable clearable>
            <el-option
              v-for="acc in accounts"
              :key="acc.code"
              :label="`${acc.code} - ${acc.name}`"
              :value="acc.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="开始日期" v-if="activeTab === 'detail' || activeTab === 'cash'">
          <el-date-picker v-model="queryForm.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
        </el-form-item>

        <el-form-item label="结束日期" v-if="activeTab === 'detail' || activeTab === 'cash'">
          <el-date-picker v-model="queryForm.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <!-- 明细账表格 -->
      <el-table v-if="activeTab === 'detail'" :data="detailData" border stripe height="500">
        <el-table-column prop="voucherNo" label="凭证号" width="100" />
        <el-table-column prop="voucherDate" label="日期" width="100" />
        <el-table-column prop="lineNo" label="行号" width="60" />
        <el-table-column prop="description" label="摘要" min-width="150" />
        <el-table-column prop="accountCode" label="科目编码" width="100" />
        <el-table-column prop="accountName" label="科目名称" width="120" />
        <el-table-column label="借方" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.direction === 'debit' && row.amount != null">{{ Number(row.amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="贷方" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.direction === 'credit' && row.amount != null">{{ Number(row.amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120" align="right" />
      </el-table>

      <!-- 总账表格 -->
      <el-table v-if="activeTab === 'general'" :data="generalData" border stripe height="500">
        <el-table-column prop="accountCode" label="科目编码" width="100" />
        <el-table-column prop="accountName" label="科目名称" width="150" />
        <el-table-column prop="direction" label="方向" width="60">
          <template #default="{ row }">
            {{ row.direction === 'debit' ? '借' : '贷' }}
          </template>
        </el-table-column>
        <el-table-column prop="openingBalance" label="期初余额" width="120" align="right" />
        <el-table-column prop="debitAmount" label="借方发生额" width="120" align="right" />
        <el-table-column prop="creditAmount" label="贷方发生额" width="120" align="right" />
        <el-table-column prop="closingBalance" label="期末余额" width="120" align="right" />
      </el-table>

      <!-- 日记账表格 -->
      <el-table v-if="activeTab === 'cash'" :data="cashData" border stripe height="500">
        <el-table-column prop="voucherNo" label="凭证号" width="100" />
        <el-table-column prop="voucherDate" label="日期" width="100" />
        <el-table-column prop="description" label="摘要" min-width="180" />
        <el-table-column prop="accountCode" label="科目编码" width="100" />
        <el-table-column prop="accountName" label="科目名称" width="120" />
        <el-table-column label="收入" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.direction === 'debit' && row.amount != null">{{ Number(row.amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支出" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.direction === 'credit' && row.amount != null">{{ Number(row.amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120" align="right" />
      </el-table>

      <!-- 科目余额表 -->
      <el-table v-if="activeTab === 'balance'" :data="balanceData" border stripe height="500">
        <el-table-column prop="accountCode" label="科目编码" width="100" />
        <el-table-column prop="accountName" label="科目名称" min-width="150" />
        <el-table-column prop="level" label="级次" width="60" />
        <el-table-column prop="direction" label="方向" width="60">
          <template #default="{ row }">
            {{ row.direction === 'debit' ? '借' : '贷' }}
          </template>
        </el-table-column>
        <el-table-column prop="openingBalance" label="期初余额" width="120" align="right" />
        <el-table-column prop="debitAmount" label="借方发生" width="120" align="right" />
        <el-table-column prop="creditAmount" label="贷方发生" width="120" align="right" />
        <el-table-column prop="closingBalance" label="期末余额" width="120" align="right" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination" v-if="activeTab !== 'general' && activeTab !== 'balance'">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[50, 100, 200]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// 账簿类型
const activeTab = ref('detail')

// 查询表单
const queryForm = reactive({
  year: 2026,
  month: new Date().getMonth() + 1,
  accountCode: '',
  startDate: '',
  endDate: '',
})

// 年度选择
const years = [2026, 2025, 2024]

// 科目列表
const accounts = ref([
  { code: '1001', name: '银行存款' },
  { code: '1002', name: '库存现金' },
  { code: '1122', name: '应收账款' },
  { code: '1403', name: '原材料' },
  { code: '2202', name: '应付账款' },
  { code: '4001', name: '实收资本' },
  { code: '4103', name: '本年利润' },
  { code: '5001', name: '主营业务收入' },
  { code: '6001', name: '主营业务成本' },
])

// 数据
const detailData = ref([])
const generalData = ref([])
const cashData = ref([])
const balanceData = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
})

// 切换标签页
const handleTabChange = (tab) => {
  activeTab.value = tab
  handleQuery()
}

// 查询
const handleQuery = async () => {
  try {
    if (activeTab.value === 'detail') {
      const { data } = await api.get('/v1/account-books/detail', { params: queryForm })
      detailData.value = data.data || []
      pagination.total = data.total || 0
    } else if (activeTab.value === 'general') {
      const { data } = await api.get('/v1/account-books/general', { params: queryForm })
      generalData.value = data || []
    } else if (activeTab.value === 'cash') {
      const { data } = await api.get('/v1/account-books/cash', { params: queryForm })
      cashData.value = data.data || []
      pagination.total = data.total || 0
    } else if (activeTab.value === 'balance') {
      const { data } = await api.get('/v1/account-books/balance', { params: queryForm })
      balanceData.value = data || []
    }
  } catch (e) {
    // Mock 数据
    loadMockData()
  }
}

// 加载模拟数据
const loadMockData = () => {
  if (activeTab.value === 'detail') {
    detailData.value = [
      { voucherNo: 'JZ-0001', voucherDate: '2026-03-15', lineNo: 1, description: '收到货款', accountCode: '1122', accountName: '应收账款', direction: 'debit', amount: 10000, balance: 10000 },
      { voucherNo: 'JZ-0001', voucherDate: '2026-03-15', lineNo: 2, description: '收到货款', accountCode: '1001', accountName: '银行存款', direction: 'debit', amount: 10000, balance: 10000 },
      { voucherNo: 'JZ-0002', voucherDate: '2026-03-16', lineNo: 1, description: '采购原材料', accountCode: '1403', accountName: '原材料', direction: 'debit', amount: 5000, balance: 5000 },
    ]
    pagination.total = 3
  } else if (activeTab.value === 'general') {
    generalData.value = [
      { accountCode: '1001', accountName: '银行存款', direction: 'debit', openingBalance: 50000, debitAmount: 10000, creditAmount: 8000, closingBalance: 52000 },
      { accountCode: '1002', accountName: '库存现金', direction: 'debit', openingBalance: 2000, debitAmount: 0, creditAmount: 1500, closingBalance: 500 },
      { accountCode: '1122', accountName: '应收账款', direction: 'debit', openingBalance: 30000, debitAmount: 10000, creditAmount: 20000, closingBalance: 20000 },
    ]
  } else if (activeTab.value === 'cash') {
    cashData.value = [
      { voucherNo: 'JZ-0001', voucherDate: '2026-03-15', description: '收到货款', accountCode: '1001', accountName: '银行存款', direction: 'debit', amount: 10000, balance: 60000 },
      { voucherNo: 'JZ-0003', voucherDate: '2026-03-18', description: '支付工资', accountCode: '1001', accountName: '银行存款', direction: 'credit', amount: 15000, balance: 45000 },
    ]
    pagination.total = 2
  } else if (activeTab.value === 'balance') {
    balanceData.value = [
      { accountCode: '1', accountName: '资产', level: 1, direction: 'debit', openingBalance: 92000, debitAmount: 25000, creditAmount: 27500, closingBalance: 89500 },
      { accountCode: '1001', accountName: '银行存款', level: 3, direction: 'debit', openingBalance: 50000, debitAmount: 10000, creditAmount: 8000, closingBalance: 52000 },
      { accountCode: '1002', accountName: '库存现金', level: 3, direction: 'debit', openingBalance: 2000, debitAmount: 5000, creditAmount: 1500, closingBalance: 5500 },
    ]
  }
}

// 重置
const handleReset = () => {
  queryForm.accountCode = ''
  queryForm.startDate = ''
  queryForm.endDate = ''
  handleQuery()
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.account-book-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.query-form { margin-bottom: 20px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>