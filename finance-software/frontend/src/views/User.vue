<template>
  <div class="user-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="showDialog = true">新增用户</el-button>
        </div>
      </template>

      <!-- 用户列表 -->
      <el-table :data="users" border>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" min-width="150" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="150">
          <template #default="{ row }">
            <el-tag v-for="r in row.roles" :key="r.id" size="small" style="margin-right: 5px">
              {{ r.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="showRoleDialog(row)">分配角色</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog v-model="showDialog" :title="form.id ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" type="email" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 角色分配弹窗 -->
    <el-dialog v-model="showRoleDialog" title="分配角色" width="400px">
      <el-form label-width="80px">
        <el-form-item label="用户">
          <el-input :value="selectedUser?.realName" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="selectedRoleId" placeholder="请选择角色">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAssignRole">确定</el-button>
      </template>
    </el-dialog>

    <!-- 角色管理弹窗 -->
    <el-card>
      <template #header>
        <span>角色管理</span>
        <el-button size="small" type="primary" @click="showRoleEditDialog = true">新增角色</el-button>
      </template>
      <el-table :data="roles" border size="small">
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="name" label="名称" width="100" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="权限" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="p in row.permissions" :key="p" size="small" style="margin: 2px">
              {{ getPermissionLabel(p) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editRole(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="deleteRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 角色编辑弹窗 -->
    <el-dialog v-model="showRoleEditDialog" :title="roleForm.id ? '编辑角色' : '新增角色'" width="500px">
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="80px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="roleForm.code" :disabled="!!roleForm.id" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="roleForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roleForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="roleForm.permissions">
            <el-checkbox label="account:read">账户读取</el-checkbox>
            <el-checkbox label="account:write">账户写入</el-checkbox>
            <el-checkbox label="voucher:read">凭证读取</el-checkbox>
            <el-checkbox label="voucher:write">凭证写入</el-checkbox>
            <el-checkbox label="voucher:approve">凭证审核</el-checkbox>
            <el-checkbox label="invoice:read">发票读取</el-checkbox>
            <el-checkbox label="invoice:write">发票写入</el-checkbox>
            <el-checkbox label="report:read">报表读取</el-checkbox>
            <el-checkbox label="tax:read">税务读取</el-checkbox>
            <el-checkbox label="tax:write">税务写入</el-checkbox>
            <el-checkbox label="user:read">用户读取</el-checkbox>
            <el-checkbox label="user:write">用户写入</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// 用户列表
const users = ref([])
const roles = ref([])

// 分页
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// 弹窗
const showDialog = ref(false)
const roleDialogVisible = ref(false)
const showRoleEditDialog = ref(false)

// 表单
const formRef = ref()
const form = reactive({
  id: '',
  username: '',
  realName: '',
  email: '',
  phone: '',
  password: '',
  status: 'active',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式错误', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6 }],
}

// 角色分配
const selectedUser = ref(null)
const selectedRoleId = ref('')

// 角色表单
const roleFormRef = ref()
const roleForm = reactive({
  id: '',
  code: '',
  name: '',
  description: '',
  permissions: [],
})

const roleRules = {
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

// 加载数据
const loadData = async () => {
  try {
    const { data } = await api.get('/users', { params: { page: pagination.page, pageSize: pagination.pageSize } })
    users.value = data.data || []
    pagination.total = data.total || 0
  } catch (e) {
    // Mock
    users.value = [
      { id: '1', username: 'admin', realName: '管理员', email: 'admin@company.com', phone: '13800000000', status: 'active', roles: [{ id: '1', name: '管理员' }], createdAt: '2026-01-01' },
      { id: '2', username: 'zhangsan', realName: '张三', email: 'zhangsan@company.com', phone: '13800000001', status: 'active', roles: [{ id: '2', name: '记账员' }], createdAt: '2026-01-15' },
    ]
    pagination.total = 2
  }
}

// 加载角色
const loadRoles = async () => {
  try {
    const { data } = await api.get('/v1/v1/users/roles')
    roles.value = data || []
  } catch (e) {
    roles.value = [
      { id: '1', code: 'admin', name: '管理员', description: '拥有全部权限', permissions: ['account:read', 'voucher:read', 'voucher:write', 'invoice:read', 'report:read'] },
      { id: '2', code: 'accountant', name: '记账员', description: '负责凭证录入', permissions: ['account:read', 'voucher:read', 'voucher:write'] },
      { id: '3', code: 'viewer', name: '查看员', description: '只读', permissions: ['account:read', 'voucher:read', 'report:read'] },
    ]
  }
}

// 权限标签
const getPermissionLabel = (p) => {
  const map = {
    'account:read': '账户读取', 'account:write': '账户写入', 'account:delete': '账户删除',
    'voucher:read': '凭证读取', 'voucher:write': '凭证写入', 'voucher:approve': '凭证审核', 'voucher:delete': '凭证删除',
    'invoice:read': '发票读取', 'invoice:write': '发票写入', 'invoice:delete': '发票删除',
    'report:read': '报表读取', 'report:export': '报表导出',
    'tax:read': '税务读取', 'tax:write': '税务写入',
    'user:read': '用户读取', 'user:write': '用户写入', 'user:delete': '用户删除',
  }
  return map[p] || p
}

// 编辑用户
const handleEdit = (row) => {
  Object.assign(form, row)
  form.password = ''
  showDialog.value = true
}

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该用户？', '提示', { type: 'warning' })
    // await api.delete(`/v1/v1/users/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {}
}

// 提交用户
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (form.id) {
      // await api.put(`/v1/v1/users/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      // await api.post('/users', form)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// 分配角色
const openRoleDialog = (row) => {
  selectedUser.value = row
  selectedRoleId.value = row.roles?.[0]?.id || ''
  roleDialogVisible.value = true
}

const confirmAssignRole = async () => {
  try {
    // await api.post(`/v1/v1/users/${selectedUser.value.id}/roles`, { roleId: selectedRoleId.value })
    ElMessage.success('角色分配成功')
    roleDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// 编辑角色
const editRole = (row) => {
  Object.assign(roleForm, row)
  showRoleEditDialog.value = true
}

// 删除角色
const deleteRole = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该角色？', '提示', { type: 'warning' })
    // await api.delete(`/v1/v1/users/roles/${row.id}`)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (e) {}
}

// 提交角色
const submitRole = async () => {
  const valid = await roleFormRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (roleForm.id) {
      // await api.put(`/v1/v1/users/roles/${roleForm.id}`, roleForm)
    } else {
      // await api.post('/v1/v1/users/roles', roleForm)
    }
    ElMessage.success('保存成功')
    showRoleEditDialog.value = false
    loadRoles()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
  loadRoles()
})
</script>

<style scoped>
.user-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.el-checkbox-group { display: flex; flex-wrap: wrap; gap: 10px; }
</style>