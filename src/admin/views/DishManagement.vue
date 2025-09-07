<template>
  <div class="dish-management">
    <!-- 操作栏 -->
    <div class="operation-bar">
      <div class="search-section">
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
          >
            <span>{{ campus.name }}</span>
          </el-option>
        </el-select>
        
        <el-select
          v-model="selectedCanteen"
          placeholder="选择食堂"
          class="canteen-select"
          clearable
          @change="handleCanteenChange"
        >
          <el-option
            v-for="canteen in filteredCanteenList"
            :key="canteen.id"
            :label="canteen.name"
            :value="canteen.id"
          >
            <span>{{ canteen.name }}</span>
          </el-option>
        </el-select>
        

        
        <el-input
          v-model="searchKeyword"
          placeholder="搜索菜品名称或描述"
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          class="status-select"
          clearable
          @change="handleStatusFilter"
        >
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
      </div>
      
      <div class="action-section">
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleAdd"
          class="action-btn"
        >
          添加菜品
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
    
    <!-- 菜品列表 -->
    <div class="table-container">
      <el-table
        :data="dishList"
        v-loading="loading"
        class="dish-table"
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="菜品图片" width="100">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              class="dish-image"
              fit="cover"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="菜品名称" min-width="150" />
        
        
        
        <el-table-column prop="canteenName" label="所属食堂" width="120">
          <template #default="{ row }">
            <el-tag type="success" size="small" class="canteen-tag">
              {{ row.canteenName }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="likeCount" label="点赞数" width="100">
          <template #default="{ row }">
            <el-tag type="success" size="small" class="count-tag">
              {{ row.likeCount }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="dislikeCount" label="点踩数" width="100">
          <template #default="{ row }">
            <el-tag type="danger" size="small" class="count-tag">
              {{ row.dislikeCount }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="上架"
              inactive-text="下架"
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
      width="700px"
      class="dish-dialog"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="dish-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜品名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入菜品名称"
                class="form-input"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="菜品价格" prop="price">
              <el-input-number
                v-model="formData.price"
                :min="0"
                :precision="2"
                :step="0.1"
                placeholder="请输入价格"
                class="form-input"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        
        
        <el-form-item label="菜品图片" prop="imageUrl">
          <el-upload
            class="image-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
            :headers="uploadHeaders"
          >
            <img v-if="formData.imageUrl" :src="formData.imageUrl" class="uploaded-image" />
            <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">只能上传jpg/png文件，且不超过2MB</div>
        </el-form-item>
        
        <el-form-item label="菜品描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入菜品描述"
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadProps } from 'element-plus'
import { Search, Plus, Refresh, Edit, Delete, Picture } from '@element-plus/icons-vue'
import dishApi, { type DishItem, type DishListParams } from '../api/dish'
import { canteenApi, type CanteenItem } from '../api/canteen'
import { campusApi, type CampusItem } from '../api/campus'


// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const searchKeyword = ref('')
const selectedCampus = ref<number | null>(null)
const selectedCanteen = ref<number | null>(null)
const statusFilter = ref<number | null>(null)
const dishList = ref<DishItem[]>([])
const campusList = ref<CampusItem[]>([])
const canteenList = ref<CanteenItem[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 上传相关
const uploadUrl = 'http://localhost:8080/api/admin/upload/image'
const uploadHeaders = {
  'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
}

// 分页数据
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 表单数据
const formData = reactive<DishItem>({
  name: '',
  price: 0,
  description: '',
  imageUrl: '',
  status: 1,
  canteenId: 0,
  campusId: 0,
  likeCount: 0,
  dislikeCount: 0
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' },
    { min: 1, max: 50, message: '菜品名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入菜品价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入菜品描述', trigger: 'blur' },
    { min: 5, max: 500, message: '菜品描述长度在 5 到 500 个字符', trigger: 'blur' }
  ],
  imageUrl: [
    { required: true, message: '请上传菜品图片', trigger: 'change' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => isEdit.value ? '编辑菜品' : '添加菜品')

// 根据选择的校区过滤食堂列表
const filteredCanteenList = computed(() => canteenList.value);

// 获取校区列表
const fetchCampusList = async () => {
  try {
    const response = await campusApi.getCampusList({
      page: 1,
      pageSize: 100
    })
    if (response.code === 1 && response.data) {
      campusList.value = response.data.list || []
    } else {
      ElMessage.warning(response.msg || '获取校区列表失败')
    }
  } catch (error) {
    console.error('获取校区列表失败:', error)
    ElMessage.error('获取校区列表失败')
  }
}

// 获取食堂列表
const fetchCanteenList = async () => {
  try {
    // 获取食堂列表
    const params = {
      page: pagination.page,
      pageSize: pagination.size,
      ...(selectedCampus.value ? { campusId: selectedCampus.value } : {})
    }
    const canteenResponse = await canteenApi.getCanteenList(params)
    if (canteenResponse.code === 1 && canteenResponse.data) {
      canteenList.value = canteenResponse.data.list || []
    }
  } catch (error) {
    console.error('获取食堂列表失败:', error)
    ElMessage.error('获取食堂列表失败')
  }
}

// 获取菜品分类列表
const fetchCategoryList = async () => {
  try {
    const response = await categoryApi.getCategoryList({})
    if (response.code === 1 && response.data) {
      categoryList.value = response.data.list || []
    } else {
      ElMessage.warning(response.msg || '获取菜品分类失败')
    }
  } catch (error) {
    console.error('获取菜品分类失败:', error)
    ElMessage.error('获取菜品分类失败')
  }
}

// 获取菜品列表
const fetchDishList = async () => {
  loading.value = true
  
  try {
    // 构建查询参数
    const params: DishListParams = {
      page: pagination.page,
      pageSize: pagination.size,
      keyword: searchKeyword.value || undefined,

      canteenId: selectedCanteen.value || undefined,
      campusId: selectedCampus.value || undefined
    }
    
    // 如果状态筛选有值，添加到查询参数
    if (statusFilter.value !== null) {
      // 在API中可能需要转换状态值
      params.status = statusFilter.value
    }
    
    // 调用API获取菜品列表
    const response = await dishApi.getDishList(params)
    
    if (response.code === 1 && response.data) {
      dishList.value = response.data.list || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.warning(response.msg || '获取数据失败')
    }
    
  } catch (error) {
    console.error('获取菜品列表失败:', error)
    ElMessage.error('获取菜品列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchDishList()
}

// 校区变化处理
const handleCampusChange = () => {
  // 如果选择了校区，但当前选择的食堂不属于该校区，则清空食堂选择
  if (selectedCampus.value && selectedCanteen.value) {
    const currentCanteen = canteenList.value.find(c => c.id === selectedCanteen.value)
    if (currentCanteen && currentCanteen.campusId !== selectedCampus.value) {
      selectedCanteen.value = null
        }
  }
  pagination.page = 1
  fetchCanteenList()
  fetchDishList()
}

// 食堂变化处理
const handleCanteenChange = () => {
  pagination.page = 1
  fetchDishList()
}



// 状态筛选处理
const handleStatusFilter = () => {
  pagination.page = 1
  fetchDishList()
}

// 刷新数据
const refreshData = () => {
  searchKeyword.value = ''
  selectedCampus.value = null
  selectedCanteen.value = null
  selectedFloor.value = null
  statusFilter.value = null
  pagination.page = 1
  fetchDishList()
}

// 分类变化处理
const handleCategoryChange = () => {
  pagination.page = 1
  fetchDishList()
}

// 添加菜品
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑菜品
const handleEdit = (dish: DishItem) => {
  isEdit.value = true
  Object.assign(formData, dish)
  dialogVisible.value = true
}

// 状态切换处理
const handleStatusChange = async (dish: DishItem) => {
  if (!dish.id) return
  
  try {
    // 调用API更新菜品状态
    const response = await dishApi.updateDishStatus(dish.id, dish.status)
    
    if (response.code === 1) {
      ElMessage.success(`菜品${dish.name}已${dish.status ? '上架' : '下架'}`)
    } else {
      // 恢复原状态
      dish.status = dish.status ? 0 : 1
      ElMessage.warning(response.msg || '状态更新失败')
    }
  } catch (error) {
    // 恢复原状态
    dish.status = dish.status ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}

// 删除菜品
const handleDelete = async (dish: DishItem) => {
  if (!dish.id) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除菜品 "${dish.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 调用API删除菜品
    const response = await dishApi.deleteDish(dish.id)
    
    if (response.code === 1) {
      ElMessage.success('菜品删除成功')
      fetchDishList()
    } else {
      ElMessage.warning(response.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 图片上传成功处理
const handleImageSuccess: UploadProps['onSuccess'] = (response) => {
  if (response.code === 1) {
    formData.imageUrl = response.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.msg || '图片上传失败')
  }
}

// 图片上传前验证
const beforeImageUpload: UploadProps['beforeUpload'] = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    submitLoading.value = true
    
    // 获取当前选中的食堂和校区ID
    const canteenId = selectedCanteen.value || 0
    const campusId = selectedCampus.value || 0
    
    // 确保有食堂ID和校区ID
    if (!canteenId || !campusId) {
      ElMessage.error('请先选择校区和食堂')
      submitLoading.value = false
      return
    }
    
    // 准备提交的数据
    const submitData = {
      ...formData,
      canteenId,
      campusId
    }
    
    let response
    
    if (isEdit.value && formData.id) {
      // 调用API更新菜品
      response = await dishApi.updateDish(formData.id, submitData)
    } else {
      // 调用API添加菜品
      response = await dishApi.addDish(submitData)
    }
    
    if (response.code === 1) {
      ElMessage.success(isEdit.value ? '菜品更新成功' : '菜品添加成功')
      dialogVisible.value = false
      fetchDishList()
    } else {
      ElMessage.warning(response.msg || (isEdit.value ? '更新失败' : '添加失败'))
    }
  } catch (error) {
    console.error('提交表单错误:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
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

    price: 0,
    description: '',
    imageUrl: '',
    categoryId: undefined,
    status: 1,
    canteenId: 0,
    campusId: 0,
    likeCount: 0,
    dislikeCount: 0
  })
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchDishList()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchDishList()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCampusList()
  fetchCanteenList()
  fetchDishList()
})
</script>

<style scoped lang="scss">
.dish-management {
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
  max-width: 800px;
}

.campus-select,
.canteen-select,
.floor-select,
.status-select {
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
  
  .floor-canteen {
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
    
    &:hover {
      background: #555555;
    }
  }
}

.table-container {
  margin-bottom: 24px;
}

.dish-table {
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

.dish-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
    font-size: 20px;
  }
}

.floor-tag {
  border-radius: 6px;
  border: none;
  background: #e3f2fd;
  color: #1976d2;
}

.canteen-tag {
  border-radius: 6px;
  border: none;
  background: #e8f5e8;
  color: #2e7d32;
}

.price-text {
  font-weight: 600;
  color: #f56c6c;
}

.count-tag {
  border-radius: 6px;
  border: none;
  
  &.el-tag--success {
    background: #e8f5e8;
    color: #2e7d32;
  }
  
  &.el-tag--danger {
    background: #fef0f0;
    color: #f56c6c;
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

.dish-dialog {
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

.dish-form {
  .form-input,
  .form-cascader {
    width: 100%;
    
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-cascader),
    :deep(.el-input-number) {
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

.image-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: 0.2s;
    
    &:hover {
      border-color: #333333;
    }
  }
  
  .image-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 120px;
    height: 120px;
    text-align: center;
    line-height: 120px;
  }
  
  .uploaded-image {
    width: 120px;
    height: 120px;
    display: block;
    object-fit: cover;
  }
}

.upload-tip {
  font-size: 12px;
  color: #999999;
  margin-top: 8px;
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
  .dish-management {
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
  
  .floor-select,
  .status-select {
    width: 100%;
  }
  
  .dish-table {
    width: 100%;
    
    :deep(.el-table__inner-wrapper) {
      min-width: 100%;
    }
  }
  
  .dish-dialog {
    :deep(.el-dialog) {
      width: 90%;
      margin: 0 auto;
    }
  }
}
</style>