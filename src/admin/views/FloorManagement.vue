<template>
  <div class="floor-management">
    <!-- 操作栏 -->
    <div class="operation-bar">
      <div class="search-section">
        <el-select
          v-model="selectedCanteen"
          placeholder="选择食堂"
          class="canteen-select"
          clearable
          @change="handleCanteenChange"
        >
          <el-option
            v-for="canteen in canteenList"
            :key="canteen.id"
            :label="canteen.name"
            :value="canteen.id"
          >
            <span>{{ canteen.name }}</span>
            <span class="canteen-campus">{{ canteen.campusName }}</span>
          </el-option>
        </el-select>
        
        <el-input
          v-model="searchKeyword"
          placeholder="搜索楼层名称或描述"
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
          :disabled="!selectedCanteen"
          class="action-btn"
        >
          添加楼层
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
    
    <!-- 提示信息 -->
    <div v-if="!selectedCanteen" class="empty-tip">
      <el-empty description="请先选择食堂查看楼层信息" />
    </div>
    
    <!-- 楼层列表 -->
    <div v-else class="table-container">
      <el-table
        :data="floorList"
        v-loading="loading"
        class="floor-table"
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="name" label="楼层名称" min-width="150" />
        
        <el-table-column prop="canteenName" label="所属食堂" width="150">
          <template #default="{ row }">
            <el-tag type="info" size="small" class="canteen-tag">
              {{ row.canteenName }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="dishCount" label="菜品数量" width="100">
          <template #default="{ row }">
            <el-tag type="success" size="small" class="count-tag">
              {{ row.dishCount }} 个
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
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
    <div v-if="selectedCanteen" class="pagination-container">
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
    
    <!-- 添加对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加楼层"
      width="500px"
      class="floor-dialog"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        class="floor-form"
      >
        <el-form-item label="楼层名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入楼层名称，如：一楼、二楼"
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item label="所属食堂" prop="canteenId">
          <el-select
            v-model="formData.canteenId"
            placeholder="请选择食堂"
            class="form-select"
            disabled
          >
            <el-option
              v-for="canteen in canteenList"
              :key="canteen.id"
              :label="canteen.name"
              :value="canteen.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="楼层描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入楼层描述（可选）"
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
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Refresh, Delete } from '@element-plus/icons-vue'
import { floorApi, type FloorItem } from '../api/floor'
import { canteenApi, type CanteenItem } from '../api/canteen'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const searchKeyword = ref('')
const selectedCanteen = ref<number | null>(null)
const floorList = ref<FloorItem[]>([])
const canteenList = ref<CanteenItem[]>([])
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

// 分页数据
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 表单数据
const formData = reactive<FloorItem>({
  name: '',
  canteenId: 0,
  description: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入楼层名称', trigger: 'blur' },
    { min: 1, max: 20, message: '楼层名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  canteenId: [
    { required: true, message: '请选择所属食堂', trigger: 'change' }
  ]
}

// 获取食堂列表
const fetchCanteenList = async () => {
  try {
    const response = await canteenApi.getCanteenList({ page: 1, pageSize: 100 })
    if (response.code === 1) {
      canteenList.value = response.data.list
    } else {
      ElMessage.error(response.msg || '获取食堂列表失败')
    }
  } catch (error) {
    console.error('获取食堂列表失败:', error)
    ElMessage.error('获取食堂列表失败')
  }
}

// 获取楼层列表
const fetchFloorList = async () => {
  if (!selectedCanteen.value) {
    floorList.value = []
    return
  }
  
  loading.value = true
  
  try {
    const response = await floorApi.getFloorList({
      canteenId: selectedCanteen.value,
      page: pagination.page,
      pageSize: pagination.size,
      keyWord: searchKeyword.value
    })
    
    if (response.code === 1) {
      floorList.value = response.data.list
      pagination.total = response.data.total
    } else {
      ElMessage.error(response.msg || '获取楼层列表失败')
    }
    
  } catch (error) {
    console.error('获取楼层列表失败:', error)
    ElMessage.error('获取楼层列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchFloorList()
}

// 食堂变化处理
const handleCanteenChange = () => {
  pagination.page = 1
  fetchFloorList()
}

// 刷新数据
const refreshData = () => {
  searchKeyword.value = ''
  pagination.page = 1
  fetchFloorList()
}

// 添加楼层
const handleAdd = () => {
  if (!selectedCanteen.value) {
    ElMessage.warning('请先选择食堂')
    return
  }
  
  resetForm()
  formData.canteenId = selectedCanteen.value
  dialogVisible.value = true
}

// 删除楼层
const handleDelete = async (floor: FloorItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除楼层 "${floor.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const response = await floorApi.deleteFloor(floor.id!)
    
    if (response.code === 1) {
      ElMessage.success('楼层删除成功')
      fetchFloorList()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除楼层失败:', error)
      ElMessage.error('删除失败')
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
    
    const response = await floorApi.addFloor({
      name: formData.name,
      canteenId: formData.canteenId,
      description: formData.description
    })
    
    if (response.code === 1) {
      ElMessage.success('楼层添加成功')
      dialogVisible.value = false
      fetchFloorList()
    } else {
      ElMessage.error(response.msg || '添加失败')
    }
    
  } catch (error) {
    console.error('添加楼层失败:', error)
    ElMessage.error('添加失败')
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
    canteenId: 0,
    description: ''
  })
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchFloorList()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchFloorList()
}

// 监听选中食堂变化
watch(selectedCanteen, () => {
  if (selectedCanteen.value) {
    fetchFloorList()
  }
})

// 组件挂载时初始化
onMounted(() => {
  fetchCanteenList()
})
</script>

<style scoped lang="scss">
.floor-management {
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

.canteen-select {
  width: 200px;
  
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
  
  .canteen-campus {
    float: right;
    color: #999999;
    font-size: 12px;
  }
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

.action-section {
  display: flex;
  gap: 12px;
}

.action-btn {
  border-radius: 8px;
  
  &.el-button--primary {
    background: #333333;
    border: none;
    
    &:hover:not(:disabled) {
      background: #555555;
    }
    
    &:disabled {
      background: #cccccc;
      border-color: #cccccc;
    }
  }
}

.empty-tip {
  margin: 60px 0;
  text-align: center;
}

.table-container {
  margin-bottom: 24px;
}

.floor-table {
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

.canteen-tag {
  border-radius: 6px;
  border: none;
  background: #e3f2fd;
  color: #1976d2;
}

.count-tag {
  border-radius: 6px;
  border: none;
  background: #e8f5e8;
  color: #2e7d32;
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

.floor-dialog {
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

.floor-form {
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
  .floor-management {
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
  
  .canteen-select {
    width: 100%;
  }
  
  .floor-table {
    width: 100%;
    
    :deep(.el-table__inner-wrapper) {
      min-width: 100%;
    }
  }
  
  .floor-dialog {
    :deep(.el-dialog) {
      width: 90%;
      margin: 0 auto;
    }
  }
}
</style>