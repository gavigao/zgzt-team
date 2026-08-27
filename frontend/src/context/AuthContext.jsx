import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getMeApi, updateUsernameApi, updateAvatarApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 初始加载：尝试恢复登录状态

  // 页面加载时，如果 localStorage 有 token，验证其有效性
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMeApi()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (account, password) => {
    const res = await loginApi(account, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (account, password) => {
    const res = await registerApi(account, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const updateUsername = useCallback(async (username) => {
    const res = await updateUsernameApi(username);
    setUser(res.data);
    return res.data;
  }, []);

  const updateAvatar = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await updateAvatarApi(formData);
    setUser(res.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const isOwner = user?.role === 'owner';
  const isAdmin = isOwner || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateUsername, updateAvatar, logout, isAdmin, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内部使用');
  return ctx;
}
