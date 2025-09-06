import adminApi from './index';

// 菜品相关接口类型定义
export interface DishItem {
  id?: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId?: number;
  categoryName?: string;
  floorId: number;
  floorName?: string;
  canteenId: number;
  canteenName?: string;
  campusId: number;
  campusName?: string;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  status: number;
  updateTime?: string;
}

export interface DishListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  floorId?: number;
  categoryId?: number;
  canteenId?: number;
  campusId?: number;
}

export interface DishListResponse {
  total: number;
  list: DishItem[];
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 菜品管理API
export const dishApi = {
  // 获取菜品列表
  getDishList: (params: DishListParams = {}): Promise<ApiResponse<DishListResponse>> => {
    return adminApi.get('/admin/dish/list', { params });
  },

  // 添加菜品
  addDish: (data: Omit<DishItem, 'id' | 'likeCount' | 'dislikeCount' | 'commentCount' | 'updateTime'>): Promise<ApiResponse> => {
    return adminApi.post('/admin/dish', data);
  },

  // 更新菜品
  updateDish: (id: number, data: Partial<Omit<DishItem, 'id' | 'likeCount' | 'dislikeCount' | 'commentCount' | 'updateTime'>>): Promise<ApiResponse> => {
    return adminApi.put(`/admin/dish/${id}`, data);
  },

  // 删除菜品
  deleteDish: (id: number): Promise<ApiResponse> => {
    return adminApi.delete(`/admin/dish/${id}`);
  },

  // 更新菜品状态
  updateDishStatus: (id: number, status: number): Promise<ApiResponse> => {
    return adminApi.put(`/admin/dish/status/${id}`, { status });
  }
};

export default dishApi;