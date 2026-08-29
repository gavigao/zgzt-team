import api from './index';

export const getMyPlayerProfile = () => api.get('/player-profile/me');
export const updateMyPlayerProfile = data => api.put('/player-profile/me', data);
export const updateMyPlayerPhoto = formData => api.post('/player-profile/me/photo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
