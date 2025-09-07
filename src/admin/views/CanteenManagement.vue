<template>
  <div class="canteen-management">
    <!-- 操作栏 -->
    <div class="operation-bar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索食堂名称或描述"
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="selectedCampus"
          placeholder="选择校区"
          class="campus-select"
          clearable
          @change="handleCampusChange"
        >
          <el-option
            v-for="campus in campusList"
            :key="campus.id"
            :label="campus.name"
            :value="campus.id"
          />
        </el-select>
      </div>
      
      <div class="action-section">
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleAdd"
          class="action-btn"
        >
          添加食堂
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
    
    <!-- 食堂列表 -->
    <div class="table-container">
      <el-table
        :data="canteenList"
        v-loading="loading"
        class="canteen-table"
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="name" label="食堂名称" min-width="150" />
        
        <el-table-column prop="campusName" label="所属校区" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small" class="campus-tag">
              {{ row.campusName }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="floorCount" label="楼层数" width="100">
          <template #default="{ row }">
            <el-tag type="success" size="small" class="count-tag">
              {{ row.floorCount }} 层
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="dishCount" label="菜品数" width="100">
          <template #default="{ row }">
            <el-tag type="warning" size="small" class="count-tag">
              {{ row.dishCount }} 个
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="营业"
              inactive-text="停业"
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
      width="600px"
      class="canteen-dialog"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="canteen-form"
      >
        <el-form-item label="食堂名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入食堂名称"
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item label="所属校区" prop="campusId">
          <el-select
            v-model="formData.campusId"
            placeholder="请选择校区"
            class="form-select"
          >
            <el-option
              v-for="campus in campusList"
              :key="campus.id"
              :label="campus.name"
              :value="campus.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="食堂描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入食堂描述"
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item label="营业时间" prop="businessHours">
          <el-input
            v-model="formData.businessHours"
            placeholder="例如：06:30-22:00"
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item label="联系电话" prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入联系电话（可选）"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { canteenApi, type CanteenItem, type CanteenListParams } from '../api/canteen'
import { campusApi, type CampusItem } from '../api/campus'

// 接口类型定义已从API文件导入

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const searchKeyword = ref('')
const selectedCampus = ref<number | null>(null)
const canteenList = ref<CanteenItem[]>([])
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
const formData = reactive<CanteenItem>({
  name: '',
  campusId: 0,
  description: '',
  businessHours: '',
  phone: '',
  status: 1,
  floorCount: 0,
  dishCount: 0
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入食堂名称', trigger: 'blur' },
    { min: 2, max: 50, message: '食堂名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  campusId: [
    { required: true, message: '请选择所属校区', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入食堂描述', trigger: 'blur' },
    { min: 5, max: 200, message: '食堂描述长度在 5 到 200 个字符', trigger: 'blur' }
  ],
  businessHours: [
    { pattern: /^\d{2}:\d{2}-\d{2}:\d{2}$/, message: '营业时间格式：HH:MM-HH:MM', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => isEdit.value ? '编辑食堂' : '添加食堂')

// 数据将从后端API获取

// 获取校区列表
const fetchCampusList = async () => {
  try {
    const params = {
      page: 1, // 默认获取第一页
      pageSize: 100 // 假设一次性获取所有校区，或者根据实际需求调整
    }
    const response = await campusApi.getCampusList(params)
    if (response.code === 1) {
      campusList.value = response.data.list || []
    } else {
      ElMessage.error(response.msg || '获取校区列表失败')
    }
  } catch (error: any) {
    console.error('获取校区列表失败:', error)
    ElMessage.error(error.msg || '获取校区列表失败')
  }
}

// 获取食堂列表
const fetchCanteenList = async () => {
  loading.value = true
  
  try {
    const params: CanteenListParams = {
      page: pagination.page,
      pageSize: pagination.size
    }
    
    if (searchKeyword.value) {
      params.keyWord = searchKeyword.value
    }
    
    if (selectedCampus.value) {
      params.campusId = selectedCampus.value
    }
    
    const response = await canteenApi.getCanteenList(params)
    
    if (response.code === 1) {
      canteenList.value = response.data.list || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.error(response.msg || '获取食堂列表失败')
    }
    
  } catch (error: any) {
    console.error('获取食堂列表失败:', error)
    ElMessage.error(error.msg || '获取食堂列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchCanteenList()
}

// 校区变化处理
const handleCampusChange = () => {
  pagination.page = 1
  fetchCanteenList()
}

// 刷新数据
const refreshData = () => {
  searchKeyword.value = ''
  selectedCampus.value = null
  pagination.page = 1
  fetchCanteenList()
}

// 添加食堂
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑食堂
const handleEdit = (canteen: CanteenItem) => {
  isEdit.value = true
  Object.assign(formData, canteen)
  dialogVisible.value = true
}

// 状态切换处理
const handleStatusChange = async (canteen: CanteenItem) => {
  try {
    if (!canteen.id) {
      ElMessage.error('食堂ID不存在')
      return
    }
    
    const response = await canteenApi.updateCanteenStatus(canteen.id, canteen.status)
    
    if (response.code === 1) {
      ElMessage.success(`食堂${canteen.name}状态已${canteen.status ? '开启营业' : '停止营业'}`)
    } else {
      // 恢复原状态
      canteen.status = canteen.status ? 0 : 1
      ElMessage.error(response.msg || '状态更新失败')
    }
  } catch (error: any) {
    // 恢复原状态
    canteen.status = canteen.status ? 0 : 1
    console.error('状态更新失败:', error)
    ElMessage.error(error.msg || '状态更新失败')
  }
}

// 删除食堂
const handleDelete = async (canteen: CanteenItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除食堂 "${canteen.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    if (!canteen.id) {
      ElMessage.error('食堂ID不存在')
      return
    }
    
    const response = await canteenApi.deleteCanteen(canteen.id)
    
    if (response.code === 1) {
      ElMessage.success('食堂删除成功')
      fetchCanteenList()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
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
      if (!formData.id) {
        ElMessage.error('食堂ID不存在')
        return
      }
      
      const response = await canteenApi.updateCanteen(formData.id, {
        name: formData.name,
        campusId: formData.campusId,
        description: formData.description,
        businessHours: formData.businessHours,
        phone: formData.phone
      })
      
      if (response.code === 1) {
        ElMessage.success('食堂更新成功')
        dialogVisible.value = false
        fetchCanteenList()
      } else {
        ElMessage.error(response.msg || '更新失败')
      }
    } else {
      const response = await canteenApi.addCanteen({
        name: formData.name,
        campusId: formData.campusId,
        description: formData.description,
        businessHours: formData.businessHours,
        phone: formData.phone
      })
      
      if (response.code === 1) {
        ElMessage.success('食堂添加成功')
        dialogVisible.value = false
        fetchCanteenList()
      } else {
        ElMessage.error(response.msg || '添加失败')
      }
    }
    
  } catch (error: any) {
    console.error(isEdit.value ? '更新失败:' : '添加失败:', error)
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
    campusId: 0,
    description: '',
    businessHours: '',
    phone: '',
    status: 1,
    floorCount: 0,
    dishCount: 0
  })
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchCanteenList()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchCanteenList()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCampusList()
  fetchCanteenList()
})
</script>

<style scoped lang="scss">
.canteen-management {
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
  display: flex;
  gap: 12px;
  flex: 1;
  max-width: 600px;
}

.search-input {
  flex: 1;
  
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

.campus-select {
  width: 150px;
  
  :deep(.el-select__wrapper) {
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    
    &:hover {
      border-color: #c0c0c0;
    }
    
    &.is-focused {
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

.canteen-table {
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

.campus-tag {
  border-radius: 6px;
  border: none;
  background: #e3f2fd;
  color: #1976d2;
}

.count-tag {
  border-radius: 6px;
  border: none;
  
  &.el-tag--success {
    background: #e8f5e8;
    color: #2e7d32;
  }
  
  &.el-tag--warning {
    background: #fff3e0;
    color: #f57c00;
  }
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

.canteen-dialog {
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

.canteen-form {
  .form-input,
  .form-select {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-select__wrapper) {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      
      &:hover {
        border-color: #c0c0c0;
      }
      
      &.is-focus,
      &.is-focused {
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
  .canteen-management {
    padding: 16px;
  }
  
  .operation-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-section {
    max-width: none;
    flex-direction: column;
  }
  
  .campus-select {
    width: 100%;
  }
  
  .canteen-table {
    width: 100%;
    
    :deep(.el-table__inner-wrapper) {
      min-width: 100%;
    }
  }
  
  .canteen-dialog {
    :deep(.el-dialog) {
      width: 90%;
      margin: 0 auto;
    }
  }
}
</style>