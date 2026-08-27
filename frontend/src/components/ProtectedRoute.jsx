import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-main">
      <div className="skeleton w-8 h-8 rounded-full" />
    </div>
  );
}

// 需登录才能访问
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// 已登录但尚未设置公开用户名时，只允许进入欢迎页。
export function OnboardingRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user && !user.username) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}

// 需管理员才能访问
export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 仅总负责人可访问（例如任命或撤销管理员）。
export function OwnerRoute({ children }) {
  const { user, isOwner, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOwner) return <Navigate to="/admin" replace />;

  return children;
}
