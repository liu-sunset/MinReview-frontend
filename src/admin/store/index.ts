import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLogin, type LoginParams, type LoginResponse } from '../api/admin'

export const useAdminStore = defineStore('admin', () => {
  // 管理员信息
  const adminInfo = ref<LoginResponse | null>(null)
  
  // 登录状态
  const isLoggedIn = ref(false)
  
  // 初始化状态
  const initAdminState = () => {
    const token = localStorage.getItem('adminToken')
    const storedAdminInfo = localStorage.getItem('adminInfo')
    
    if (token && storedAdminInfo) {
      adminInfo.value = JSON.parse(storedAdminInfo)
      isLoggedIn.value = true
    }
  }
  
  // 登录
  const login = async (loginParams: LoginParams) => {
    try {
      const res = await adminLogin(loginParams)
      
      // 保存token和管理员信息
      localStorage.setItem('adminToken', res.data.token)
      localStorage.setItem('adminInfo', JSON.stringify(res.data))
      
      // 更新状态
      adminInfo.value = res.data
      isLoggedIn.value = true
      
      return Promise.resolve(res)
    } catch (error) {
      return Promise.reject(error)
    }
  }
  
  // 登出
  const logout = () => {
    // 清除本地存储
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminInfo')
    
    // 重置状态
    adminInfo.value = null
    isLoggedIn.value = false
  }
  
  return {
    adminInfo,
    isLoggedIn,
    initAdminState,
    login,
    logout
  }
})