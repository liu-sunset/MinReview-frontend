import request from './index'

// 管理员接口类型定义
export interface AdminItem {
  id?: number
  username: string
  name: string
  status: number
  updateTime?: string
}

export interface AdminListParams {
  page?: number
  pageSize?: number
  name?: string
}

export interface AdminListResponse {
  total: number
  list: AdminItem[]
}

export interface AddAdminParams {
  username: string
  password: string
  name: string
}

export interface UpdateAdminNameParams {
  name: string
}

export interface UpdatePasswordParams {
  oldPassword: string
  newPassword: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  id: number
  username: string
  name: string
}

/**
 * 管理员登录
 */
export const adminLogin = (data: LoginParams) => {
  return request.post<LoginResponse>('/admin/login', data)
}

/**
 * 获取管理员列表
 */
export const getAdminList = (params: AdminListParams) => {
  return request.get<AdminListResponse>('/admin/admin/list', { params })
}

/**
 * 添加管理员
 */
export const addAdmin = (data: AddAdminParams) => {
  return request.post('/admin/admin', data)
}

/**
 * 更新管理员名称
 */
export const updateAdminName = (adminId: number, data: UpdateAdminNameParams) => {
  return request.put(`/admin/admin/name/${adminId}`, data)
}

/**
 * 删除管理员
 */
export const deleteAdmin = (adminId: number) => {
  return request.delete(`/admin/admin/${adminId}`)
}

/**
 * 修改管理员状态
 */
export const updateAdminStatus = (adminId: number, status: number) => {
  return request.put(`/admin/admin/status/${adminId}/${status}`)
}

/**
 * 更新管理员密码
 */
export const updateAdminPassword = (adminId: number, data: UpdatePasswordParams) => {
  return request.put(`/admin/admin/password/${adminId}`, data)
}