<template>
  <div class="campus-management">
    <!-- 操作栏 -->
    <div class="operation-bar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索校区名称或地址"
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="action-section">
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleAdd"
          class="action-btn"
        >
          添加校区
        </el-button>
        <el-button
          type="default"
          :icon="Refresh"
          @click="refreshData"
          class="action-btn"
        >
          刷新
        </el-button>
      </div>
    </div>
    
    <!-- 校区列表 -->
    <div class="table-container">
      <el-table
        :data="campusList"
        v-loading="loading"
        class="campus-table"
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="name" label="校区名称" min-width="150" />
        
        <el-table-column prop="address" label="地址" min-width="200" />
        
        <el-table-column prop="canteenCount" label="食堂数量" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small" class="count-tag">
              {{ row.canteenCount }} 个
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
              @change="handleStatusChange(row)"
              class="status-switch"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
              class="edit-btn"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              class="delete-btn"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </div>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      class="campus-dialog"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        class="campus-form"
      >
        <el-form-item label="校区名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入校区名称"
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item label="校区地址" prop="address">
          <el-input
            v-model="formData.address"
            placeholder="请输入校区地址"
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item label="校区描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入校区描述（可选）"
            class="form-input"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-btn">
            取消
          </el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitLoading"
            class="submit-btn"
          >
            {{ submitLoading ? '提交中...' : '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { 
  getCampusList, 
  addCampus, 
  updateCampus, 
  deleteCampus, 
  updateCampusStatus,
  type CampusItem,
  type CampusFormData
} from '../api/campus'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const searchKeyword = ref('')
const campusList = ref<CampusItem[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 分页数据
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 表单数据
const formData = reactive<CampusFormData>({
  name: '',
  address: '',
  description: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入校区名称', trigger: 'blur' },
    { min: 2, max: 50, message: '校区名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入校区地址', trigger: 'blur' },
    { min: 5, max: 200, message: '校区地址长度在 5 到 200 个字符', trigger: 'blur' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => isEdit.value ? '编辑校区' : '添加校区')

// 获取校区列表
const fetchCampusList = async () => {
  loading.value = true
  
  try {
    const response = await getCampusList({
      page: pagination.page,
      pageSize: pagination.size,
      keyWord: searchKeyword.value
    })
    
    if (response.code === 1) {
      campusList.value = response.data.list || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.error(response.msg || '获取校区列表失败')
    }
    
  } catch (error: any) {
    console.error('获取校区列表失败:', error)
    ElMessage.error(error.msg || '获取校区列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchCampusList()
}

// 刷新数据
const refreshData = () => {
  searchKeyword.value = ''
  pagination.page = 1
  fetchCampusList()
}

// 添加校区
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑校区
const handleEdit = (campus: CampusItem) => {
  isEdit.value = true
  Object.assign(formData, {
    id: campus.id,
    name: campus.name,
    address: campus.address,
    description: campus.description || ''
  })
  dialogVisible.value = true
}

// 状态切换处理
const handleStatusChange = async (campus: CampusItem) => {
  try {
    await updateCampusStatus(campus.id!, campus.status)
    
    ElMessage.success(`校区${campus.name}状态已${campus.status ? '启用' : '禁用'}`)
  } catch (error: any) {
    // 恢复原状态
    campus.status = campus.status ? 0 : 1
    ElMessage.error(error.msg || '状态更新失败')
  }
}

// 删除校区
const handleDelete = async (campus: CampusItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除校区 "${campus.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await deleteCampus(campus.id!)
    
    ElMessage.success('校区删除成功')
    fetchCampusList()
    
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.msg || '删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    submitLoading.value = true
    
    if (isEdit.value) {
      await updateCampus((formData as any).id, formData)
      ElMessage.success('校区更新成功')
    } else {
      await addCampus(formData)
      ElMessage.success('校区添加成功')
    }
    
    dialogVisible.value = false
    fetchCampusList()
    
  } catch (error: any) {
    ElMessage.error(error.msg || (isEdit.value ? '更新失败' : '添加失败'))
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    name: '',
    address: '',
    description: ''
  })
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchCampusList()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchCampusList()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCampusList()
})
</script>

<style scoped lang="scss">
.campus-management {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.search-section {
  flex: 1;
  max-width: 400px;
}

.search-input {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    
    &:hover {
      border-color: #c0c0c0;
    }
    
    &.is-focus {
      border-color: #333333;
      box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.1);
    }
  }
}

.action-section {
  display: flex;
  gap: 12px;
}

.action-btn {
  border-radius: 8px;
  
  &.el-button--primary {
    background: #333333;
    border: none;
    
    &:hover {
      background: #555555;
    }
  }
}

.table-container {
  margin-bottom: 24px;
}

.campus-table {
  :deep(.el-table__header) {
    background: #f8f9fa;
    
    th {
      background: #f8f9fa;
      color: #333333;
      font-weight: 600;
    }
  }
  
  :deep(.el-table__row) {
    &:hover {
      background: #f8f9fa;
    }
  }
}

.count-tag {
  border-radius: 6px;
  border: none;
}

.status-switch {
  :deep(.el-switch__core) {
    border-radius: 12px;
    
    &.is-checked {
      background: #333333;
    }
  }
}

.edit-btn {
  border-radius: 6px;
  background: #333333;
  border: none;
  
  &:hover {
    background: #555555;
  }
}

.delete-btn {
  border-radius: 6px;
  
  &:hover {
    background: #f56565;
    border-color: #f56565;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
}

.pagination {
  :deep(.el-pagination__total),
  :deep(.el-pagination__jump) {
    color: #666666;
  }
  
  :deep(.el-pager li) {
    border-radius: 6px;
    margin: 0 2px;
    
    &.is-active {
      background: #333333;
      color: #ffffff;
    }
  }
  
  :deep(.btn-prev),
  :deep(.btn-next) {
    border-radius: 6px;
    
    &:hover {
      color: #333333;
    }
  }
}

.campus-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
  
  :deep(.el-dialog__header) {
    padding: 24px 24px 0;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #333333;
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 24px;
  }
}

.campus-form {
  .form-input {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      
      &:hover {
        border-color: #c0c0c0;
      }
      
      &.is-focus {
        border-color: #333333;
        box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.1);
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  border-radius: 8px;
}

.submit-btn {
  border-radius: 8px;
  background: #333333;
  border: none;
  
  &:hover {
    background: #555555;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .campus-management {
    padding: 16px;
  }
  
  .operation-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-section {
    max-width: none;
  }
  
  .campus-table {
    width: 100%;
    
    :deep(.el-table__inner-wrapper) {
      min-width: 100%;
    }
  }
  
  .campus-dialog {
    :deep(.el-dialog) {
      width: 90%;
      margin: 0 auto;
    }
  }
}
</style>