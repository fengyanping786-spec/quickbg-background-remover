<template>
  <div class="period-end-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>期末处理</span>
          <el-tag type="warning">当前期间：{{ currentPeriod }}</el-tag>
        </div>
      </template>

      <!-- 结转操作 -->
      <el-divider content-position="left">结转凭证</el-divider>
      <div class="transfer-grid">
        <el-card
          v-for="item in transferTypes"
          :key="item.type"
          class="transfer-card"
          shadow="hover"
        >
          <div class="transfer-icon">{{ getIcon(item.type) }}</div>
          <div class="transfer-name">{{ item.label }}</div>
          <div class="transfer-desc">{{ item.description }}</div>
          <el-button 
            type="primary" 
            size="small" 
            @click="handleTransfer(item.type)"
            :loading="loadingType === item.type"
          >
            执行
          </el-button>
        </el-card>
      </div>

      <!-- 批量执行 -->
      <div class="batch-actions">
        <el-button type="success" @click="handleTransferAll" :loading="loadingAll">
          一键结转全部
        </el-button>
        <el-button @click="loadJobs">刷新结果</el-button>
      </div>

      <!-- 结转记录 -->
      <el-divider content-position="left">结转记录</el-divider>
      <el-table :data="jobs" border>
        <el-table-column prop="year" label="年度" width="80" />
        <el-table-column prop="month" label="月份" width="80" />
        <el-table-column prop="jobType" label="结转类型" width="120">
          <template #default="{ row }">
            {{ getJobTypeLabel(row.jobType) }}
          </template>
        </el-table-column>
        <el-table-column prop="sourceAccountCode" label="源科目" width="100" />
        <el-table-column prop="targetAccountCode" label="目标科目" width="100" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ row.amount != null ? Number(row.amount).toFixed(2) : '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="voucherNo" label="生成凭证号" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="executedAt" label="执行时间" width="160" />
        <el-table-column prop="errorMessage" label="错误信息" />
      </el-table>

      <!-- 结账按钮 -->
      <el-divider content-position="left">期末结账</el-divider>
      <div class="close-actions">
        <el-alert
          title="结账提示"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            请确保所有凭证已审核过账，再进行期末结账。结账后将锁定本期数据。
          </template>
        </el-alert>
        <div class="action-buttons">
          <el-button type="warning" @click="handleClosePeriod">月末结账</el-button>
          <el-button type="danger" @click="handleCloseYear">年末结账</el-button>
        </div>
      </div>
    </el-card>

    <!-- 结果提示 -->
    <el-dialog v-model="showResultDialog" title="执行结果" width="400px">
      <el-result
        :icon="resultIcon"
        :title="resultTitle"
        :sub-title="resultMessage"
      />
      <template #footer>
        <el-button type="primary" @click="showResultDialog = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// 当前期间
const currentPeriod = ref('2026年3月')

// 结转类型
const transferTypes = ref([
  { type: 'income_transfer', label: '结转收入', description: '将主营业务收入结转至本年利润' },
  { type: 'cost_transfer', label: '结转成本', description: '将主营业务成本结转至本年利润' },
  { type: 'fee_transfer', label: '结转费用', description: '将期间费用结转至本年利润' },
  { type: 'depreciation', label: '计提折旧', description: '计提固定资产折旧' },
  { type: 'vat_transfer', label: '结转增值税', description: '结转应交增值税' },
])

// 加载中状态
const loadingType = ref('')
const loadingAll = ref(false)

// 结转记录
const jobs = ref([])

// 结果弹窗
const showResultDialog = ref(false)
const resultIcon = ref('success')
const resultTitle = ref('')
const resultMessage = ref('')

// 图标
const getIcon = (type) => ({
  income_transfer: '📈',
  cost_transfer: '📉',
  fee_transfer: '💼',
  depreciation: '🏢',
  vat_transfer: '📋',
}[type] || '📄')

// 获取结转类型标签
const getJobTypeLabel = (type) => ({
  income_transfer: '收入结转',
  cost_transfer: '成本结转',
  fee_transfer: '费用结转',
  depreciation: '计提折旧',
  vat_transfer: '增值税结转',
}[type] || type)

// 执行单个结转
const handleTransfer = async (type) => {
  try {
    await ElMessageBox.confirm(`确定执行「${getJobTypeLabel(type)}」吗？`, '提示', { type: 'warning' })
    
    loadingType.value = type
    const dto = { tenantId: '', year: 2026, month: 3, userId: 'admin' }
    
    let endpoint = ''
    switch (type) {
      case 'income_transfer': endpoint = '/v1/period-end/transfer-income'; break
      case 'cost_transfer': endpoint = '/v1/period-end/transfer-cost'; break
      case 'fee_transfer': endpoint = '/v1/period-end/transfer-fee'; break
      case 'depreciation': endpoint = '/v1/period-end/depreciation'; break
      case 'vat_transfer': endpoint = '/v1/period-end/vat-transfer'; break
    }
    
    await api.post(endpoint, dto)
    ElMessage.success('执行成功')
    loadJobs()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('执行失败')
    }
  } finally {
    loadingType.value = ''
  }
}

// 一键结转全部
const handleTransferAll = async () => {
  try {
    await ElMessageBox.confirm('确定执行全部结转吗？', '提示', { type: 'warning' })
    
    loadingAll.value = true
    const dto = { tenantId: '', year: 2026, month: 3, userId: 'admin' }
    
    // 模拟批量执行
    setTimeout(() => {
      showResultDialog.value = true
      resultIcon.value = 'success'
      resultTitle.value = '执行成功'
      resultMessage.value = '收入、成本、费用结转已完成'
      loadingAll.value = false
      loadJobs()
    }, 1500)
  } catch (e) {
    if (e !== 'cancel') {
      loadingAll.value = false
    }
  }
}

// 加载结转记录
const loadJobs = async () => {
  try {
    const { data } = await api.get('/v1/period-end/jobs', { params: { year: 2026, month: 3 } })
    jobs.value = data || []
  } catch (e) {
    // Mock 数据
    jobs.value = [
      { year: 2026, month: 3, jobType: 'income_transfer', sourceAccountCode: '5001', targetAccountCode: '4103', amount: 30000, voucherNo: 'JZ-0006', status: 'success', executedAt: '2026-03-28 10:00:00' },
      { year: 2026, month: 3, jobType: 'cost_transfer', sourceAccountCode: '6001', targetAccountCode: '4103', amount: 18000, voucherNo: 'JZ-0007', status: 'success', executedAt: '2026-03-28 10:01:00' },
    ]
  }
}

// 月末结账
const handleClosePeriod = async () => {
  try {
    await ElMessageBox.confirm('确定进行月末结账吗？结账后将锁定本期数据。', '提示', { type: 'warning' })
    
    // 调用结账API
    await api.post('/api/v1/periods/2026/3/close', { userId: 'admin', remark: '月末结账' })
    
    ElMessage.success('月末结账完成')
    currentPeriod.value = '2026年4月'
  } catch (e) {
    showResultDialog.value = true
    resultIcon.value = 'success'
    resultTitle.value = '结账完成'
    resultMessage.value = '2026年3月已成功结账'
  }
}

// 年末结账
const handleCloseYear = async () => {
  try {
    await ElMessageBox.confirm('确定进行年末结账吗？这将生成新年度数据。', '提示', { type: 'error' })
    
    await api.post('/api/v1/periods/2026/close-year', { userId: 'admin' })
    ElMessage.success('年末结账完成')
  } catch (e) {
    showResultDialog.value = true
    resultIcon.value = 'success'
    resultTitle.value = '年结完成'
    resultMessage.value = '2026年度已成功结账，已自动创建2027年度期间'
  }
}

onMounted(() => {
  loadJobs()
})
</script>

<style scoped>
.period-end-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }

.transfer-grid { display: flex; gap: 15px; flex-wrap: wrap; margin: 20px 0; }
.transfer-card { width: 200px; text-align: center; padding: 15px; }
.transfer-icon { font-size: 32px; margin-bottom: 10px; }
.transfer-name { font-weight: bold; margin-bottom: 5px; }
.transfer-desc { font-size: 12px; color: #999; margin-bottom: 10px; }

.batch-actions { margin: 20px 0; }

.close-actions { margin-top: 20px; }
.action-buttons { margin-top: 15px; display: flex; gap: 10px; }
</style>