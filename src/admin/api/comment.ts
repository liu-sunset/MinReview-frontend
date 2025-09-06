import adminApi from './index';

// 评论接口类型定义
export interface CommentItem {
  id: number;
  userId: number;
  dishId: number;
  content: string;
  status: number;
  likeCount: number;
  name: string;
  avatarUrl: string;
  updateTime: string;
}

export interface CommentListParams {
  page: number;
  pageSize: number;
  dishId: number;
}

export interface CommentListResponse {
  total: number;
  list: CommentItem[];
}

// 获取评论列表
export const getCommentList = async (params: CommentListParams) => {
  const response = await adminApi.get('/admin/comment/list', {
    params
  });
  return response.data as CommentListResponse;
};

// 删除评论
export const deleteComment = async (commentId: number) => {
  const response = await adminApi.delete(`/admin/comment/${commentId}`);
  return response.data;
};