import adminApi from './index';

// 校区接口类型定义
export interface CampusItem {
  id?: number;
  name: string;
  address: string;
  description?: string;
  status: number;
  canteenCount: number;
}

export interface CampusListParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface CampusListResponse {
  total: number;
  list: CampusItem[];
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface CampusFormData {
  name: string;
  address: string;
  description?: string;
}

// 获取校区列表
export const getCampusList = async (params?: CampusListParams): Promise<ApiResponse<CampusListResponse>> => {
  const response = await adminApi.get('/admin/campus/list', { params });
  return response;
};

// 校区管理API
export const campusApi = {
  // 获取校区列表
  getCampusList: (params?: CampusListParams) => getCampusList(params),
  
  // 添加校区
  addCampus: (data: CampusFormData) => addCampus(data),
  
  // 更新校区
  updateCampus: (campusId: number, data: CampusFormData) => updateCampus(campusId, data),
  
  // 删除校区
  deleteCampus: (campusId: number) => deleteCampus(campusId),
  
  // 更新校区状态
  updateCampusStatus: (campusId: number, status: number) => updateCampusStatus(campusId, status)
};

// 添加校区
export const addCampus = async (data: CampusFormData): Promise<ApiResponse> => {
  const response = await adminApi.post('/admin/campus', data);
  return response;
};

// 更新校区
export const updateCampus = async (campusId: number, data: CampusFormData): Promise<ApiResponse> => {
  const response = await adminApi.put(`/admin/campus/${campusId}`, data);
  return response;
};

// 删除校区
export const deleteCampus = async (campusId: number): Promise<ApiResponse> => {
  const response = await adminApi.delete(`/admin/campus/${campusId}`);
  return response;
};

// 更新校区状态
export const updateCampusStatus = async (campusId: number, status: number): Promise<ApiResponse> => {
  const response = await adminApi.put(`/admin/campus/status/${campusId}`, { status });
  return response;
};