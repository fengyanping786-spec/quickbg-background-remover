<template>
  <div class="tenant-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>账套管理</span>
          <el-button type="primary" @click="handleAdd">新增账套</el-button>
        </div>
      </template>

      <!-- 账套列表 -->
      <el-table :data="tenants" border stripe>
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="name" label="公司名称" />
        <el-table-column prop="taxNo" label="税号" width="180" />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="address" label="地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" @click="handlePeriods(row)">会计期间</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 会计期间对话框 -->
    <el-dialog v-model="periodDialogVisible" title="会计期间管理" width="600px">
      <div v-if="currentTenant">
        <p style="margin-bottom: 15px">账套: <strong>{{ currentTenant.name }}</strong></p>
        <el-table :data="periods" border>
          <el-table-column prop="year" label="年度" width="80" />
          <el-table-column prop="startDate" label="开始日期" width="120" />
          <el-table-column prop="endDate" label="结束日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getPeriodStatusType(row.status)">{{ getPeriodStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" v-if="row.status === 'open'" @click="handleClosePeriod(row)">结账</el-button>
              <el-button size="small" v-if="row.status === 'closed'" @click="handleReopenPeriod(row)">反结账</el-button>
              <el-button size="small" v-if="row.status === 'year_closed'" @click="handleYearEnd(row)">年末结账</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" style="margin-top: 15px" @click="handleAddPeriod">新增年度</el-button>
      </div>
    </el-dialog>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账套' : '新增账套'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="账套编码" prop="code">
          <el-input v-model="form.code" placeholder="如: 001" style="width: 150px" />
        </el-form-item>
        <el-form-item label="公司名称" prop="name">
          <el-input v-model="form.name" placeholder="公司全称" />
        </el-form-item>
        <el-form-item label="税号" prop="taxNo">
          <el-input v-model="form.taxNo" placeholder="统一社会信用代码" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tenantApi } from '@/api'

const tenants = ref([])
const periods = ref([])
const currentTenant = ref(null)
const dialogVisible = ref(false)
const periodDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()

const form = reactive({
  id: '',
  code: '',
  name: '',
  taxNo: '',
  contact: '',
  phone: '',
  address: '',
  isActive: true,
  status: 'active'
})

const rules = {
  code: [{ required: true, message: '请输入账套编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }]
}

// 加载账套列表
const loadTenants = async () => {
  try {
    const res = await tenantApi.list()
    tenants.value = res.data || res || []
  } catch (e) {
    console.error('加载账套失败', e)
    // 如果 API 不可用，使用模拟数据
    tenants.value = [
      { id: 1, code: '001', name: '测试科技有限公司', taxNo: '91110000XXXXXX', contact: '张三', phone: '13800138000', address: '北京市朝阳区', status: 'active', isActive: true },
      { id: 2, code: '002', name: '示例商贸有限公司', taxNo: '91110000YYYYYY', contact: '李四', phone: '13900139000', address: '上海市浦东新区', status: 'active', isActive: true }
    ]
  }
}

// 新增账套
const handleAdd = () => {
  Object.assign(form, {
    id: '',
    code: '',
    name: '',
    taxNo: '',
    contact: '',
    phone: '',
    address: '',
    isActive: true,
    status: 'active'
  })
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑账套
const handleEdit = (row) => {
  Object.assign(form, { ...row })
  isEdit.value = true
  dialogVisible.value = true
}

// 删除账套
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除账套"${row.name}"吗？`, '提示', { type: 'warning' })
    await tenantApi.delete(row.id)
    ElMessage.success('删除成功')
    loadTenants()
  } catch (e) {
    console.error(e)
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await tenantApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await tenantApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadTenants()
  } catch (e) {
    console.error(e)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

// 会计期间管理
const handlePeriods = (row) => {
  currentTenant.value = row
  // 模拟期间数据
  periods.value = [
    { year: 2026, startDate: '2026-01-01', endDate: '2026-12-31', status: 'open' },
    { year: 2025, startDate: '2025-01-01', endDate: '2025-12-31', status: 'closed' },
    { year: 2024, startDate: '2024-01-01', endDate: '2024-12-31', status: 'year_closed' }
  ]
  periodDialogVisible.value = true
}

// 新增年度
const handleAddPeriod = () => {
  const currentYear = periods.value.length > 0 ? Math.max(...periods.value.map(p => p.year)) : new Date().getFullYear()
  periods.value.push({
    year: currentYear + 1,
    startDate: `${currentYear + 1}-01-01`,
    endDate: `${currentYear + 1}-12-31`,
    status: 'open'
  })
}

// 结账
const handleClosePeriod = (row) => {
  ElMessageBox.confirm(`确定要对 ${row.year} 年进行结账吗？`, '提示').then(() => {
    row.status = 'closed'
    ElMessage.success('结账成功')
  }).catch(() => {})
}

// 反结账
const handleReopenPeriod = (row) => {
  ElMessageBox.confirm(`确定要反结账吗？`, '提示').then(() => {
    row.status = 'open'
    ElMessage.success('反结账成功')
  }).catch(() => {})
}

// 年末结账
const handleYearEnd = (row) => {
  ElMessageBox.confirm(`确定要进行年末结账吗？此操作不可逆！`, '警告', { type: 'warning' }).then(() => {
    row.status = 'year_closed'
    ElMessage.success('年末结账成功')
  }).catch(() => {})
}

const getPeriodStatusType = (status) => {
  const map = { open: 'success', closed: 'warning', year_closed: 'danger' }
  return map[status] || ''
}

const getPeriodStatusLabel = (status) => {
  const map = { open: '进行中', closed: '已结账', year_closed: '年末结账' }
  return map[status] || status
}

onMounted(() => {
  loadTenants()
})
</script>

<style scoped>
.tenant-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>