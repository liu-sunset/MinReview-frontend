<template>
  <div class="user-management">
    <!-- 操作栏 -->
    <div class="operation-bar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名或手机号"
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
          :icon="Refresh"
          @click="refreshData"
          class="action-btn"
        >
          刷新
        </el-button>
      </div>
    </div>
    
    <!-- 用户列表 -->
    <div class="table-container">
      <el-table
        :data="userList"
        v-loading="loading"
        class="user-table"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="ID" width="80">
          <template #default="{ row, $index }">
            {{ (pagination.page - 1) * pagination.size + $index + 1 }}
          </template>
        </el-table-column>
        
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar
              :src="row.avatarUrl"
              :size="40"
              class="user-avatar"
            >
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="用户名" min-width="120" />
        
        <el-table-column prop="phone" label="手机号" width="140" />
        
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.gender === 1 ? 'primary' : row.gender === 2 ? 'success' : 'info'"
              size="small"
              class="gender-tag"
            >
              {{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '未知' }}
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
        
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, User, Delete } from '@element-plus/icons-vue'
import { getUserList, updateUserStatus, deleteUser, type UserItem } from '../api/user'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const userList = ref<UserItem[]>([])
const selectedUsers = ref<UserItem[]>([])

// 分页数据
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 响应式数据继续...

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  
  try {
    const response = await getUserList({
      page: pagination.page,
      pageSize: pagination.size,
      keyWord: searchKeyword.value
    })
    
    if (response.code === 1) {
      userList.value = response.data.list
      pagination.total = response.data.total
    } else {
      ElMessage.error(response.msg || '获取用户列表失败')
    }
    
  } catch (error: any) {
    console.error('获取用户列表失败:', error)
    ElMessage.error(error.msg || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

// 刷新数据
const refreshData = () => {
  searchKeyword.value = ''
  pagination.page = 1
  fetchUserList()
}

// 状态切换处理
const handleStatusChange = async (user: UserItem) => {
  const originalStatus = user.status
  
  try {
    const response = await updateUserStatus(user.id, user.status)
    
    if (response.code === 1) {
      ElMessage.success(`用户${user.name}状态已${user.status ? '启用' : '禁用'}`)
    } else {
      // 恢复原状态
      user.status = originalStatus
      ElMessage.error(response.msg || '状态更新失败')
    }
  } catch (error: any) {
    // 恢复原状态
    user.status = originalStatus
    console.error('状态更新失败:', error)
    ElMessage.error(error.msg || '状态更新失败')
  }
}

// 删除用户
const handleDelete = async (user: UserItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const response = await deleteUser(user.id)
    
    if (response.code === 1) {
      ElMessage.success('用户删除成功')
      fetchUserList()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error(error.msg || '删除失败')
    }
  }
}

// 选择变化处理
const handleSelectionChange = (selection: UserItem[]) => {
  selectedUsers.value = selection
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchUserList()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchUserList()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUserList()
})
</script>

<style scoped lang="scss">
.user-management {
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
  background: #333333;
  border: none;
  
  &:hover {
    background: #555555;
  }
}

.table-container {
  margin-bottom: 24px;
}

.user-table {
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

.user-avatar {
  border-radius: 8px;
  
  :deep(.el-avatar__inner) {
    background: #f0f0f0;
    color: #666666;
  }
}

.gender-tag {
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

// 响应式设计
@media (max-width: 768px) {
  .user-management {
    padding: 16px;
  }
  
  .operation-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-section {
    max-width: none;
  }
  
  .user-table {
    width: 100%;
    
    :deep(.el-table__inner-wrapper) {
      min-width: 100%;
    }
  }
}
</style>