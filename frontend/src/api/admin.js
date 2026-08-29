import api from './index';

// 仪表盘
export const getDashboard = () => api.get('/admin/dashboard');

// 队员 CRUD
export const listPlayers = () => api.get('/admin/players');
export const createPlayer = (data) => api.post('/admin/players', data);
export const updatePlayer = (id, data) => api.put(`/admin/players/${id}`, data);
export const deletePlayer = (id) => api.delete(`/admin/players/${id}`);

// 比赛 CRUD
export const listMatches = () => api.get('/admin/matches');
export const createMatch = (data) => api.post('/admin/matches', data);
export const updateMatch = (id, data) => api.put(`/admin/matches/${id}`, data);
export const deleteMatch = (id) => api.delete(`/admin/matches/${id}`);

// 新闻 CRUD
export const listNews = () => api.get('/admin/news');
export const createNews = (data) => api.post('/admin/news', data);
export const updateNews = (id, data) => api.put(`/admin/news/${id}`, data);
export const deleteNews = (id) => api.delete(`/admin/news/${id}`);

// 荣誉 CRUD
export const listHonors = () => api.get('/admin/honors');
export const createHonor = (data) => api.post('/admin/honors', data);
export const updateHonor = (id, data) => api.put(`/admin/honors/${id}`, data);
export const deleteHonor = (id) => api.delete(`/admin/honors/${id}`);

// 相册 CRUD
export const listAlbums = () => api.get('/admin/albums');
export const createAlbum = (data) => api.post('/admin/albums', data);
export const updateAlbum = (id, data) => api.put(`/admin/albums/${id}`, data);
export const deleteAlbum = (id) => api.delete(`/admin/albums/${id}`);

// 照片
export const uploadPhoto = (albumId, formData) => {
  // formData 需要包含 'image' 文件字段
  return api.post(`/admin/albums/${albumId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deletePhoto = (id) => api.delete(`/admin/photos/${id}`);
export const movePhoto = (id, albumId) => api.put(`/admin/photos/${id}/album`, { album_id: albumId });
export const uploadImage = (formData) => api.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// 训练 CRUD
export const listTraining = () => api.get('/admin/training');
export const createTraining = (data) => api.post('/admin/training', data);
export const updateTraining = (id, data) => api.put(`/admin/training/${id}`, data);
export const deleteTraining = (id) => api.delete(`/admin/training/${id}`);

// 用户管理
export const listUsers = () => api.get('/admin/users');
export const createUser = data => api.post('/admin/users', data);
export const bindUserPlayer = (id, playerId) => api.put(`/admin/users/${id}/player`, { player_id: playerId || null });
export const resetUserPassword = id => api.post(`/admin/users/${id}/reset-password`);
export const deleteUser = id => api.delete(`/admin/users/${id}`);
export const updateUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });

// 球队设置
export const updateTeamInfo = (key, data) => api.put(`/admin/team-info/${key}`, data);
