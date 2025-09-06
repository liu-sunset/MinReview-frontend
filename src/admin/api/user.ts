import adminApi from './index';

// 用户接口类型定义
export interface UserItem {
  id: number;
  name: string;
  avatarUrl: string;
  gender: number;
  status: number;
  phone: string;
  updateTime: string;
}

export interface UserListParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface UserListResponse {
  total: number;
  list: UserItem[];
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 获取用户列表
export const getUserList = async (params: UserListParams): Promise<ApiResponse<UserListResponse>> => {
  const response = await adminApi.get('/admin/user/list', { params });
  return response;
};

// 更新用户状态
export const updateUserStatus = async (userId: number, status: number): Promise<ApiResponse> => {
  const response = await adminApi.put(`/admin/user/status/${userId}`, { status });
  return response;
};

// 删除用户
export const deleteUser = async (userId: number): Promise<ApiResponse> => {
  const response = await adminApi.delete(`/admin/user/${userId}`);
  return response;
};