<template>
  <div class="voucher-word-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>凭证字管理</span>
          <div class="header-actions">
            <el-button @click="handleInit" :loading="initLoading">初始化默认</el-button>
            <el-button type="primary" @click="handleAdd">新增凭证字</el-button>
          </div>
        </div>
      </template>

      <!-- 凭证字列表 -->
      <el-table :data="voucherWords" border stripe v-loading="loading">
        <el-table-column prop="code" label="编码" width="80" />
        <el-table-column prop="name" label="名称" width="120" />
        <el-table-column prop="displayOrder" label="排序" width="80" />
        <el-table-column label="默认" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success" size="small">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" v-if="!row.isDefault" @click="handleSetDefault(row)">设为默认</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑凭证字' : '新增凭证字'" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="如：记、收、付、转" style="width: 120px" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：记账、收款" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.displayOrder" :min="1" :max="99" />
        </el-form-item>
        <el-form-item label="默认">
          <el-switch v-model="form.isDefault" />
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
import { voucherWordApi } from '@/api'

const loading = ref(false)
const initLoading = ref(false)
const voucherWords = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()

const form = reactive({
  id: null,
  code: '',
  name: '',
  displayOrder: 1,
  isDefault: false,
  tenantId: 'default',
  year: new Date().getFullYear()
})

const rules = {
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

// 加载凭证字列表
const loadVoucherWords = async () => {
  loading.value = true
  try {
    const res = await voucherWordApi.list({
      tenantId: form.tenantId,
      year: form.year
    })
    voucherWords.value = res.data || res || []
  } catch (e) {
    console.error('加载凭证字失败', e)
    // 模拟数据
    voucherWords.value = [
      { id: 1, code: '记', name: '记账', displayOrder: 1, isDefault: true, isActive: true },
      { id: 2, code: '收', name: '收款', displayOrder: 2, isDefault: false, isActive: true },
      { id: 3, code: '付', name: '付款', displayOrder: 3, isDefault: false, isActive: true },
      { id: 4, code: '转', name: '转账', displayOrder: 4, isDefault: false, isActive: true }
    ]
  } finally {
    loading.value = false
  }
}

// 初始化默认凭证字
const handleInit = async () => {
  try {
    await ElMessageBox.confirm('确定要初始化默认凭证字吗？', '提示')
    initLoading.value = true
    await voucherWordApi.init({ tenantId: form.tenantId, year: form.year })
    ElMessage.success('初始化成功')
    loadVoucherWords()
  } catch (e) {
    console.error(e)
  } finally {
    initLoading.value = false
  }
}

// 新增
const handleAdd = () => {
  Object.assign(form, {
    id: null,
    code: '',
    name: '',
    displayOrder: 1,
    isDefault: false
  })
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  Object.assign(form, { ...row })
  isEdit.value = true
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除凭证字"${row.name}"吗？`, '提示', { type: 'warning' })
    await voucherWordApi.delete(row.id)
    ElMessage.success('删除成功')
    loadVoucherWords()
  } catch (e) {
    console.error(e)
  }
}

// 设为默认
const handleSetDefault = async (row) => {
  try {
    await voucherWordApi.setDefault(row.id, { tenantId: form.tenantId, year: form.year })
    ElMessage.success('设置成功')
    loadVoucherWords()
  } catch (e) {
    console.error(e)
  }
}

// 提交
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await voucherWordApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await voucherWordApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadVoucherWords()
  } catch (e) {
    console.error(e)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadVoucherWords()
})
</script>

<style scoped>
.voucher-word-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  gap: 10px;
}
</style>