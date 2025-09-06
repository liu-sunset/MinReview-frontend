import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import UserManagement from '../views/UserManagement.vue'
import CampusManagement from '../views/CampusManagement.vue'
import CanteenManagement from '../views/CanteenManagement.vue'
import FloorManagement from '../views/FloorManagement.vue'
import DishManagement from '../views/DishManagement.vue'
import CommentManagement from '../views/CommentManagement.vue'
import AdminManagement from '../views/AdminManagement.vue'

const adminRoutes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: Login,
    meta: { title: '管理员登录' }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: Dashboard,
    meta: { title: '管理后台' },
    children: [
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { title: '用户管理' }
      },
      {
        path: 'campuses',
        name: 'CampusManagement',
        component: CampusManagement,
        meta: { title: '校区管理' }
      },
      {
        path: 'canteens',
        name: 'CanteenManagement',
        component: CanteenManagement,
        meta: { title: '食堂管理' }
      },
      {
        path: 'floors',
        name: 'FloorManagement',
        component: FloorManagement,
        meta: { title: '楼层管理' }
      },
      {
        path: 'dishes',
        name: 'DishManagement',
        component: DishManagement,
        meta: { title: '菜品管理' }
      },
      {
        path: 'comments',
        name: 'CommentManagement',
        component: CommentManagement,
        meta: { title: '评论管理' }
      },
      {
        path: 'admins',
        name: 'AdminManagement',
        component: AdminManagement,
        meta: { title: '管理员管理' }
      }
    ]
  }
]

const adminRouter = createRouter({
  history: createWebHistory(),
  routes: adminRoutes
})

adminRouter.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - MinReview 后台管理` : 'MinReview 后台管理'
  // 这里可以添加登录验证逻辑
  // 例如：如果不是登录页且未登录，则重定向到登录页
  // const token = localStorage.getItem('admin_token')
  // if (to.name !== 'AdminLogin' && !token) {
  //   next({ name: 'AdminLogin' })
  // } else {
  //   next()
  // }
  next()
})

export default adminRouter