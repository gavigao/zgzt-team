import api from './index';

// ==================== 球队信息 ====================
export const getTeamInfo = (key) => api.get(`/public/team-info/${key}`);

// ==================== 队员 ====================
export const getPlayers = (params = {}) => api.get('/public/players', { params });
export const getPlayerById = (id) => api.get(`/public/players/${id}`);

// ==================== 赛季 ====================
export const getSeasons = () => api.get('/public/seasons');

// ==================== 比赛 ====================
export const getMatches = (params = {}) => api.get('/public/matches', { params });
export const getMatchById = (id) => api.get(`/public/matches/${id}`);

// ==================== 荣誉 ====================
export const getHonors = (params = {}) => api.get('/public/honors', { params });

// ==================== 新闻 ====================
export const getNews = (params = {}) => api.get('/public/news', { params });
export const getNewsById = (id) => api.get(`/public/news/${id}`);

// ==================== 相册 ====================
export const getAlbums = () => api.get('/public/albums');
export const getAlbumPhotos = (albumId) => api.get(`/public/albums/${albumId}/photos`);

// ==================== 首页轮播 ====================
export const getHomeSlides = () => api.get('/public/home-slides');

// ==================== 训练 ====================
export const getTrainingSchedules = (params = {}) => api.get('/public/training', { params });
