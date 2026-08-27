import api from './index';

export const getBoardPosts = (params = {}) => api.get('/board/posts', { params });
export const createBoardPost = (data) => api.post('/board/posts', data);
export const deleteBoardPost = (id) => api.delete(`/board/posts/${id}`);
export const toggleBoardPostLike = (id) => api.post(`/board/posts/${id}/like`);
export const getBoardComments = (postId) => api.get(`/board/posts/${postId}/comments`);
export const createBoardComment = (postId, content) =>
  api.post(`/board/posts/${postId}/comments`, { content });
export const deleteBoardComment = (id) => api.delete(`/board/comments/${id}`);
