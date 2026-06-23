import api from './index';

// 获取某场比赛的评论
export const getComments = (matchId) => api.get(`/comments/matches/${matchId}`);

// 发表评论
export const createComment = (matchId, content) =>
  api.post(`/comments/matches/${matchId}`, { content });

// 删除评论
export const deleteComment = (id) => api.delete(`/comments/${id}`);
