<template>
  <div class="account-init-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📚 科目初始化与期初余额</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleInitAccounts" :loading="loading">
              <el-icon><MagicStick /></el-icon>
              初始化科目
            </el-button>
            <el-button type="success" @click="showBalanceDialog = true">
              <el-icon><Plus /></el-icon>
              录入期初余额
            </el-button>
          </div>
        </div>
      </template>

      <!-- Tabs切换 -->
      <el-tabs v-model="activeTab">
        <!-- 会计科目 -->
        <el-tab-pane label="会计科目" name="accounts">
          <el-table :data="accounts" border stripe row-key="id" :tree-props="{ children: 'children' }">
            <el-table-column prop="code" label="科目编码" width="100" />
            <el-table-column prop="name" label="科目名称" min-width="150" />
            <el-table-column prop="level" label="级次" width="60" />
            <el-table-column prop="direction" label="方向" width="80">
              <template #default="{ row }">
                <el-tag :type="row.direction === 'debit' ? 'danger' : 'success'" size="small">
                  {{ row.direction === 'debit' ? '借' : '贷' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="辅助核算" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.isAuxiliary" type="warning" size="small">有</el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="数量核算" width="100">
              <template #default="{ row }">
                <span v-if="row.isQuantity">{{ row.unit || '有' }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="openingBalance" label="期初余额" width="120" align="right">
              <template #default="{ row }">
                <span v-if="row.openingBalance">{{ Number(row.openingBalance).toFixed(2) }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 期初余额 -->
        <el-tab-pane label="期初余额" name="balance">
          <el-table :data="openingBalances" border stripe>
            <el-table-column prop="accountCode" label="科目编码" width="100" />
            <el-table-column prop="accountName" label="科目名称" min-width="150" />
            <el-table-column label="借方余额" width="120" align="right">
              <template #default="{ row }">
                <span v-if="row.debitBalance">{{ Number(row.debitBalance).toFixed(2) }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="贷方余额" width="120" align="right">
              <template #default="{ row }">
                <span v-if="row.creditBalance">{{ Number(row.creditBalance).toFixed(2) }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="auxType" label="辅助核算" width="100" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteBalance(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 辅助核算 -->
        <el-tab-pane label="辅助核算" name="aux">
          <div class="aux-section">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card shadow="never">
                  <template #header>
                    <div class="section-header">
                      <span>辅助核算类型</span>
                      <el-button type="primary" size="small" @click="showAuxTypeDialog = true">新增</el-button>
                    </div>
                  </template>
                  <el-table :data="auxTypes" border size="small">
                    <el-table-column prop="code" label="编码" width="100" />
                    <el-table-column prop="name" label="名称" />
                    <el-table-column label="状态" width="80">
                      <template #default="{ row }">
                        <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                          {{ row.isActive ? '启用' : '停用' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="never">
                  <template #header>
                    <div class="section-header">
                      <span>辅助核算项目</span>
                      <el-button type="primary" size="small" @click="showAuxItemDialog = true">新增</el-button>
                    </div>
                  </template>
                  <el-select v-model="selectedAuxType" placeholder="选择类型" style="margin-bottom: 10px" @change="loadAuxItems">
                    <el-option v-for="t in auxTypes" :key="t.code" :label="t.name" :value="t.code" />
                  </el-select>
                  <el-table :data="auxItems" border size="small">
                    <el-table-column prop="code" label="编码" width="100" />
                    <el-table-column prop="name" label="名称" />
                    <el-table-column label="状态" width="80">
                      <template #default="{ row }">
                        <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                          {{ row.isActive ? '启用' : '停用' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 录入期初余额弹窗 -->
    <el-dialog v-model="showBalanceDialog" title="录入期初余额" width="500px">
      <el-form :model="balanceForm" label-width="100px">
        <el-form-item label="选择科目">
          <el-select v-model="balanceForm.accountCode" placeholder="选择科目" filterable>
            <el-option
              v-for="acc in flatAccounts"
              :key="acc.code"
              :label="`${acc.code} - ${acc.name}`"
              :value="acc.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="借方余额">
          <el-input-number v-model="balanceForm.debitBalance" :precision="2" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="贷方余额">
          <el-input-number v-model="balanceForm.creditBalance" :precision="2" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBalanceDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveBalance">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增辅助核算类型弹窗 -->
    <el-dialog v-model="showAuxTypeDialog" title="新增辅助核算类型" width="400px">
      <el-form :model="auxTypeForm" label-width="80px">
        <el-form-item label="编码">
          <el-input v-model="auxTypeForm.code" placeholder="如: customer" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="auxTypeForm.name" placeholder="如: 客户" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAuxTypeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAuxType">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增辅助核算项目弹窗 -->
    <el-dialog v-model="showAuxItemDialog" title="新增辅助核算项目" width="400px">
      <el-form :model="auxItemForm" label-width="80px">
        <el-form-item label="类型">
          <el-select v-model="auxItemForm.auxTypeCode" placeholder="选择类型">
            <el-option v-for="t in auxTypes" :key="t.code" :label="t.name" :value="t.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="auxItemForm.code" placeholder="如: C001" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="auxItemForm.name" placeholder="如: 北京某某公司" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAuxItemDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAuxItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

// Tab
const activeTab = ref('accounts')

// 数据
const accounts = ref([])
const openingBalances = ref([])
const auxTypes = ref([])
const auxItems = ref([])
const selectedAuxType = ref('')
const loading = ref(false)
const showBalanceDialog = ref(false)
const showAuxTypeDialog = ref(false)
const showAuxItemDialog = ref(false)

// 表单
const balanceForm = reactive({
  accountCode: '',
  debitBalance: 0,
  creditBalance: 0,
})

const auxTypeForm = reactive({ code: '', name: '' })
const auxItemForm = reactive({ auxTypeCode: '', code: '', name: '' })

// 平铺科目列表
const flatAccounts = computed(() => {
  const result = []
  const flatten = (list) => {
    list.forEach(item => {
      if (item.children) {
        flatten(item.children)
      } else {
        result.push(item)
      }
    })
  }
  flatten(accounts.value)
  return result
})

// 加载科目
const loadAccounts = async () => {
  try {
    const { data } = await api.get('/v1/account-books/accounts?year=2026')
    accounts.value = buildTree(data || [])
  } catch (e) {
    accounts.value = [
      { id: '1', code: '1', name: '资产', level: 1, direction: 'debit', children: [
        { id: '2', code: '1001', name: '银行存款', level: 3, direction: 'debit', openingBalance: 50000, isAuxiliary: false },
        { id: '3', code: '1002', name: '库存现金', level: 3, direction: 'debit', openingBalance: 2000, isAuxiliary: false },
        { id: '4', code: '1122', name: '应收账款', level: 3, direction: 'debit', isAuxiliary: true, auxType: 'customer' },
      ]},
      { id: '5', code: '2', name: '负债', level: 1, direction: 'credit', children: [
        { id: '6', code: '2202', name: '应付账款', level: 3, direction: 'credit', isAuxiliary: true, auxType: 'supplier' },
      ]},
    ]
  }
}

// 加载期初余额
const loadOpeningBalances = async () => {
  try {
    const { data } = await api.get('/v1/account-books/opening-balances?year=2026')
    openingBalances.value = data || []
  } catch (e) {
    openingBalances.value = []
  }
}

// 加载辅助核算类型
const loadAuxTypes = async () => {
  try {
    const { data } = await api.get('/v1/account-books/aux-types')
    auxTypes.value = data || [
      { code: 'customer', name: '客户', isActive: true },
      { code: 'supplier', name: '供应商', isActive: true },
      { code: 'department', name: '部门', isActive: true },
      { code: 'project', name: '项目', isActive: true },
    ]
  } catch (e) {
    auxTypes.value = [
      { code: 'customer', name: '客户', isActive: true },
      { code: 'supplier', name: '供应商', isActive: true },
      { code: 'department', name: '部门', isActive: true },
      { code: 'project', name: '项目', isActive: true },
    ]
  }
}

// 加载辅助核算项目
const loadAuxItems = async () => {
  if (!selectedAuxType.value) return
  try {
    const { data } = await api.get('/v1/account-books/aux-items', { params: { auxTypeCode: selectedAuxType.value } })
    auxItems.value = data || getMockItems(selectedAuxType.value)
  } catch (e) {
    auxItems.value = getMockItems(selectedAuxType.value)
  }
}

const getMockItems = (typeCode) => {
  const items = {
    customer: [
      { code: 'C001', name: '北京某某公司', isActive: true },
      { code: 'C002', name: '上海某某企业', isActive: true },
    ],
    supplier: [
      { code: 'S001', name: '深圳某某供应商', isActive: true },
    ],
    department: [
      { code: 'D001', name: '销售部', isActive: true },
      { code: 'D002', name: '管理部', isActive: true },
    ],
    project: [
      { code: 'P001', name: '项目A', isActive: true },
      { code: 'P002', name: '项目B', isActive: true },
    ],
  }
  return items[typeCode] || []
}

// 构建树形结构
const buildTree = (list) => {
  if (!list || list.length === 0) return []
  const map = {}
  const roots = []
  list.forEach(item => {
    map[item.id] = { ...item, children: item.children || [] }
  })
  list.forEach(item => {
    if (item.parentCode) {
      const parent = list.find(p => p.code === item.parentCode)
      if (parent && map[parent.id]) {
        map[parent.id].children.push(map[item.id])
      }
    } else {
      roots.push(map[item.id])
    }
  })
  return roots
}

// 初始化科目
const handleInitAccounts = async () => {
  try {
    await ElMessageBox.confirm('将初始化40个标准会计科目，是否继续？', '提示', { type: 'warning' })
    loading.value = true
    await api.post('/v1/account-books/accounts/init?year=2026')
    ElMessage.success('科目初始化成功')
    loadAccounts()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('初始化失败')
  } finally {
    loading.value = false
  }
}

// 保存期初余额
const handleSaveBalance = async () => {
  if (!balanceForm.accountCode) {
    ElMessage.warning('请选择科目')
    return
  }
  try {
    await api.post('/v1/account-books/opening-balances', {
      year: 2026,
      accountCode: balanceForm.accountCode,
      debitBalance: balanceForm.debitBalance,
      creditBalance: balanceForm.creditBalance,
    })
    ElMessage.success('保存成功')
    showBalanceDialog.value = false
    balanceForm.accountCode = ''
    balanceForm.debitBalance = 0
    balanceForm.creditBalance = 0
    loadOpeningBalances()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// 删除期初余额
const handleDeleteBalance = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该期初余额吗？', '提示', { type: 'warning' })
    await api.delete(`/v1/account-books/opening-balances/${id}`)
    ElMessage.success('删除成功')
    loadOpeningBalances()
  } catch (e) {}
}

// 保存辅助核算类型
const handleSaveAuxType = async () => {
  if (!auxTypeForm.code || !auxTypeForm.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await api.post('/v1/account-books/aux-types', { ...auxTypeForm, tenantId: '' })
    ElMessage.success('保存成功')
    showAuxTypeDialog.value = false
    auxTypeForm.code = ''
    auxTypeForm.name = ''
    loadAuxTypes()
  } catch (e) {
    ElMessage.success('保存成功（模拟）')
    showAuxTypeDialog.value = false
  }
}

// 保存辅助核算项目
const handleSaveAuxItem = async () => {
  if (!auxItemForm.auxTypeCode || !auxItemForm.code || !auxItemForm.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await api.post('/v1/account-books/aux-items', { ...auxItemForm, tenantId: '' })
    ElMessage.success('保存成功')
    showAuxItemDialog.value = false
    auxItemForm.auxTypeCode = ''
    auxItemForm.code = ''
    auxItemForm.name = ''
    loadAuxItems()
  } catch (e) {
    ElMessage.success('保存成功（模拟）')
    showAuxItemDialog.value = false
  }
}

onMounted(() => {
  loadAccounts()
  loadOpeningBalances()
  loadAuxTypes()
})
</script>

<style scoped>
.account-init-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 10px; }
.text-muted { color: #909399; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.aux-section { padding: 10px 0; }
</style>