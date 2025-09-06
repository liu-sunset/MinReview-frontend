import adminApi from './index'

// 楼层接口类型定义
export interface FloorItem {
  id?: number
  name: string
  canteenId: number
  canteenName?: string
  floorNumber?: number
  description?: string
  dishCount?: number
  createTime?: string
  updateTime?: string
}

// 楼层列表查询参数
export interface FloorListParams {
  page?: number
  pageSize?: number
  keyWord?: string
  canteenId?: number
}

// 楼层列表响应
export interface FloorListResponse {
  total: number
  list: FloorItem[]
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 楼层管理API
export const floorApi = {
  // 获取楼层列表
  getFloorList: (params: FloorListParams): Promise<ApiResponse<FloorListResponse>> => {
    return adminApi.get('/admin/floor/list', { params })
  },

  // 添加楼层
  addFloor: (data: Omit<FloorItem, 'id' | 'canteenName' | 'dishCount' | 'createTime' | 'updateTime'>): Promise<ApiResponse> => {
    return adminApi.post('/admin/floor', data)
  },

  // 删除楼层
  deleteFloor: (floorId: number): Promise<ApiResponse> => {
    return adminApi.delete(`/admin/floor/${floorId}`)
  }
}