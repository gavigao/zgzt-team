import api from './index';

// 获取某场比赛的评论
export const getComments = (matchId) => api.get(`/comments/matches/${matchId}`);

// 发表评论
export const createComment = (matchId, content, parentId = null) =>
  api.post(`/comments/matches/${matchId}`, { content, parent_id: parentId });

// 删除评论
export const deleteComment = (id) => api.delete(`/comments/${id}`);

// 点赞/取消点赞
export const toggleLike = (id) => api.post(`/comments/${id}/like`);
