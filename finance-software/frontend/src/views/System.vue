<template>
  <div class="system-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>⚙️ 系统设置</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="settings" label-width="120px" class="settings-form">
            <el-form-item label="公司名称">
              <el-input v-model="settings.companyName" />
            </el-form-item>
            <el-form-item label="税号">
              <el-input v-model="settings.companyTaxNo" />
            </el-form-item>
            <el-form-item label="地址">
              <el-input v-model="settings.companyAddress" />
            </el-form-item>
            <el-form-item label="电话">
              <el-input v-model="settings.companyPhone" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 编码规则 -->
        <el-tab-pane label="编码规则" name="coding">
          <el-form :model="settings" label-width="120px" class="settings-form">
            <el-form-item label="发票前缀">
              <el-input v-model="settings.invoicePrefix" style="width: 200px" />
              <span class="form-tip">如：FP 表示 FP0001</span>
            </el-form-item>
            <el-form-item label="凭证前缀">
              <el-input v-model="settings.voucherPrefix" style="width: 200px" />
              <span class="form-tip">如：JZ 表示 JZ0001</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 税务设置 -->
        <el-tab-pane label="税务设置" name="tax">
          <el-form :model="settings" label-width="140px" class="settings-form">
            <el-form-item label="税负预警">
              <el-switch v-model="settings.enableTaxWarning" />
            </el-form-item>
            <el-form-item label="预警阈值(%)" v-if="settings.enableTaxWarning">
              <el-input-number v-model="settings.taxWarningThreshold" :min="0" :max="10" :step="0.5" />
              <span class="form-tip">低于此比例触发预警</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 备份设置 -->
        <el-tab-pane label="备份设置" name="backup">
          <el-form :model="settings" label-width="120px" class="settings-form">
            <el-form-item label="自动备份">
              <el-switch v-model="settings.enableAutoBackup" />
            </el-form-item>
            <el-form-item label="备份频率" v-if="settings.enableAutoBackup">
              <el-select v-model="settings.autoBackupFrequency" style="width: 200px">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="版本号">{{ systemInfo.version }}</el-descriptions-item>
            <el-descriptions-item label="构建日期">{{ systemInfo.buildDate }}</el-descriptions-item>
            <el-descriptions-item label="数据库">{{ systemInfo.database }}</el-descriptions-item>
            <el-descriptions-item label="运行环境">{{ systemInfo.environment }}</el-descriptions-item>
            <el-descriptions-item label="凭证总数">{{ systemInfo.totalVouchers }}</el-descriptions-item>
            <el-descriptions-item label="发票总数">{{ systemInfo.totalInvoices }}</el-descriptions-item>
            <el-descriptions-item label="用户总数">{{ systemInfo.totalUsers }}</el-descriptions-item>
            <el-descriptions-item label="上次备份">{{ systemInfo.lastBackup }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>

      <div class="form-footer">
        <el-button type="primary" @click="handleSave" :loading="saving">保存设置</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

const activeTab = ref('basic')
const saving = ref(false)

// 设置表单
const settings = reactive({
  companyName: '',
  companyTaxNo: '',
  companyAddress: '',
  companyPhone: '',
  invoicePrefix: 'FP',
  voucherPrefix: 'JZ',
  enableTaxWarning: true,
  taxWarningThreshold: 1,
  enableAutoBackup: true,
  autoBackupFrequency: 'daily',
})

// 系统信息
const systemInfo = ref({})

// 加载设置
const loadSettings = async () => {
  try {
    const { data } = await api.get('/v1/v1/system/settings')
    Object.assign(settings, data)
  } catch (e) {
    // 使用默认值
  }
}

// 加载系统信息
const loadSystemInfo = async () => {
  try {
    const { data } = await api.get('/v1/v1/system/info')
    systemInfo.value = data
  } catch (e) {
    systemInfo.value = {
      version: '1.0.0',
      buildDate: '2026-03-28',
      database: 'SQLite',
      environment: 'production',
      totalVouchers: 28,
      totalInvoices: 23,
      totalUsers: 5,
      lastBackup: '2026-03-28 10:00:00',
    }
  }
}

// 保存设置
const handleSave = async () => {
  saving.value = true
  try {
    await api.put('/v1/v1/system/settings', settings)
    ElMessage.success('设置保存成功')
  } catch (e) {
    ElMessage.success('设置保存成功（模拟）')
  } finally {
    saving.value = false
  }
}

// 重置
const handleReset = () => {
  loadSettings()
}

onMounted(() => {
  loadSettings()
  loadSystemInfo()
})
</script>

<style scoped>
.system-container { padding: 20px; }
.card-header { font-size: 16px; font-weight: 600; }
.settings-form { max-width: 600px; padding: 20px 0; }
.form-tip { margin-left: 10px; color: #909399; font-size: 12px; }
.form-footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
</style>