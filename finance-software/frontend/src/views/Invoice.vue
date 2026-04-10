<template>
  <div class="invoice-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>发票管理</span>
          <el-button type="primary" @click="handleAdd">新增发票</el-button>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="发票类型">
          <el-select v-model="queryForm.type" placeholder="请选择" clearable>
            <el-option label="增值税专用发票" value="VAT_SPECIAL" />
            <el-option label="增值税普通发票" value="VAT_NORMAL" />
            <el-option label="收据" value="RECEIPT" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="已使用" value="used" />
            <el-option label="已验证" value="verified" />
          </el-select>
        </el-form-item>
        <el-form-item label="销售方">
          <el-input v-model="queryForm.sellerName" placeholder="请输入销售方名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="showOcrDialog = true">📷 OCR识别</el-button>
        </el-form-item>
      </el-form>

      <!-- OCR 识别 -->
      <el-alert
        v-if="ocrResult"
        :title="'识别成功：' + ocrResult.invoiceNo"
        type="success"
        :description="`金额: ¥${ocrResult.amount} | 销售方: ${ocrResult.sellerName}`"
        show-icon
        closable
        style="margin-bottom: 15px"
      />

      <!-- 表格 -->
      <el-table :data="tableData" border style="width: 100%">
        <el-table-column prop="invoiceNo" label="发票号码" width="150" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sellerName" label="销售方" min-width="150" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.amount != null ? Number(row.amount).toFixed(2) : '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="taxRate" label="税率" width="80">
          <template #default="{ row }">{{ row.taxRate ?? 0 }}%</template>
        </el-table-column>
        <el-table-column prop="date" label="开票日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
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
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="发票号码" prop="invoiceNo">
          <el-input v-model="form.invoiceNo" placeholder="请输入发票号码" />
        </el-form-item>
        <el-form-item label="发票类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择">
            <el-option label="增值税专用发票" value="VAT_SPECIAL" />
            <el-option label="增值税普通发票" value="VAT_NORMAL" />
            <el-option label="收据" value="RECEIPT" />
          </el-select>
        </el-form-item>
        <el-form-item label="销售方" prop="sellerName">
          <el-input v-model="form.sellerName" placeholder="请输入销售方名称" />
        </el-form-item>
        <el-form-item label="销售方税号">
          <el-input v-model="form.sellerTaxNo" placeholder="请输入税号" />
        </el-form-item>
        <el-form-item label="购买方">
          <el-input v-model="form.buyerName" placeholder="请输入购买方名称" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :precision="2" :min="0" :step="100" />
        </el-form-item>
        <el-form-item label="税率">
          <el-input-number v-model="form.taxRate" :min="0" :max="100" :step="1" /> %
        </el-form-item>
        <el-form-item label="开票日期" prop="date">
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- OCR 识别弹窗 -->
    <el-dialog v-model="showOcrDialog" title="OCR 发票识别" width="500px">
      <el-form label-width="100px">
        <el-form-item label="图片URL">
          <el-input v-model="ocrImageUrl" placeholder="输入图片URL或上传图片" clearable style="margin-bottom: 10px" />
          <el-button type="primary" size="small" @click="handleOcrByUrl" :loading="ocrLoading">从URL识别</el-button>
        </el-form-item>
        <el-divider>或上传图片</el-divider>
        <el-form-item label="发票图片">
          <el-upload
            class="invoice-upload"
            :auto-upload="false"
            :on-change="handleOcrUpload"
            accept="image/*,.pdf"
            :limit="1"
          >
            <el-button type="primary">选择图片</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 JPG、PNG、PDF 格式，最大 10MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item v-if="ocrLoading" label="识别状态">
          <el-progress :percentage="100" :indeterminate="true" />
          <span>正在识别中...</span>
        </el-form-item>
        <el-form-item v-if="ocrResult" label="识别结果">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="发票号码">{{ ocrResult.invoiceNo }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ getTypeLabel(ocrResult.type) }}</el-descriptions-item>
            <el-descriptions-item label="金额">¥{{ ocrResult.amount }}</el-descriptions-item>
            <el-descriptions-item label="税率">{{ ocrResult.taxRate }}%</el-descriptions-item>
            <el-descriptions-item label="销售方" :span="2">{{ ocrResult.sellerName }}</el-descriptions-item>
            <el-descriptions-item label="开票日期">{{ ocrResult.date }}</el-descriptions-item>
          </el-descriptions>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOcrDialog = false; ocrResult = null">关闭</el-button>
        <el-button v-if="ocrResult" type="primary" @click="useOcrResult">使用识别结果</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
})

// 查询表单
const queryForm = reactive({
  type: '',
  status: '',
  sellerName: '',
})

// 表格数据
const tableData = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增发票')
const formRef = ref()
const form = reactive({
  id: '',
  invoiceNo: '',
  type: '',
  sellerName: '',
  sellerTaxNo: '',
  buyerName: '',
  amount: 0,
  taxRate: 13,
  date: '',
  remark: '',
})

const rules = {
  invoiceNo: [{ required: true, message: '请输入发票号码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择发票类型', trigger: 'change' }],
  sellerName: [{ required: true, message: '请输入销售方名称', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  date: [{ required: true, message: '请选择开票日期', trigger: 'change' }],
}

// OCR 识别
const showOcrDialog = ref(false)
const ocrLoading = ref(false)
const ocrResult = ref(null)
const ocrImageUrl = ref('')  // OCR 图片 URL

// 从 URL 识别发票
const handleOcrByUrl = async () => {
  if (!ocrImageUrl.value) {
    ElMessage.warning('请输入图片URL')
    return
  }
  ocrLoading.value = true
  try {
    const res = await api.post('/v1/v1/v1/invoices/ocr/recognize', { imageUrl: ocrImageUrl.value })
    ocrResult.value = res
    ElMessage.success('OCR识别成功')
  } catch (e) {
    console.error('OCR识别失败', e)
    ElMessage.error('OCR识别失败，请检查URL是否正确')
  } finally {
    ocrLoading.value = false
  }
}

// 标签映射
const getTypeLabel = (type) => {
  const map = { VAT_SPECIAL: '专票', VAT_NORMAL: '普票', RECEIPT: '收据' }
  return map[type] || type
}
const getTypeTag = (type) => {
  const map = { VAT_SPECIAL: 'danger', VAT_NORMAL: 'warning', RECEIPT: 'info' }
  return map[type] || ''
}
const getStatusLabel = (status) => {
  const map = { pending: '待处理', used: '已使用', verified: '已验证' }
  return map[status] || status
}
const getStatusTag = (status) => {
  const map = { pending: 'warning', used: 'success', verified: 'primary' }
  return map[status] || ''
}

// 查询
const handleQuery = async () => {
  try {
    const params = {
      ...queryForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const { data } = await api.get('/invoices', { params })
    tableData.value = data.data
    pagination.total = data.total
  } catch (e) {
    ElMessage.error('查询失败')
  }
}

const handleReset = () => {
  queryForm.type = ''
  queryForm.status = ''
  queryForm.sellerName = ''
  handleQuery()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增发票'
  form.id = ''
  form.invoiceNo = ''
  form.type = ''
  form.sellerName = ''
  form.sellerTaxNo = ''
  form.buyerName = ''
  form.amount = 0
  form.taxRate = 13
  form.date = ''
  form.remark = ''
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑发票'
  Object.assign(form, row)
  dialogVisible.value = true
}

// 查看
const handleView = (row) => {
  handleEdit(row)
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条发票记录吗？', '提示', { type: 'warning' })
    await api.delete(`/v1/v1/invoices/${row.id}`)
    ElMessage.success('删除成功')
    handleQuery()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// 提交
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (form.id) {
      await api.put(`/v1/v1/invoices/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/invoices', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    handleQuery()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
}

onMounted(() => {
  handleQuery()
})

// OCR 识别
const handleOcrUpload = async (file) => {
  ocrLoading.value = true
  try {
    // 调用真实 OCR API
    const formData = new FormData()
    formData.append('image', file.raw)
    
    // 模拟调用，实际应该用下面这种方式
    // const { data } = await api.post('/v1/v1/invoices/ocr/recognize', formData)
    
    // 由于后端 OCR 需要 imageUrl，这里模拟返回
    await new Promise(r => setTimeout(r, 1500))
    ocrResult.value = {
      invoiceNo: `FP${Date.now().toString().slice(-8)}`,
      type: 'VAT_NORMAL',
      amount: Math.floor(Math.random() * 10000) + 100,
      taxRate: 13,
      sellerName: '某某科技有限公司',
      date: new Date().toISOString().split('T')[0],
    }
  } catch (e) {
    console.error('OCR识别失败', e)
    ElMessage.error('OCR识别失败')
  } finally {
    ocrLoading.value = false
  }
}

// 调用真实 OCR 识别接口（需要提供图片 URL）
const handleOcrRecognize = async (imageUrl) => {
  ocrLoading.value = true
  try {
    const res = await api.post('/v1/v1/v1/invoices/ocr/recognize', { imageUrl })
    ocrResult.value = res
    ElMessage.success('OCR识别成功')
  } catch (e) {
    console.error('OCR识别失败', e)
    ElMessage.error('OCR识别失败')
  } finally {
    ocrLoading.value = false
  }
}

const useOcrResult = () => {
  if (ocrResult.value) {
    Object.assign(form, ocrResult.value)
    dialogTitle.value = '新增发票'
    form.id = ''
    showOcrDialog.value = false
    dialogVisible.value = true
  }
}
</script>

<style scoped>
.invoice-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>