<template>
  <div class="admin-management">
    <!-- 操作栏 -->
    <div class="operation-bar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索管理员用户名或姓名"
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
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </div>
      
      <div class="action-section">
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleAdd"
          class="action-btn"
        >
          添加管理员
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
    
    <!-- 管理员列表 -->
    <div class="table-container">
      <el-table
        :data="adminList"
        v-loading="loading"
        class="admin-table"
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="username" label="用户名" width="150">
          <template #default="{ row }">
            <div class="username-cell">
              <span class="username-text">{{ row.username }}</span>
              <el-tag
                v-if="row.username === 'admin'"
                type="warning"
                size="small"
                class="super-admin-tag"
              >
                超级管理员
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="姓名" width="120" />
        

        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
              :disabled="row.username === 'admin'"
              @change="handleStatusChange(row)"
              class="status-switch"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            <div class="time-info" v-if="row.updateTime">
              <div class="date-text">{{ formatDate(row.updateTime) }}</div>
              <div class="time-text">{{ formatTime(row.updateTime) }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280">
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
              type="warning"
              size="small"
              :icon="Key"
              @click="handleChangePassword(row)"
              class="password-btn"
            >
              改密
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              :disabled="row.username === 'admin'"
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
      class="admin-dialog"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="admin-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="formData.username"
                placeholder="请输入用户名"
                :disabled="isEdit"
                class="form-input"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入姓名"
                class="form-input"
              />
            </el-form-item>
          </el-col>
        </el-row>
        

        
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item v-if="!isEdit" label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
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
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
      class="password-dialog"
      @close="resetPasswordForm"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordFormData"
        :rules="passwordFormRules"
        label-width="100px"
        class="password-form"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordFormData.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            class="form-input"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordFormData.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            class="form-input"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false" class="cancel-btn">
            取消
          </el-button>
          <el-button
            type="primary"
            @click="handlePasswordSubmit"
            :loading="passwordSubmitLoading"
            class="submit-btn"
          >
            {{ passwordSubmitLoading ? '修改中...' : '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Refresh, Edit, Delete, Key } from '@element-plus/icons-vue'
import { 
  getAdminList, 
  addAdmin, 
  updateAdminName, 
  deleteAdmin, 
  updateAdminStatus, 
  updateAdminPassword,
  type AdminItem as ApiAdminItem,
  type AdminListParams,
  type AddAdminParams,
  type UpdateAdminNameParams,
  type UpdatePasswordParams
} from '../api/admin'

// 接口类型定义
interface AdminItem {
  id?: number
  username: string
  name: string
  status: number
  updateTime?: string
  password?: string
  confirmPassword?: string
}

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const passwordSubmitLoading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref<number | null>(null)
const adminList = ref<AdminItem[]>([])
const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const isEdit = ref(false)
const currentAdmin = ref<AdminItem | null>(null)
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 分页数据
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 表单数据
const formData = reactive<AdminItem>({
  username: '',
  name: '',
  password: '',
  confirmPassword: '',
  status: 1
})

// 密码表单数据
const passwordFormData = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 密码表单验证规则
const passwordFormRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordFormData.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 对话框标题
const dialogTitle = computed(() => isEdit.value ? '编辑管理员' : '添加管理员')



// 获取管理员列表
const fetchAdminList = async () => {
  loading.value = true
  
  try {
    const params: AdminListParams = {
      page: pagination.page,
      pageSize: pagination.size
    }
    
    if (searchKeyword.value) {
      params.name = searchKeyword.value
    }
    
    const response = await getAdminList(params)
    
    if (response.code === 1) {
      // 根据API文档，返回的是数组而不是分页对象
      if (Array.isArray(response.data)) {
        adminList.value = response.data
        pagination.total = response.data.length
      } else {
        adminList.value = response.data.list || []
        pagination.total = response.data.total || 0
      }
      
      // 如果有状态筛选，在前端进行过滤
      if (statusFilter.value !== null) {
        adminList.value = adminList.value.filter(admin => 
          admin.status === statusFilter.value
        )
        pagination.total = adminList.value.length
      }
    } else {
      ElMessage.error(response.msg || '获取管理员列表失败')
    }
    
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    ElMessage.error('获取管理员列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchAdminList()
}

// 状态筛选处理
const handleStatusFilter = () => {
  pagination.page = 1
  fetchAdminList()
}

// 刷新数据
const refreshData = () => {
  searchKeyword.value = ''
  statusFilter.value = null
  pagination.page = 1
  fetchAdminList()
}

// 添加管理员
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑管理员
const handleEdit = (admin: AdminItem) => {
  isEdit.value = true
  currentAdmin.value = admin
  Object.assign(formData, {
    ...admin,
    password: '',
    confirmPassword: ''
  })
  dialogVisible.value = true
}

// 状态切换处理
const handleStatusChange = async (admin: AdminItem) => {
  if (!admin.id) return
  
  try {
    const response = await updateAdminStatus(admin.id, admin.status)
    
    if (response.code === 1) {
      ElMessage.success(`管理员${admin.name}已${admin.status ? '启用' : '禁用'}`)
    } else {
      // 恢复原状态
      admin.status = admin.status ? 0 : 1
      ElMessage.error(response.msg || '状态更新失败')
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    // 恢复原状态
    admin.status = admin.status ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}

// 修改密码
const handleChangePassword = (admin: AdminItem) => {
  currentAdmin.value = admin
  resetPasswordForm()
  passwordDialogVisible.value = true
}

// 删除管理员
const handleDelete = async (admin: AdminItem) => {
  if (admin.username === 'admin') {
    ElMessage.warning('超级管理员不能删除')
    return
  }
  
  if (!admin.id) {
    ElMessage.error('管理员ID不存在')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除管理员 "${admin.name}" (${admin.username}) 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const response = await deleteAdmin(admin.id)
    
    if (response.code === 1) {
      ElMessage.success('管理员删除成功')
      fetchAdminList()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
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
    
    let response
    if (isEdit.value) {
      if (!formData.id) {
        ElMessage.error('管理员ID不存在')
        return
      }
      response = await updateAdminName(formData.id, formData.name)
    } else {
      response = await addAdmin({
        username: formData.username,
        name: formData.name,
        password: formData.password
      })
    }
    
    if (response.code === 1) {
      ElMessage.success(isEdit.value ? '管理员更新成功' : '管理员添加成功')
      dialogVisible.value = false
      fetchAdminList()
    } else {
      ElMessage.error(response.msg || (isEdit.value ? '更新失败' : '添加失败'))
    }
    
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      console.error(isEdit.value ? '更新失败' : '添加失败', error)
      ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 提交密码修改
const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value || !currentAdmin.value) return
  
  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return
    
    passwordSubmitLoading.value = true
    
    if (!currentAdmin.value.id) {
      ElMessage.error('管理员ID不存在')
      return
    }
    
    const response = await updateAdminPassword(currentAdmin.value.id, passwordFormData.newPassword)
    
    if (response.code === 1) {
      ElMessage.success('密码修改成功')
      passwordDialogVisible.value = false
    } else {
      ElMessage.error(response.msg || '密码修改失败')
    }
    
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      console.error('密码修改失败:', error)
      ElMessage.error('密码修改失败')
    }
  } finally {
    passwordSubmitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    status: 1
  })
  currentAdmin.value = null
}

// 重置密码表单
const resetPasswordForm = () => {
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
  Object.assign(passwordFormData, {
    newPassword: '',
    confirmPassword: ''
  })
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchAdminList()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchAdminList()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchAdminList()
})
</script>

<style scoped lang="scss">
.admin-management {
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

.status-select {
  width: 120px;
  
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

.admin-table {
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

.username-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username-text {
  font-weight: 500;
  color: #333333;
}

.super-admin-tag {
  border-radius: 6px;
  border: none;
  background: #fff3cd;
  color: #856404;
  font-size: 10px;
  padding: 2px 6px;
}

.status-switch {
  :deep(.el-switch__core) {
    border-radius: 12px;
    
    &.is-checked {
      background: #333333;
    }
  }
}

.time-info {
  .date-text {
    font-size: 14px;
    color: #333333;
    font-weight: 500;
  }
  
  .time-text {
    font-size: 12px;
    color: #999999;
    margin-top: 2px;
  }
}

.no-login {
  color: #999999;
  font-style: italic;
}

.edit-btn {
  border-radius: 6px;
  background: #333333;
  border: none;
  
  &:hover {
    background: #555555;
  }
}

.password-btn {
  border-radius: 6px;
  
  &:hover {
    background: #f39c12;
    border-color: #f39c12;
  }
}

.delete-btn {
  border-radius: 6px;
  
  &:hover {
    background: #f56565;
    border-color: #f56565;
  }
  
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

.admin-dialog,
.password-dialog {
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

.admin-form,
.password-form {
  .form-input {
    width: 100%;
    
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
  .admin-management {
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
  
  .status-select {
    width: 100%;
  }
  
  .admin-table {
    width: 100%;
    
    :deep(.el-table__inner-wrapper) {
      min-width: 100%;
    }
  }
  
  .admin-dialog,
  .password-dialog {
    :deep(.el-dialog) {
      width: 90%;
      margin: 0 auto;
    }
  }
  
  .username-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>