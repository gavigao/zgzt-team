import axios from 'axios';

// 创建统一的 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截器：自动附加 JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  // 成功：直接返回 data（即后端 { code, data, message }）
  (res) => res.data,
  // 失败：401 跳转登录，其他返回错误信息
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // 不在登录页才跳转，避免循环
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 428 && window.location.pathname !== '/change-password') {
      window.location.href = '/change-password';
    }
    const message = error.response?.data?.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

export default api;
