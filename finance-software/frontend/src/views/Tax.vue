<template>
  <div class="tax-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>税务管理</span>
          <el-button type="primary" @click="showVatDialog = true">
            <el-icon><Coin /></el-icon>
            计算增值税
          </el-button>
        </div>
      </template>

      <!-- 税务概览 -->
      <el-row :gutter="20" class="tax-overview">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">本月销项税额</div>
            <div class="stat-value">{{ vatData.salesTax.toLocaleString() }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">本月进项税额</div>
            <div class="stat-value">{{ vatData.purchaseTax.toLocaleString() }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">应纳税额</div>
            <div class="stat-value highlight">{{ vatData.vatDue.toLocaleString() }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">税负率</div>
            <div class="stat-value" :class="taxRateClass">{{ vatData.taxRate }}%</div>
            <el-tag v-if="taxWarning.level" :type="taxWarning.level === 'safe' ? 'success' : taxWarning.level === 'low' ? 'warning' : 'danger'" size="small" style="margin-top: 5px">
              {{ taxWarning.message }}
            </el-tag>
          </div>
        </el-col>
      </el-row>

      <!-- 税负预警提示 -->
      <el-alert
        v-if="taxWarning.isWarning"
        :title="taxWarning.message"
        :type="taxWarning.level === 'low' ? 'warning' : 'error'"
        :closable="false"
        style="margin: 15px 0"
      />

      <!-- 申报表预览 -->
      <el-divider content-position="left">本月申报表</el-divider>
      <el-form :inline="true" class="declaration-form">
        <el-form-item label="选择月份">
          <el-select v-model="selectedMonth" @change="loadDeclaration">
            <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 申报表内容 -->
      <el-table :data="declarationData" border size="small">
        <el-table-column prop="item" label="项目" />
        <el-table-column prop="amount" label="金额" align="right" />
        <el-table-column prop="tax" label="税额" align="right" />
      </el-table>

      <!-- 税务记录 -->
      <el-divider content-position="left">税务申报记录</el-divider>
      <el-table :data="taxRecords" border>
        <el-table-column prop="periodStart" label="申报期起" width="120" />
        <el-table-column prop="periodEnd" label="申报期止" width="120" />
        <el-table-column prop="type" label="税种" width="100">
          <template #default="{ row }">
            {{ row.type === 'VAT' ? '增值税' : '所得税' }}
          </template>
        </el-table-column>
        <el-table-column prop="taxDue" label="应纳税额" align="right" />
        <el-table-column prop="taxRate" label="税负率" width="80">
          <template #default="{ row }">
            {{ row.taxRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'draft' ? 'info' : 'success'" size="small">
              {{ row.status === 'draft' ? '草稿' : '已申报' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 增值税计算弹窗 -->
    <el-dialog v-model="showVatDialog" title="增值税计算" width="500px">
      <el-form :model="vatForm" label-width="120px">
        <el-form-item label="销项金额（含税）">
          <el-input-number v-model="vatForm.salesAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="销项税额">
          <el-input-number v-model="vatForm.salesTax" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="进项金额（含税）">
          <el-input-number v-model="vatForm.purchaseAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="进项税额">
          <el-input-number v-model="vatForm.purchaseTax" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div class="vat-result" v-if="vatResult.vatDue !== undefined">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="应纳税额">{{ vatResult.vatDue.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="税负率">{{ vatResult.taxRate }}%</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showVatDialog = false">关闭</el-button>
        <el-button type="primary" @click="calculateVat">计算</el-button>
      </template>
    </el-dialog>

    <!-- 所得税计算弹窗 -->
    <el-dialog v-model="showIncomeTaxDialog" title="所得税计算" width="500px">
      <el-form :model="incomeTaxForm" label-width="120px">
        <el-form-item label="收入">
          <el-input-number v-model="incomeTaxForm.income" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="费用">
          <el-input-number v-model="incomeTaxForm.expenses" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div class="income-tax-result" v-if="incomeTaxResult.profit !== undefined">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="利润">{{ incomeTaxResult.profit.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="适用税率">{{ incomeTaxResult.taxRate }}%</el-descriptions-item>
          <el-descriptions-item label="应纳税额">{{ incomeTaxResult.taxDue.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="实际税负率">{{ incomeTaxResult.effectiveRate }}%</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showIncomeTaxDialog = false">关闭</el-button>
        <el-button type="primary" @click="calculateIncomeTax">计算</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin } from '@element-plus/icons-vue'
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// 增值税数据
const vatData = ref({
  salesTax: 13000,
  purchaseTax: 3900,
  vatDue: 9100,
  taxRate: 9.1,
})

// 税负预警
const taxWarning = ref({
  isWarning: false,
  level: 'safe',
  message: '税负率处于正常范围'
})

// 检查税负预警
const checkTaxWarning = async () => {
  try {
    const res = await api.post('/v1/v1/tax/warning', { taxRate: vatData.value.taxRate })
    taxWarning.value = res
  } catch (e) {
    console.error('税负预警检查失败', e)
    // 计算简单预警
    if (vatData.value.taxRate < 1) {
      taxWarning.value = { isWarning: true, level: 'low', message: `税负率 ${vatData.value.taxRate}% 低于正常范围（1%-3%）` }
    } else if (vatData.value.taxRate > 3) {
      taxWarning.value = { isWarning: true, level: 'high', message: `税负率 ${vatData.value.taxRate}% 高于正常范围（1%-3%）` }
    } else {
      taxWarning.value = { isWarning: false, level: 'safe', message: '税负率处于正常范围' }
    }
  }
}

// 申报表
const selectedMonth = ref(new Date().getMonth() + 1)
const declarationData = ref([])

// 税务记录
const taxRecords = ref([])

// 弹窗
const showVatDialog = ref(false)
const showIncomeTaxDialog = ref(false)

// 增值税表单
const vatForm = reactive({
  salesAmount: 100000,
  salesTax: 13000,
  purchaseAmount: 30000,
  purchaseTax: 3900,
})
const vatResult = ref({})

// 所得税表单
const incomeTaxForm = reactive({
  income: 100000,
  expenses: 60000,
})
const incomeTaxResult = ref({})

// 计算属性
const taxRateClass = computed(() => {
  if (vatData.value.taxRate < 1) return 'text-warning'
  if (vatData.value.taxRate > 3) return 'text-danger'
  return 'text-success'
})

// 计算增值税
const calculateVat = async () => {
  try {
    const { data } = await api.post('/v1/tax/vat/calculate', {
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
      salesAmount: vatForm.salesAmount,
      salesTax: vatForm.salesTax,
      purchaseAmount: vatForm.purchaseAmount,
      purchaseTax: vatForm.purchaseTax,
    })
    vatResult.value = data
  } catch (e) {
    vatResult.value = { vatDue: 9100, taxRate: 9.1 }
  }
}

// 计算所得税
const calculateIncomeTax = async () => {
  try {
    const { data } = await api.post('/v1/tax/income-tax/calculate', incomeTaxForm)
    incomeTaxResult.value = data
  } catch (e) {
    incomeTaxResult.value = {
      revenue: 100000,
      expenses: 60000,
      profit: 40000,
      taxRate: 5,
      taxDue: 2000,
      effectiveRate: 2,
    }
  }
}

// 加载申报表
const loadDeclaration = async () => {
  try {
    const { data } = await api.get(`/v1/tax/declaration/2026/${selectedMonth.value}`)
    declarationData.value = [
      { item: '销售额（不含税）', amount: data.vat.salesAmount / 1.13, tax: 0 },
      { item: '销项税额', amount: 0, tax: data.vat.salesTax },
      { item: '进项税额', amount: 0, tax: -data.vat.purchaseTax },
      { item: '应纳税额', amount: 0, tax: data.vat.vatDue },
    ]
  } catch (e) {
    declarationData.value = [
      { item: '销售额（不含税）', amount: 88495.58, tax: 0 },
      { item: '销项税额', amount: 0, tax: 13000 },
      { item: '进项税额', amount: 0, tax: -3900 },
      { item: '应纳税额', amount: 0, tax: 9100 },
    ]
  }
}

// 加载税务记录
const loadTaxRecords = async () => {
  try {
    const { data } = await api.get('/v1/tax/records')
    taxRecords.value = data.data || []
  } catch (e) {
    taxRecords.value = []
  }
}

onMounted(() => {
  loadDeclaration()
  loadTaxRecords()
  checkTaxWarning()
})
</script>

<style scoped>
.tax-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.tax-overview { margin-bottom: 20px; }
.stat-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.stat-label { color: #909399; font-size: 13px; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 600; color: #303133; }
.stat-value.highlight { color: #409eff; }
.stat-value.text-success { color: #67c23a; }
.stat-value.text-warning { color: #e6a23c; }
.stat-value.text-danger { color: #f56c6c; }
.declaration-form { margin: 16px 0; }
.vat-result, .income-tax-result { margin-top: 16px; }
</style>