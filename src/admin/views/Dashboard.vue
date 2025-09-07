<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-text" v-show="!isCollapsed">MinReview</span>
          <span class="logo-mini" v-show="isCollapsed">MR</span>
        </div>
        <el-button
          class="collapse-btn"
          :icon="isCollapsed ? Expand : Fold"
          @click="toggleSidebar"
          text
        />
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        @select="handleMenuSelect"
      >
        <el-menu-item index="users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        
        <el-menu-item index="campus">
          <el-icon><School /></el-icon>
          <span>校区管理</span>
        </el-menu-item>
        
        <el-menu-item index="canteen">
          <el-icon><Shop /></el-icon>
          <span>食堂管理</span>
        </el-menu-item>
        
        <el-menu-item index="floor">
          <el-icon><OfficeBuilding /></el-icon>
          <span>楼层管理</span>
        </el-menu-item>
        
        <el-menu-item index="dish">
          <el-icon><Bowl /></el-icon>
          <span>菜品管理</span>
        </el-menu-item>
        
        <el-menu-item index="comment">
          <el-icon><ChatDotRound /></el-icon>
          <span>评论管理</span>
        </el-menu-item>
        
        <el-menu-item index="admin" v-if="isAdmin">
          <el-icon><UserFilled /></el-icon>
          <span>管理员管理</span>
        </el-menu-item>
      </el-menu>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部栏 -->
      <div class="header">
        <div class="header-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <span class="username">{{ adminInfo.name || '管理员' }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="content">
        <component :is="currentComponent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../store'
import {
  User,
  School,
  Shop,
  OfficeBuilding,
  Bowl,
  ChatDotRound,
  UserFilled,
  Expand,
  Fold,
  ArrowDown,
  SwitchButton
} from '@element-plus/icons-vue'

// 导入管理页面组件
import UserManagement from './UserManagement.vue'
import CampusManagement from './CampusManagement.vue'
import CanteenManagement from './CanteenManagement.vue'
import FloorManagement from './FloorManagement.vue'
import DishManagement from './DishManagement.vue'
import CommentManagement from './CommentManagement.vue'
import AdminManagement from './AdminManagement.vue'

// 路由实例
const router = useRouter()

// 管理员状态
const adminStore = useAdminStore()

// 侧边栏折叠状态
const isCollapsed = ref(false)

// 当前激活的菜单
const activeMenu = ref('users')

// 管理员信息
const adminInfo = computed(() => adminStore.adminInfo || {
  id: 0,
  username: '',
  name: '管理员'
})

// 是否为超级管理员
const isAdmin = computed(() => adminInfo.value.username === 'admin')

// 初始化管理员状态
onMounted(() => {
  // 初始化管理员状态
  adminStore.initAdminState()
  
  // 如果未登录，跳转到登录页
  if (!adminStore.isLoggedIn) {
    router.push('/admin/login')
  }
})

// 页面标题映射
const pageTitleMap: Record<string, string> = {
  users: '用户管理',
  campus: '校区管理',
  canteen: '食堂管理',
  floor: '楼层管理',
  dish: '菜品管理',
  comment: '评论管理',
  admin: '管理员管理'
}

// 组件映射
const componentMap: Record<string, any> = {
  users: UserManagement,
  campus: CampusManagement,
  canteen: CanteenManagement,
  floor: FloorManagement,
  dish: DishManagement,
  comment: CommentManagement,
  admin: AdminManagement
}

// 当前页面标题
const pageTitle = computed(() => pageTitleMap[activeMenu.value] || '管理后台')

// 当前组件
const currentComponent = shallowRef(UserManagement)

// 切换侧边栏
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 菜单选择处理
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  currentComponent.value = componentMap[index] || UserManagement
}

// 下拉菜单命令处理
const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      // 清除登录状态
      await adminStore.logout()
      ElMessage.success('已退出登录')
      // 跳转到登录页
      router.push('/admin/login')
    } catch {
      // 用户取消
    }
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

.sidebar {
  width: 240px;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  
  &.collapsed {
    width: 64px;
  }
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;
}

.logo {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #333333;
  
  .logo-text {
    font-size: 20px;
    letter-spacing: -0.5px;
  }
  
  .logo-mini {
    font-size: 18px;
    font-weight: 700;
  }
}

.collapse-btn {
  color: #666666;
  
  &:hover {
    color: #333333;
  }
}

.sidebar-menu {
  flex: 1;
  border: none;
  
  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin: 4px 8px;
    border-radius: 8px;
    color: #666666;
    
    &:hover {
      background: #f5f5f5;
      color: #333333;
    }
    
    &.is-active {
      background: #333333;
      color: #ffffff;
      
      .el-icon {
        color: #ffffff;
      }
    }
  }
  
  :deep(.el-menu-item .el-icon) {
    margin-right: 8px;
    color: inherit;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333333;
  }
}

.header-right {
  .user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background 0.3s ease;
    
    &:hover {
      background: #f5f5f5;
    }
    
    .username {
      margin-right: 8px;
      color: #333333;
      font-weight: 500;
    }
    
    .dropdown-icon {
      color: #666666;
      font-size: 12px;
    }
  }
}

.content {
  flex: 1;
  padding: 24px;
  overflow: auto;
  background: #f5f5f5;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    height: 100vh;
    
    &.collapsed {
      transform: translateX(-100%);
    }
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .header {
    padding: 0 16px;
  }
  
  .content {
    padding: 16px;
  }
}
</style>