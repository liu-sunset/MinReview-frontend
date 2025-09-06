import adminApi from './index';

// 食堂相关接口类型定义
export interface CanteenItem {
  id?: number;
  name: string;
  campusId: number;
  campusName?: string;
  address?: string;
  description: string;
  businessHours?: string;
  phone?: string;
  status: number;
  floorCount?: number;
  dishCount?: number;
  createTime?: string;
  updateTime?: string;
}

export interface CanteenListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  campusId?: number;
}

export interface CanteenListResponse {
  total: number;
  list: CanteenItem[];
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 食堂管理API
export const canteenApi = {
  // 获取食堂列表
  getCanteenList: (params: CanteenListParams = {}): Promise<ApiResponse<CanteenListResponse>> => {
    return adminApi.get('/admin/canteen/list', { params });
  },

  // 添加食堂
  addCanteen: (data: Omit<CanteenItem, 'id' | 'campusName' | 'floorCount' | 'dishCount' | 'createTime' | 'updateTime'>): Promise<ApiResponse> => {
    return adminApi.post('/admin/canteen', data);
  },

  // 更新食堂
  updateCanteen: (id: number, data: Partial<Omit<CanteenItem, 'id' | 'campusName' | 'floorCount' | 'dishCount' | 'createTime' | 'updateTime'>>): Promise<ApiResponse> => {
    return adminApi.put(`/admin/canteen/${id}`, data);
  },

  // 删除食堂
  deleteCanteen: (id: number): Promise<ApiResponse> => {
    return adminApi.delete(`/admin/canteen/${id}`);
  },

  // 更新食堂状态
  updateCanteenStatus: (id: number, status: number): Promise<ApiResponse> => {
    return adminApi.put(`/admin/canteen/status/${id}`, { status });
  }
};

export default canteenApi;