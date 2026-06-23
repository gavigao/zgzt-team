import api from './index';

export const loginApi = (username, password) =>
  api.post('/auth/login', { username, password });

export const registerApi = (username, password, email) =>
  api.post('/auth/register', { username, password, email });

export const getMeApi = () =>
  api.get('/auth/me');
