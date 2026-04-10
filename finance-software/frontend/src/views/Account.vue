<template>
  <div class="account-container">
    <!-- 账套选择器 -->
    <el-card class="tenant-card" v-if="tenants.length > 0">
      <el-select v-model="currentTenantId" placeholder="选择账套" @change="handleTenantChange" style="width: 200px">
        <el-option v-for="t in tenants" :key="t.id" :label="t.name" :value="t.id" />
      </el-select>
      <el-select v-model="currentYear" placeholder="选择年度" @change="loadAccounts" style="width: 120px; margin-left: 10px">
        <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
      </el-select>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>账户管理</span>
          <el-button type="primary" @click="handleAdd">新增账户</el-button>
        </div>
      </template>

      <!-- 账户列表 -->
      <el-table :data="accounts" border stripe>
        <el-table-column prop="code" label="编码" width="80" />
        <el-table-column prop="name" label="账户名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="accountNo" label="账号" />
        <el-table-column prop="bankName" label="开户行" />
        <el-table-column prop="balance" label="余额" width="120">
          <template #default="{ row }">
            <span class="balance">{{ formatMoney(row.balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadAccounts"
        @size-change="loadAccounts"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账户' : '新增账户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="账户编码" prop="code">
          <el-input v-model="form.code" placeholder="如: 1001" />
        </el-form-item>
        <el-form-item label="账户名称" prop="name">
          <el-input v-model="form.name" placeholder="如: 中国工商银行" />
        </el-form-item>
        <el-form-item label="账户类型" prop="type">
          <el-select v-model="form.type" placeholder="选择类型" style="width: 100%">
            <el-option label="银行账户" value="bank" />
            <el-option label="现金" value="cash" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号" prop="accountNo">
          <el-input v-model="form.accountNo" placeholder="银行账号" />
        </el-form-item>
        <el-form-item label="开户行" prop="bankName">
          <el-input v-model="form.bankName" placeholder="如: 工商银行北京分行" />
        </el-form-item>
        <el-form-item label="初始余额" prop="balance">
          <el-input-number v-model="form.balance" :precision="2" :step="100" style="width: 100%" />
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
import { accountApi } from '@/api'

const accounts = ref([])
const tenants = ref([])
const currentTenantId = ref(null)
const currentYear = ref(new Date().getFullYear())
const years = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = reactive({
  id: '',
  code: '',
  name: '',
  type: 'bank',
  accountNo: '',
  bankName: '',
  balance: 0,
  isActive: true
})

const rules = {
  code: [{ required: true, message: '请输入账户编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入账户名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择账户类型', trigger: 'change' }]
}

// 生成年份列表
for (let y = new Date().getFullYear(); y >= 2020; y--) {
  years.value.push(y)
}

// 加载账套列表
const loadTenants = async () => {
  try {
    const res = await accountApi.getTenants()
    tenants.value = res.data || res || []
    if (tenants.value.length > 0) {
      currentTenantId.value = tenants.value[0].id
    }
    await loadAccounts()
  } catch (e) {
    console.error('加载账套失败', e)
  }
}

// 切换账套
const handleTenantChange = () => {
  loadAccounts()
}

// 加载账户列表
const loadAccounts = async () => {
  try {
    const res = await accountApi.list({ page: pagination.page, pageSize: pagination.pageSize })
    accounts.value = res.data || []
    pagination.total = res.total || 0
  } catch (e) {
    ElMessage.error('加载账户失败')
  }
}

// 新增账户
const handleAdd = () => {
  Object.assign(form, {
    id: '',
    code: '',
    name: '',
    type: 'bank',
    accountNo: '',
    bankName: '',
    balance: 0,
    isActive: true
  })
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑账户
const handleEdit = (row) => {
  Object.assign(form, { ...row })
  isEdit.value = true
  dialogVisible.value = true
}

// 删除账户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除账户"${row.name}"吗？`, '提示', { type: 'warning' })
    await accountApi.delete(row.id)
    ElMessage.success('删除成功')
    loadAccounts()
  } catch (e) {
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
      await accountApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await accountApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadAccounts()
  } catch (e) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const getTypeTag = (type) => {
  const map = { bank: '', cash: 'success', wechat: 'warning', alipay: 'danger' }
  return map[type] || ''
}

const getTypeText = (type) => {
  const map = { bank: '银行', cash: '现金', wechat: '微信', alipay: '支付宝' }
  return map[type] || type
}

const formatMoney = (amount) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0)
}

onMounted(() => {
  loadTenants()
})
</script>

<style scoped>
.account-container {
  padding: 20px;
}
.tenant-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.balance {
  font-weight: bold;
  color: #409eff;
}
</style>