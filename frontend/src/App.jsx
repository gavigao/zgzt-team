import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, OnboardingRoute, OwnerRoute } from './components/ProtectedRoute';
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

        {/* 管理后台（需登录 + 管理员） — Phase 5 实现 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="matches" element={<AdminMatches />} />
          <Route path="matches/:id/edit" element={<AdminMatchEdit />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="news/:id/edit" element={<AdminNewsEdit />} />
          <Route path="honors" element={<AdminHonors />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="training" element={<AdminTraining />} />
          <Route path="users" element={<OwnerRoute><AdminUsers /></OwnerRoute>} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
