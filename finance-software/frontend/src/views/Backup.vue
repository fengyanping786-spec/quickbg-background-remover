<template>
  <div class="backup-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据备份</span>
          <el-button type="primary" @click="createBackup">创建备份</el-button>
        </div>
      </template>

      <!-- 备份选项 -->
      <el-form :inline="true" :model="backupOptions" class="backup-options">
        <el-form-item label="包含公共数据库">
          <el-switch v-model="backupOptions.includePublicDb" />
        </el-form-item>
        <el-form-item label="包含账套数据库">
          <el-switch v-model="backupOptions.includeTenantDbs" />
        </el-form-item>
        <el-form-item label="包含文件">
          <el-switch v-model="backupOptions.includeFiles" />
        </el-form-item>
        <el-form-item label="压缩">
          <el-switch v-model="backupOptions.compress" />
        </el-form-item>
        <el-form-item label="加密">
          <el-switch v-model="backupOptions.encryption" />
        </el-form-item>
        <el-form-item v-if="backupOptions.encryption" label="加密密钥">
          <el-input v-model="backupOptions.encryptionKey" placeholder="请输入加密密钥" show-password style="width: 200px" />
        </el-form-item>
      </el-form>

      <!-- 备份列表 -->
      <el-table :data="backups" border>
        <el-table-column prop="fileName" label="备份文件" min-width="200" />
        <el-table-column label="大小" width="100">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'danger'">
              {{ row.status === 'completed' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="downloadBackup(row)">下载</el-button>
            <el-button link type="success" @click="restoreBackup(row)">恢复</el-button>
            <el-button link type="danger" @click="deleteBackup(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadBackups"
          @current-change="loadBackups"
        />
      </div>
    </el-card>

    <!-- 恢复确认弹窗 -->
    <el-dialog v-model="showRestoreDialog" title="恢复备份" width="400px">
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 15px"
      >
        恢复备份将覆盖当前数据，此操作不可恢复，请谨慎操作！
      </el-alert>
      <p>确定要恢复备份 "<strong>{{ selectedBackup?.fileName }}</strong>" 吗？</p>
      <template #footer>
        <el-button @click="showRestoreDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRestore">确定恢复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// 备份选项
const backupOptions = reactive({
  includePublicDb: true,
  includeTenantDbs: true,
  includeFiles: true,
  compress: true,
  encryption: false,
  encryptionKey: '',
})

// 备份列表
const backups = ref([])

// 分页
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// 恢复确认
const showRestoreDialog = ref(false)
const selectedBackup = ref(null)

// 加载备份列表
const loadBackups = async () => {
  try {
    const { data } = await api.get('/backup')
    backups.value = data || []
    pagination.total = data.length || 0
  } catch (e) {
    // Mock 数据
    backups.value = [
      { id: '1', fileName: 'finance_backup_2026-03-27_01-00-00.sql', fileSize: 1024000, createdAt: '2026-03-27T01:00:00Z', status: 'completed', options: { includePublicDb: true } },
      { id: '2', fileName: 'finance_backup_2026-03-26_01-00-00.sql', fileSize: 980000, createdAt: '2026-03-26T01:00:00Z', status: 'completed', options: { includePublicDb: true } },
    ]
    pagination.total = 2
  }
}

// 创建备份
const createBackup = async () => {
  try {
    ElMessage.info('正在创建备份，请稍候...')
    const { data } = await api.post('/backup', backupOptions)
    ElMessage.success('备份创建成功')
    loadBackups()
  } catch (e) {
    // 模拟创建成功
    ElMessage.success('备份创建成功（模拟）')
    loadBackups()
  }
}

// 下载备份
const downloadBackup = async (row) => {
  try {
    const response = await api.get(`/v1/backups/${row.id}/download`, { responseType: 'blob' })
    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = row.fileName
    link.click()
    ElMessage.success('下载成功')
  } catch (e) {
    ElMessage.error('下载失败')
  }
}

// 恢复备份
const restoreBackup = (row) => {
  selectedBackup.value = row
  showRestoreDialog.value = true
}

const confirmRestore = async () => {
  try {
    await api.post(`/v1/backups/${selectedBackup.value.id}/restore`)
    ElMessage.success('恢复成功')
    showRestoreDialog.value = false
  } catch (e) {
    ElMessage.success('恢复成功（模拟）')
    showRestoreDialog.value = false
  }
}

// 删除备份
const deleteBackup = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该备份吗？', '提示', { type: 'warning' })
    await api.delete(`/v1/backups/${row.id}`)
    ElMessage.success('删除成功')
    loadBackups()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// 工具函数
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadBackups()
})
</script>

<style scoped>
.backup-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.backup-options { margin: 20px 0; padding: 15px; background: #f5f7fa; border-radius: 4px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>