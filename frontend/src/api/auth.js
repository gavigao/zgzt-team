import api from './index';

export const loginApi = (account, password) =>
  api.post('/auth/login', { account, password });

export const registerApi = (account, password) =>
  api.post('/auth/register', { account, password });

export const getMeApi = () =>
  api.get('/auth/me');

export const updateUsernameApi = (username) =>
  api.put('/auth/me/username', { username });
