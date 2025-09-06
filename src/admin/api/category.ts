import adminApi from './index';

// 菜品分类相关接口类型定义
export interface CategoryItem {
  id?: number;
  name: string;
  description?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface CategoryListResponse {
  total: number;
  list: CategoryItem[];
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 菜品分类管理API
export const categoryApi = {
  // 获取菜品分类列表
  getCategoryList: (params: CategoryListParams = {}): Promise<ApiResponse<CategoryListResponse>> => {
    return adminApi.get('/admin/category/list', { params });
  },

  // 添加菜品分类
  addCategory: (data: Omit<CategoryItem, 'id' | 'createTime' | 'updateTime'>): Promise<ApiResponse> => {
    return adminApi.post('/admin/category', data);
  },

  // 更新菜品分类
  updateCategory: (id: number, data: Partial<Omit<CategoryItem, 'id' | 'createTime' | 'updateTime'>>): Promise<ApiResponse> => {
    return adminApi.put(`/admin/category/${id}`, data);
  },

  // 删除菜品分类
  deleteCategory: (id: number): Promise<ApiResponse> => {
    return adminApi.delete(`/admin/category/${id}`);
  },

  // 更新菜品分类状态
  updateCategoryStatus: (id: number, status: number): Promise<ApiResponse> => {
    return adminApi.put(`/admin/category/status/${id}`, { status });
  }
};

export default categoryApi;