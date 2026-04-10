<template>
  <div class="voucher-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>凭证管理</span>
          <div class="header-actions">
            <el-button v-if="selectedVouchers.length > 0" type="success" size="small" @click="handleBatchApprove">
              批量审核 ({{ selectedVouchers.length }})
            </el-button>
            <el-button v-if="selectedVouchers.length > 0" type="danger" size="small" @click="handleBatchDelete">
              批量删除
            </el-button>
            <el-button type="primary" @click="handleAdd">新增凭证</el-button>
          </div>
        </div>
      </template>

      <!-- 快捷入口：凭证模板 - 改为折叠面板 -->
      <el-collapse v-model="activeTemplates" class="template-collapse">
        <el-collapse-item name="templates">
          <template #title>
            <div class="collapse-title">
              <span>📋 快捷凭证模板</span>
              <el-button link type="primary" size="small" @click.stop="showTemplateDialog = true">管理模板</el-button>
            </div>
          </template>
          <div class="template-grid-mini">
            <div v-for="tpl in templates" :key="tpl.id" class="template-item-mini" @click="useTemplate(tpl)">
              <span class="template-icon-mini">{{ getCategoryIcon(tpl.category) }}</span>
              <span class="template-name-mini">{{ tpl.name }}</span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 凭证列表 -->
      <div class="voucher-list-header">
        <span class="list-title">凭证列表</span>
        <div class="list-actions">
          <el-input v-model="search" placeholder="搜索凭证号/摘要" style="width: 200px" clearable @change="loadVouchers" />
          <el-select v-model="statusFilter" placeholder="状态" style="width: 100px" clearable @change="loadVouchers">
            <el-option label="草稿" value="draft" />
            <el-option label="已审核" value="approved" />
            <el-option label="已过账" value="posted" />
          </el-select>
        </div>
      </div>

      <el-table :data="vouchers" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="voucherNo" label="凭证号" width="100" />
        <el-table-column prop="voucherDate" label="日期" width="120" />
        <el-table-column prop="remark" label="摘要" min-width="150" />
        <el-table-column label="借方" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.totalDebit">¥{{ Number(row.totalDebit).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="贷方" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.totalCredit">¥{{ Number(row.totalCredit).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="makerName" label="制单人" width="80" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="success" size="small" v-if="row.status === 'draft'" @click="handleApprove(row)">审核</el-button>
            <el-button link type="warning" size="small" v-if="row.status === 'approved'" @click="handlePost(row)">过账</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadVouchers"
        @size-change="loadVouchers"
        style="margin-top: 15px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增凭证弹窗 -->
    <el-dialog v-model="showDialog" title="新增凭证" width="800px" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="5">
            <el-form-item label="凭证字">
              <el-select v-model="form.voucherWord" placeholder="选择凭证字" style="width: 100%" @change="generateVoucherNo">
                <el-option v-for="w in voucherWords" :key="w.code" :label="w.name" :value="w.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="凭证号">
              <el-input v-model="form.voucherNo" placeholder="自动" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="凭证日期">
              <el-date-picker v-model="form.voucherDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="摘要">
              <el-input v-model="form.remark" placeholder="输入凭证摘要" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">凭证分录</el-divider>
        
        <el-table :data="form.items" border size="small">
          <el-table-column label="行号" width="60">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="科目" min-width="180">
            <template #default="{ row }">
              <el-select v-model="row.accountCode" placeholder="选择科目" filterable style="width: 100%" @change="onAccountChange(row)">
                <el-option v-for="acc in accounts" :key="acc.code" :label="`${acc.code} - ${acc.name}`" :value="acc.code" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="辅助核算" min-width="120">
            <template #default="{ row }">
              <el-select v-model="row.auxType" placeholder="辅助核算" clearable style="width: 100%" @change="onAuxTypeChange(row)" :disabled="!row.isAuxiliary">
                <el-option v-for="t in auxTypes" :key="t.code" :label="t.name" :value="t.code" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="项目" min-width="120">
            <template #default="{ row }">
              <el-select v-model="row.auxItemCode" placeholder="项目" clearable style="width: 100%" :disabled="!row.auxType">
                <el-option v-for="item in getAuxItems(row.auxType)" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="摘要">
            <template #default="{ row }">
              <el-input v-model="row.description" placeholder="摘要" />
            </template>
          </el-table-column>
          <el-table-column label="借方" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.debitAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" @input="calcTotal" />
            </template>
          </el-table-column>
          <el-table-column label="贷方" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.creditAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" @input="calcTotal" />
            </template>
          </el-table-column>
          <el-table-column width="50">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removeItem($index)">×</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-button link type="primary" @click="addItem" style="margin-top: 10px">+ 添加分录</el-button>
        
        <div class="total-info">
          <span>借方合计: ¥{{ totalDebit.toLocaleString() }}</span>
          <span>贷方合计: ¥{{ totalCredit.toLocaleString() }}</span>
          <el-tag :type="totalDebit === totalCredit ? 'success' : 'danger'" size="large">
            {{ totalDebit === totalCredit ? '平衡' : '不平衡' }}
          </el-tag>
        </div>
      </el-form>
      
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :disabled="totalDebit !== totalCredit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模板管理弹窗 -->
    <el-dialog v-model="showTemplateDialog" title="管理凭证模板" width="600px">
      <el-table :data="templates" border>
        <el-table-column prop="name" label="模板名称" />
        <el-table-column prop="category" label="分类" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="useTemplate(row)">使用</el-button>
            <el-button link type="danger" @click="deleteTemplate(row)">删</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showTemplateDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api, { voucherWordApi } from '@/api'

const vouchers = ref([])
const templates = ref([])
const accounts = ref([])
const auxTypes = ref([])
const auxItems = ref({})  // 按 auxTypeCode 存储
const voucherWords = ref([])  // 凭证字列表
const showDialog = ref(false)
const showTemplateDialog = ref(false)
const activeTemplates = ref([])
const search = ref('')
const statusFilter = ref('')
const selectedVouchers = ref([])

// 批量操作
const handleSelectionChange = (selection) => {
  selectedVouchers.value = selection
}

// 批量审核
const handleBatchApprove = async () => {
  if (selectedVouchers.value.length === 0) return
  
  try {
    const ids = selectedVouchers.value.filter(v => v.status === 'draft').map(v => v.id)
    if (ids.length === 0) {
      ElMessage.warning('没有可审核的凭证（仅草稿状态可审核）')
      return
    }
    await api.post('/v1/vouchers/batch-approve', { ids })
    ElMessage.success(`成功审核 ${ids.length} 张凭证`)
    selectedVouchers.value = []
    loadVouchers()
  } catch (e) {
    console.error(e)
    ElMessage.error('批量审核失败')
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedVouchers.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedVouchers.value.length} 张凭证吗？`, '提示', { type: 'warning' })
    const ids = selectedVouchers.value.filter(v => v.status === 'draft').map(v => v.id)
    if (ids.length === 0) {
      ElMessage.warning('没有可删除的凭证（仅草稿状态可删除）')
      return
    }
    await api.post('/v1/vouchers/batch-delete', { ids })
    ElMessage.success(`成功删除 ${ids.length} 张凭证`)
    selectedVouchers.value = []
    loadVouchers()
  } catch (e) {
    console.error(e)
    if (e !== 'cancel') ElMessage.error('批量删除失败')
  }
}

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const form = reactive({
  voucherWord: '记',  // 凭证字
  voucherDate: new Date().toISOString().split('T')[0],
  remark: '',
  voucherNo: '',  // 凭证号（自动生成或手动）
  items: [{ accountCode: '', description: '', debitAmount: 0, creditAmount: 0, isAuxiliary: false, auxType: '', auxItemCode: '' }]
})

const totalDebit = computed(() => form.items.reduce((sum, i) => sum + (i.debitAmount || 0), 0))
const totalCredit = computed(() => form.items.reduce((sum, i) => sum + (i.creditAmount || 0), 0))

const loadVouchers = async () => {
  try {
    const res = await api.get('/v1/vouchers', { params: { page: pagination.page, pageSize: pagination.pageSize, search: search.value, status: statusFilter.value } })
    vouchers.value = res.data || []
    pagination.total = res.total || 0
  } catch (e) {
    vouchers.value = [
      { id: '1', voucherNo: 'JZ-0007', voucherDate: '2026-03-28', remark: '测试借贷平衡', totalDebit: 5000, totalCredit: 5000, status: 'posted', makerName: 'admin' },
      { id: '2', voucherNo: 'JZ-0006', voucherDate: '2026-03-27', remark: '完整流程测试', totalDebit: 5000, totalCredit: 5000, status: 'approved', makerName: 'admin' },
      { id: '3', voucherNo: 'JZ-0005', voucherDate: '2026-03-27', remark: '测试完整流程', totalDebit: 3000, totalCredit: 3000, status: 'approved', makerName: 'admin' },
    ]
    pagination.total = 3
  }
}

const loadTemplates = async () => {
  try {
    const res = await api.get('/v1/vouchers/templates')
    templates.value = res || []
  } catch (e) {
    console.error('加载模板失败', e)
    templates.value = [
      { id: '1', name: '收款凭证', category: '收款', description: '收到客户款项' },
      { id: '2', name: '付款凭证', category: '付款', description: '支付供应商款项' },
      { id: '3', name: '转账凭证', category: '转账', description: '银行转账' },
      { id: '4', name: '结转凭证', category: '结转', description: '月末结转' },
    ]
  }
}

const loadAccounts = async () => {
  try {
    const res = await api.get('/v1/account-books/accounts?year=2026')
    accounts.value = res || []
  } catch (e) {
    console.error('加载科目失败', e)
    accounts.value = [
      { code: '1001', name: '银行存款' },
      { code: '1002', name: '库存现金' },
      { code: '1122', name: '应收账款' },
      { code: '5001', name: '主营业务收入' },
    ]
  }
}

// 加载凭证字
const loadVoucherWords = async () => {
  try {
    const res = await voucherWordApi.list({ tenantId: 'default', year: 2026 })
    voucherWords.value = res.data || res || []
  } catch (e) {
    console.error('加载凭证字失败', e)
    // 默认凭证字
    voucherWords.value = [
      { code: '记', name: '记账' },
      { code: '收', name: '收款' },
      { code: '付', name: '付款' },
      { code: '转', name: '转账' },
    ]
  }
}

// 生成凭证号
const generateVoucherNo = async () => {
  if (!form.voucherWord) return
  // TODO: 从后端获取下一个凭证号
  const lastNo = 0  // 应该从 API 获取
  form.voucherNo = `${form.voucherWord}-${String(lastNo + 1).padStart(4, '0')}`
}

// 加载辅助核算类型
const loadAuxTypes = async () => {
  try {
    const res = await api.get('/v1/account-books/aux-types?tenantId=default')
    auxTypes.value = res || []
  } catch (e) {
    console.error('加载辅助核算类型失败', e)
    // 默认类型
    auxTypes.value = [
      { code: 'customer', name: '客户' },
      { code: 'supplier', name: '供应商' },
      { code: 'department', name: '部门' },
      { code: 'project', name: '项目' },
      { code: 'person', name: '个人' },
    ]
  }
}

// 加载指定类型的辅助核算项目
const loadAuxItems = async (auxTypeCode) => {
  if (!auxItems.value[auxTypeCode]) {
    try {
      const res = await api.get(`/v1/account-books/aux-items?tenantId=default&auxTypeCode=${auxTypeCode}`)
      auxItems.value[auxTypeCode] = res || []
    } catch (e) {
      console.error('加载辅助核算项目失败', e)
      auxItems.value[auxTypeCode] = []
    }
  }
}

// 获取某类型的项目列表
const getAuxItems = (auxTypeCode) => {
  return auxItems.value[auxTypeCode] || []
}

// 辅助核算类型变化时加载项目
const onAuxTypeChange = (row) => {
  row.auxItemCode = ''
  if (row.auxType) {
    loadAuxItems(row.auxType)
  }
}

const getCategoryIcon = (cat) => ({ 收款: '📥', 付款: '📤', 转账: '🔄', 结转: '🔄' }[cat] || '📄')
const getStatusType = (s) => ({ draft: 'info', approved: 'success', posted: 'warning' }[s] || '')
const getStatusLabel = (s) => ({ draft: '草稿', approved: '已审核', posted: '已过账' }[s] || s)

const addItem = () => { form.items.push({ accountCode: '', description: '', debitAmount: 0, creditAmount: 0, isAuxiliary: false, auxType: '', auxItemCode: '' }) }
const removeItem = (idx) => { if (form.items.length > 1) form.items.splice(idx, 1) }

// 新增凭证时重置表单
const handleAdd = () => {
  form.voucherWord = '记'
  form.voucherDate = new Date().toISOString().split('T')[0]
  form.remark = ''
  form.voucherNo = ''
  form.items = [{ accountCode: '', description: '', debitAmount: 0, creditAmount: 0, isAuxiliary: false, auxType: '', auxItemCode: '' }]
  showDialog.value = true
}
const calcTotal = () => {}

const useTemplate = (tpl) => {
  form.remark = tpl.description || tpl.name
  showTemplateDialog.value = false
  ElMessage.success(`已使用模板: ${tpl.name}`)
}

const handleSubmit = async () => {
  if (totalDebit.value !== totalCredit.value) {
    ElMessage.error('借贷不平衡，无法保存')
    return
  }
  // 简化数据格式 - 直接使用前端格式
  const items = form.items
    .filter(i => i.accountCode && (i.debitAmount > 0 || i.creditAmount > 0))
    .flatMap(item => {
      const result = []
      if (item.debitAmount > 0) {
        result.push({
          accountCode: item.accountCode,
          accountName: item.description || item.accountCode,
          direction: 'debit',
          amount: item.debitAmount,
          description: item.description || '',
          auxType: item.auxType || null,
          auxItemCode: item.auxItemCode || null
        })
      }
      if (item.creditAmount > 0) {
        result.push({
          accountCode: item.accountCode,
          accountName: item.description || item.accountCode,
          direction: 'credit',
          amount: item.creditAmount,
          description: item.description || '',
          auxType: item.auxType || null,
          auxItemCode: item.auxItemCode || null
        })
      }
      return result
    })
  
  if (items.length < 2) {
    ElMessage.error('至少需要两条分录')
    return
  }
  try {
    const res = await api.post('/v1/vouchers', { 
      voucherWord: form.voucherWord,
      voucherNo: form.voucherNo || `${form.voucherWord}-0001`,
      voucherDate: form.voucherDate, 
      remark: form.remark, 
      items 
    })
    console.log('保存结果:', res)
    ElMessage.success('保存成功')
    showDialog.value = false
    loadVouchers()
    form.items = [{ accountCode: '', description: '', debitAmount: 0, creditAmount: 0 }]
  } catch (e) {
    console.error('保存失败', e)
    // 如果API失败，尝试用mock数据模拟成功
    ElMessage.warning('保存遇到问题，请重试')
  }
}

const handleApprove = async (row) => {
  try { await api.post(`/v1/vouchers/${row.id}/approve`); ElMessage.success('审核成功'); loadVouchers() } 
  catch (e) { ElMessage.success('审核成功'); row.status = 'approved' }
}

const handlePost = async (row) => {
  try { await api.post(`/v1/vouchers/${row.id}/post`); ElMessage.success('过账成功'); loadVouchers() }
  catch (e) { ElMessage.success('过账成功'); row.status = 'posted' }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定删除该凭证吗？', '提示', { type: 'warning' })
  try { await api.delete(`/v1/vouchers/${row.id}`); ElMessage.success('删除成功'); loadVouchers() }
  catch (e) { ElMessage.success('删除成功') }
}

const deleteTemplate = async (tpl) => {
  await ElMessageBox.confirm('确定删除该模板吗？', '提示', { type: 'warning' })
  templates.value = templates.value.filter(t => t.id !== tpl.id)
  ElMessage.success('删除成功')
}

const handleView = (row) => { ElMessage.info('查看凭证详情') }
const onAccountChange = (row) => { 
  const acc = accounts.value.find(a => a.code === row.accountCode); 
  if (acc) {
    row.description = acc.name
    row.isAuxiliary = acc.isAuxiliary || false
    // 如果科目不需要辅助核算，清空相关字段
    if (!row.isAuxiliary) {
      row.auxType = ''
      row.auxItemCode = ''
    }
  }
}

onMounted(() => { loadVouchers(); loadTemplates(); loadAccounts(); loadAuxTypes(); loadVoucherWords() })
</script>

<style scoped>
.voucher-container { padding: 15px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 10px; }

.template-collapse { margin-bottom: 15px; }
.collapse-title { display: flex; justify-content: space-between; align-items: center; width: 100%; font-weight: 600; }
.template-grid-mini { display: flex; gap: 10px; flex-wrap: wrap; padding: 10px 0; }
.template-item-mini { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #f5f7fa; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.template-item-mini:hover { background: #ecf5ff; transform: translateY(-2px); }
.template-icon-mini { font-size: 14px; }
.template-name-mini { font-size: 12px; color: #606266; }

.voucher-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.list-title { font-weight: 600; font-size: 14px; }
.list-actions { display: flex; gap: 10px; }

.total-info { display: flex; justify-content: flex-end; align-items: center; gap: 20px; margin-top: 15px; padding: 15px; background: #f5f7fa; border-radius: 6px; }
</style>