import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 用户端路由
const userRoutes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../user/views/Home.vue')
  },
  {
    path: '/login',
    name: 'UserLogin',
    component: () => import('../user/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../user/views/Register.vue')
  },
  {
    path: '/dish/:id',
    name: 'DishDetail',
    component: () => import('../user/views/DishDetail.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../user/views/Profile.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

// 管理端路由
const adminRoutes: Array<RouteRecordRaw> = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../admin/views/Login.vue'),
    meta: {
      title: '管理员登录',
      requiresAuth: false
    }
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../admin/views/Dashboard.vue'),
    meta: {
      title: '管理后台',
      requiresAuth: true
    },
    children: [
      {
        path: '/admin/users',
        name: 'UserManagement',
        component: () => import('../admin/views/UserManagement.vue'),
        meta: {
          title: '用户管理',
          requiresAuth: true
        }
      },
      {
        path: '/admin/campus',
        name: 'CampusManagement',
        component: () => import('../admin/views/CampusManagement.vue'),
        meta: {
          title: '校区管理',
          requiresAuth: true
        }
      },
      {
        path: '/admin/canteens',
        name: 'CanteenManagement',
        component: () => import('../admin/views/CanteenManagement.vue'),
        meta: {
          title: '食堂管理',
          requiresAuth: true
        }
      },
      {
        path: '/admin/floors',
        name: 'FloorManagement',
        component: () => import('../admin/views/FloorManagement.vue'),
        meta: {
          title: '楼层管理',
          requiresAuth: true
        }
      },
      {
        path: '/admin/dishes',
        name: 'DishManagement',
        component: () => import('../admin/views/DishManagement.vue'),
        meta: {
          title: '菜品管理',
          requiresAuth: true
        }
      },
      {
        path: '/admin/comments',
        name: 'CommentManagement',
        component: () => import('../admin/views/CommentManagement.vue'),
        meta: {
          title: '评论管理',
          requiresAuth: true
        }
      },
      {
        path: '/admin/admins',
        name: 'AdminManagement',
        component: () => import('../admin/views/AdminManagement.vue'),
        meta: {
          title: '管理员管理',
          requiresAuth: true
        }
      }
    ]
  }
]

// 合并所有路由
const routes: Array<RouteRecordRaw> = [
  ...userRoutes,
  ...adminRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
  
  // 管理端路由权限验证
  if (to.path.startsWith('/admin') && to.name !== 'AdminLogin') {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      next('/admin/login')
      return
    }
  }
  
  // 用户端路由权限验证
  if (to.meta?.requiresAuth) {
    const userToken = localStorage.getItem('token')
    if (!userToken) {
      next('/login')
      return
    }
  }
  
  next()
})

export default router