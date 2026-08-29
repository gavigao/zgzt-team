import { Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, AuthenticatedRoute, AdminRoute, BackstageRoute, OnboardingRoute } from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// 前台页面
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import HonorsPage from './pages/HonorsPage';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import PhotosPage from './pages/PhotosPage';
import PhotoAlbumPage from './pages/PhotoAlbumPage';
import TrainingPage from './pages/TrainingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WelcomePage from './pages/WelcomePage';
import ProfilePage from './pages/ProfilePage';
import BoardPage from './pages/BoardPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// 管理后台页面
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminMatches from './pages/admin/AdminMatches';
import AdminMatchEdit from './pages/admin/AdminMatchEdit';
import AdminNews from './pages/admin/AdminNews';
import AdminNewsEdit from './pages/admin/AdminNewsEdit';
import AdminHonors from './pages/admin/AdminHonors';
import AdminPhotos from './pages/admin/AdminPhotos';
import AdminTraining from './pages/admin/AdminTraining';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import MyPlayerProfile from './pages/admin/MyPlayerProfile';

function AdminIndex() {
  const { isAdmin, user } = useAuth();
  if (isAdmin) return <AdminDashboard />;
  return <Navigate to={user?.player_id ? '/admin/my-player' : '/'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 公开前台页面 */}
        <Route element={<OnboardingRoute><PublicLayout /></OnboardingRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/honors" element={<HonorsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/photos/:albumId" element={<PhotoAlbumPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/board" element={<BoardPage />} />
        </Route>

        {/* 登录/注册（独立布局，无导航栏） */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/change-password"
          element={
            <AuthenticatedRoute>
              <ChangePasswordPage />
            </AuthenticatedRoute>
          }
        />

        {/* 新用户引导与账户资料 */}
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* 管理后台：管理员管理全站，已绑定队员可维护自己的资料。 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <BackstageRoute>
                <AdminLayout />
              </BackstageRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminIndex />} />
          <Route path="my-player" element={<MyPlayerProfile />} />
          <Route path="players" element={<AdminRoute><AdminPlayers /></AdminRoute>} />
          <Route path="matches" element={<AdminRoute><AdminMatches /></AdminRoute>} />
          <Route path="matches/:id/edit" element={<AdminRoute><AdminMatchEdit /></AdminRoute>} />
          <Route path="news" element={<AdminRoute><AdminNews /></AdminRoute>} />
          <Route path="news/:id/edit" element={<AdminRoute><AdminNewsEdit /></AdminRoute>} />
          <Route path="honors" element={<AdminRoute><AdminHonors /></AdminRoute>} />
          <Route path="photos" element={<AdminRoute><AdminPhotos /></AdminRoute>} />
          <Route path="training" element={<AdminRoute><AdminTraining /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
