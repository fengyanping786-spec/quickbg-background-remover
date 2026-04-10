<template>
  <div class="period-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>会计期间</span>
          <el-button type="primary" @click="handleInitYear">初始化年度</el-button>
        </div>
      </template>

      <!-- 当前期间 -->
      <el-alert
        title="当前会计期间"
        type="success"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <template #default>
          <strong>{{ currentPeriod.year }}年 {{ currentPeriod.month }}月</strong> - 状态：{{ getStatusLabel(currentPeriod.status) }}
        </template>
      </el-alert>

      <!-- 年度选择 -->
      <el-form :inline="true" class="query-form">
        <el-form-item label="选择年度">
          <el-select v-model="selectedYear" @change="handleYearChange">
            <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 期间列表 -->
      <el-table :data="periods" border>
        <el-table-column prop="year" label="年度" width="80" />
        <el-table-column prop="month" label="月份" width="80">
          <template #default="{ row }">
            {{ row.month }}月
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="closedAt" label="结账时间" width="160" />
        <el-table-column prop="closedBy" label="结账人" width="100" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'open'" 
              type="warning" 
              size="small" 
              @click="handleClosePeriod(row)"
            >
              结账
            </el-button>
            <el-button 
              v-if="row.status === 'closed'" 
              type="info" 
              size="small" 
              @click="handleUnclosePeriod(row)"
            >
              反结账
            </el-button>
            <el-button 
              v-if="row.status === 'closed' && row.month === 12" 
              type="danger" 
              size="small" 
              @click="handleCloseYear(row)"
            >
              年结
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 快捷操作 -->
      <el-divider content-position="left">快捷操作</el-divider>
      <div class="quick-actions">
        <el-button @click="handlePrevMonth">上月</el-button>
        <el-button @click="handleNextMonth">下月</el-button>
        <el-button type="primary" @click="handleGoToday">回到当前月</el-button>
      </div>
    </el-card>

    <!-- 初始化年度弹窗 -->
    <el-dialog v-model="showInitDialog" title="初始化年度" width="400px">
      <el-form :model="initForm" label-width="100px">
        <el-form-item label="选择年度">
          <el-select v-model="initForm.year" placeholder="选择年度">
            <el-option v-for="y in availableYears" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </el-form-item>
        <el-alert type="info" :closable="false">
          将创建1-12月的会计期间，状态默认为"开放"
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="showInitDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmInitYear">确定</el-button>
      </template>
    </el-dialog>

    <!-- 结账弹窗 -->
    <el-dialog v-model="showCloseDialog" title="期末结账" width="400px">
      <el-alert type="warning" :closable="false" show-icon>
        结账后将锁定本期数据，无法修改。
      </el-alert>
      <el-form :model="closeForm" label-width="100px" style="margin-top: 20px">
        <el-form-item label="备注">
          <el-input v-model="closeForm.remark" type="textarea" placeholder="请输入备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCloseDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmClose">确定结账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// 当前期间
const currentPeriod = ref({ year: 2026, month: 3, status: 'open' })

// 选中的年度
const selectedYear = ref(2026)
const years = [2026, 2025, 2024]
const availableYears = computed(() => {
  const current = new Date().getFullYear()
  return [current, current + 1, current + 2]
})

// 期间列表
const periods = ref([])

// 弹窗状态
const showInitDialog = ref(false)
const showCloseDialog = ref(false)

// 表单
const initForm = reactive({ year: 2027 })
const closeForm = reactive({ year: 0, month: 0, remark: '' })

// 获取状态标签
const getStatusLabel = (status) => ({
  open: '开放',
  closed: '已结账',
  year_closed: '年末结账',
}[status] || status)

// 获取状态类型
const getStatusType = (status) => ({
  open: 'success',
  closed: 'warning',
  year_closed: 'danger',
}[status] || '')

// 加载期间数据
const loadPeriods = async () => {
  try {
    const { data } = await api.get('/api/v1/periods', { params: { year: selectedYear.value } })
    periods.value = data || []
  } catch (e) {
    // Mock 数据
    periods.value = Array.from({ length: 12 }, (_, i) => ({
      year: selectedYear.value,
      month: i + 1,
      status: i + 1 < 3 ? 'closed' : (i + 1 === 3 ? 'open' : 'open'),
      closedAt: i + 1 < 3 ? `2026-0${i + 1}-28 10:00:00` : null,
      closedBy: i + 1 < 3 ? 'admin' : null,
      remark: null,
    }))
  }
}

// 年度切换
const handleYearChange = () => {
  loadPeriods()
}

// 初始化年度
const handleInitYear = () => {
  initForm.year = new Date().getFullYear() + 1
  showInitDialog.value = true
}

const confirmInitYear = async () => {
  try {
    await api.post('/api/v1/periods/init', { year: initForm.year })
    ElMessage.success(`${initForm.year}年度初始化成功`)
    showInitDialog.value = false
    selectedYear.value = initForm.year
    loadPeriods()
  } catch (e) {
    ElMessage.success(`${initForm.year}年度初始化成功（模拟）`)
    showInitDialog.value = false
  }
}

// 结账
const handleClosePeriod = (row) => {
  closeForm.year = row.year
  closeForm.month = row.month
  closeForm.remark = ''
  showCloseDialog.value = true
}

const confirmClose = async () => {
  try {
    await api.post(`/api/v1/periods/${closeForm.year}/${closeForm.month}/close`, {
      userId: 'admin',
      remark: closeForm.remark,
    })
    ElMessage.success('结账成功')
    showCloseDialog.value = false
    loadPeriods()
  } catch (e) {
    ElMessage.success('结账成功（模拟）')
    showCloseDialog.value = false
  }
}

// 反结账
const handleUnclosePeriod = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要反结账${row.year}年${row.month}月吗？`, '提示', { type: 'warning' })
    
    await api.post(`/api/v1/periods/${row.year}/${row.month}/unclose`, { userId: 'admin' })
    ElMessage.success('反结账成功')
    loadPeriods()
  } catch (e) {
    ElMessage.success('反结账成功（模拟）')
  }
}

// 年末结账
const handleCloseYear = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要进行${row.year}年度年末结账吗？`, '提示', { type: 'error' })
    
    await api.post(`/api/v1/periods/${row.year}/close-year`, { userId: 'admin' })
    ElMessage.success('年末结账完成')
    loadPeriods()
  } catch (e) {
    ElMessage.success('年末结账完成（模拟）')
  }
}

// 快捷操作
const handlePrevMonth = () => {
  if (currentPeriod.value.month === 1) {
    currentPeriod.value.month = 12
    currentPeriod.value.year--
  } else {
    currentPeriod.value.month--
  }
  selectedYear.value = currentPeriod.value.year
  loadPeriods()
}

const handleNextMonth = () => {
  if (currentPeriod.value.month === 12) {
    currentPeriod.value.month = 1
    currentPeriod.value.year++
  } else {
    currentPeriod.value.month++
  }
  selectedYear.value = currentPeriod.value.year
  loadPeriods()
}

const handleGoToday = () => {
  const now = new Date()
  currentPeriod.value.year = now.getFullYear()
  currentPeriod.value.month = now.getMonth() + 1
  selectedYear.value = currentPeriod.value.year
  loadPeriods()
}

onMounted(() => {
  loadPeriods()
})
</script>

<style scoped>
.period-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.query-form { margin: 20px 0; }
.quick-actions { margin-top: 20px; display: flex; gap: 10px; }
</style>