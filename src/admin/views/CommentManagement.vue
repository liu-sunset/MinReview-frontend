<template>
  <div class="comment-management">
    <!-- 操作栏 -->
    <div class="operation-bar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索评论内容或用户昵称"
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="dishFilter"
          placeholder="选择菜品"
          class="dish-select"
          clearable
          filterable
          @change="handleDishFilter"
        >
          <el-option
            v-for="dish in dishList"
            :key="dish.id"
            :label="dish.name"
            :value="dish.id"
          />
        </el-select>
        
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="date-picker"
          @change="handleDateFilter"
        />
      </div>
      
      <div class="action-section">
        <el-button
          type="danger"
          :icon="Delete"
          @click="handleBatchDelete"
          :disabled="selectedComments.length === 0"
          class="action-btn"
        >
          批量删除
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
    
    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">总评论数：</span>
        <span class="stat-value">{{ pagination.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已选择：</span>
        <span class="stat-value">{{ selectedComments.length }}</span>
      </div>
    </div>
    
    <!-- 评论列表 -->
    <div class="table-container">
      <el-table
        :data="commentList"
        v-loading="loading"
        class="comment-table"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar
                :src="row.userAvatar"
                :size="40"
                class="user-avatar"
              >
                <template #default>
                  <el-icon><User /></el-icon>
                </template>
              </el-avatar>
              <div class="user-details">
                <div class="user-nickname">{{ row.userNickname }}</div>
                <div class="user-id">ID: {{ row.userId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="菜品信息" width="200">
          <template #default="{ row }">
            <div class="dish-info">
              <el-image
                :src="row.dishImage"
                :size="50"
                class="dish-image"
                fit="cover"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="dish-details">
                <div class="dish-name">{{ row.dishName }}</div>
                <div class="dish-location">{{ row.canteenName }} - {{ row.floorName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="content" label="评论内容" min-width="300">
          <template #default="{ row }">
            <div class="comment-content">
              <p class="content-text">{{ row.content }}</p>
              <div class="comment-images" v-if="row.images && row.images.length > 0">
                <el-image
                  v-for="(image, index) in row.images"
                  :key="index"
                  :src="image"
                  :preview-src-list="row.images"
                  class="comment-image"
                  fit="cover"
                >
                  <template #error>
                    <div class="image-slot">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <el-rate
              v-model="row.rating"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
              class="comment-rating"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="评论时间" width="180">
          <template #default="{ row }">
            <div class="time-info">
              <div class="date-text">{{ formatDate(row.createdAt) }}</div>
              <div class="time-text">{{ formatTime(row.createdAt) }}</div>
            </div>
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
import { Search, Delete, Refresh, User, Picture } from '@element-plus/icons-vue'
import { getCommentList, deleteComment, type CommentItem } from '../api/comment'
import { dishApi, type DishItem } from '../api/dish'

// 接口类型定义
interface CommentDisplayItem {
  id: number
  userId: number
  userNickname: string
  userAvatar: string
  dishId: number
  dishName: string
  dishImage: string
  canteenName: string
  floorName: string
  content: string
  images?: string[]
  rating: number
  createdAt: string
}

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const dishFilter = ref<number | null>(null)
const dateRange = ref<[Date, Date] | null>(null)
const commentList = ref<CommentDisplayItem[]>([])
const dishList = ref<DishItem[]>([])
const selectedComments = ref<CommentDisplayItem[]>([])

// 分页数据
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 模拟菜品数据
const mockDishData: DishItem[] = [
  { id: 1, name: '红烧肉' },
  { id: 2, name: '宫保鸡丁' },
  { id: 3, name: '麻婆豆腐' },
  { id: 4, name: '糖醋里脊' },
  { id: 5, name: '鱼香肉丝' }
]

// 模拟评论数据
const mockCommentData: CommentItem[] = [
  {
    id: 1,
    userId: 1001,
    userNickname: '美食爱好者',
    userAvatar: 'https://via.placeholder.com/40x40?text=用户1',
    dishId: 1,
    dishName: '红烧肉',
    dishImage: 'https://via.placeholder.com/50x50?text=红烧肉',
    canteenName: '第一食堂',
    floorName: '一楼',
    content: '这道红烧肉做得非常好吃，肥瘦相间，入口即化，调料搭配得恰到好处。价格也很实惠，强烈推荐！',
    images: [
      'https://via.placeholder.com/200x150?text=评论图1',
      'https://via.placeholder.com/200x150?text=评论图2'
    ],
    rating: 5,
    createdAt: '2024-01-15 12:30:45'
  },
  {
    id: 2,
    userId: 1002,
    userNickname: '校园吃货',
    userAvatar: 'https://via.placeholder.com/40x40?text=用户2',
    dishId: 2,
    dishName: '宫保鸡丁',
    dishImage: 'https://via.placeholder.com/50x50?text=宫保鸡丁',
    canteenName: '第一食堂',
    floorName: '一楼',
    content: '宫保鸡丁味道不错，鸡肉很嫩，花生很香脆，就是有点偏咸了。',
    rating: 4,
    createdAt: '2024-01-15 11:45:20'
  },
  {
    id: 3,
    userId: 1003,
    userNickname: '挑剔的舌头',
    userAvatar: 'https://via.placeholder.com/40x40?text=用户3',
    dishId: 3,
    dishName: '麻婆豆腐',
    dishImage: 'https://via.placeholder.com/50x50?text=麻婆豆腐',
    canteenName: '第二食堂',
    floorName: '一楼',
    content: '麻婆豆腐做得一般般，豆腐有点老了，麻味不够，辣味也不够正宗。',
    rating: 2,
    createdAt: '2024-01-14 19:20:15'
  },
  {
    id: 4,
    userId: 1004,
    userNickname: '学生党',
    userAvatar: 'https://via.placeholder.com/40x40?text=用户4',
    dishId: 4,
    dishName: '糖醋里脊',
    dishImage: 'https://via.placeholder.com/50x50?text=糖醋里脊',
    canteenName: '第一食堂',
    floorName: '二楼',
    content: '糖醋里脊外酥内嫩，酸甜适中，很下饭。分量也足够，性价比很高！',
    images: ['https://via.placeholder.com/200x150?text=糖醋里脊'],
    rating: 5,
    createdAt: '2024-01-14 18:15:30'
  },
  {
    id: 5,
    userId: 1005,
    userNickname: '随便吃吃',
    userAvatar: 'https://via.placeholder.com/40x40?text=用户5',
    dishId: 5,
    dishName: '鱼香肉丝',
    dishImage: 'https://via.placeholder.com/50x50?text=鱼香肉丝',
    canteenName: '东区食堂',
    floorName: '一楼',
    content: '鱼香肉丝味道还可以，就是肉丝有点少，主要是配菜。',
    rating: 3,
    createdAt: '2024-01-14 17:30:10'
  }
]

// 获取菜品列表
const fetchDishList = async () => {
  try {
    const response = await dishApi.getDishList({
      page: 1,
      pageSize: 1000, // 获取所有菜品用于筛选
      keyword: ''
    })
    dishList.value = response.data.list
  } catch (error) {
    console.error('获取菜品列表失败:', error)
    ElMessage.error('获取菜品列表失败')
  }
}

// 获取评论列表
const fetchCommentList = async () => {
  if (!dishFilter.value) {
    ElMessage.warning('请先选择菜品查看评论')
    commentList.value = []
    pagination.total = 0
    return
  }
  
  loading.value = true
  
  try {
    const response = await getCommentList({
      page: pagination.page,
      pageSize: pagination.size,
      dishId: dishFilter.value
    })
    
    // 转换API数据为显示数据格式
    commentList.value = response.list.map(comment => ({
      id: comment.id,
      userId: comment.userId,
      userNickname: comment.name,
      userAvatar: comment.avatarUrl,
      dishId: comment.dishId,
      dishName: dishList.value.find(dish => dish.id === comment.dishId)?.name || '未知菜品',
      dishImage: '', // API中没有菜品图片，可以后续从菜品详情获取
      canteenName: '', // API中没有食堂信息，可以后续扩展
      floorName: '', // API中没有楼层信息，可以后续扩展
      content: comment.content,
      images: [], // API中没有评论图片，可以后续扩展
      rating: 5, // API中没有评分，设置默认值
      createdAt: comment.updateTime
    }))
    
    pagination.total = response.total
    
  } catch (error) {
    console.error('获取评论列表失败:', error)
    ElMessage.error('获取评论列表失败')
    commentList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  fetchCommentList()
}

// 菜品筛选处理
const handleDishFilter = () => {
  pagination.page = 1
  fetchCommentList()
}

// 日期筛选处理
const handleDateFilter = () => {
  pagination.page = 1
  fetchCommentList()
}

// 刷新数据
const refreshData = () => {
  searchKeyword.value = ''
  dishFilter.value = null
  dateRange.value = null
  pagination.page = 1
  selectedComments.value = []
  fetchCommentList()
}

// 选择变化处理
const handleSelectionChange = (selection: CommentDisplayItem[]) => {
  selectedComments.value = selection
}

// 删除单个评论
const handleDelete = async (comment: CommentDisplayItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${comment.userNickname}" 对 "${comment.dishName}" 的评论吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await deleteComment(comment.id)
    
    ElMessage.success('评论删除成功')
    fetchCommentList()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除评论
const handleBatchDelete = async () => {
  if (selectedComments.value.length === 0) {
    ElMessage.warning('请先选择要删除的评论')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedComments.value.length} 条评论吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 循环调用删除API
    const deletePromises = selectedComments.value.map(comment => 
      deleteComment(comment.id)
    )
    
    await Promise.all(deletePromises)
    
    ElMessage.success(`成功删除 ${selectedComments.value.length} 条评论`)
    selectedComments.value = []
    fetchCommentList()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除评论失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
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
  fetchCommentList()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchCommentList()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchDishList()
  fetchCommentList()
})
</script>

<style scoped lang="scss">
.comment-management {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.search-section {
  display: flex;
  gap: 12px;
  flex: 1;
  max-width: 800px;
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

.dish-select {
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
}

.date-picker {
  width: 300px;
  
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
  
  &.el-button--danger {
    &:hover {
      background: #f56565;
      border-color: #f56565;
    }
  }
}

.stats-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  color: #666666;
  font-size: 14px;
}

.stat-value {
  color: #333333;
  font-weight: 600;
  font-size: 14px;
}

.table-container {
  margin-bottom: 24px;
}

.comment-table {
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

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-nickname {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id {
  font-size: 12px;
  color: #999999;
}

.dish-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dish-image {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  flex-shrink: 0;
  
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
    font-size: 16px;
  }
}

.dish-details {
  flex: 1;
  min-width: 0;
}

.dish-name {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dish-location {
  font-size: 12px;
  color: #999999;
  margin-top: 2px;
}

.comment-content {
  .content-text {
    margin: 0 0 8px 0;
    line-height: 1.5;
    color: #333333;
    word-break: break-word;
  }
  
  .comment-images {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .comment-image {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    cursor: pointer;
    
    .image-slot {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background: #f5f7fa;
      color: #909399;
      font-size: 14px;
    }
  }
}

.comment-rating {
  :deep(.el-rate__item) {
    margin-right: 2px;
  }
  
  :deep(.el-rate__text) {
    color: #333333;
    font-weight: 500;
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
  .comment-management {
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
  
  .dish-select,
  .date-picker {
    width: 100%;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 8px;
  }
  
  .comment-table {
    width: 100%;
    
    :deep(.el-table__inner-wrapper) {
      min-width: 100%;
    }
  }
  
  .user-info,
  .dish-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .comment-images {
    .comment-image {
      width: 40px;
      height: 40px;
    }
  }
}
</style>