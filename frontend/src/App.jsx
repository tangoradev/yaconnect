import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import EventCreate from './pages/events/EventCreate';
import Components from './pages/Components';
import Login from './pages/Login';
import Register from './pages/Register';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectCreate from './pages/projects/ProjectCreate';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import GamificationDashboard from './pages/GamificationDashboard';
import Leaderboards from './pages/Leaderboards';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersAdmin from './pages/admin/UsersAdmin';
import RolesAdmin from './pages/admin/RolesAdmin';
import RegionsAdmin from './pages/admin/RegionsAdmin';
import InterestsAdmin from './pages/admin/InterestsAdmin';
import ProjectsAdmin from './pages/admin/ProjectsAdmin';
import EventsAdmin from './pages/admin/EventsAdmin';
import EventsArchivesAdmin from './pages/admin/EventsArchivesAdmin';
import GamificationAdmin from './pages/admin/GamificationAdmin';
import StatsAdmin from './pages/admin/StatsAdmin';
import LogsAdmin from './pages/admin/LogsAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import CmsAdmin from './pages/admin/CmsAdmin';
import ForumLayout from './components/forum/ForumLayout';
import ForumPage from './pages/forum/ForumPage';
import PostPage from './pages/forum/PostPage';
import SearchPage from './pages/forum/SearchPage';
import NotificationsPage from './pages/forum/NotificationsPage';
import LeaderboardPage from './pages/forum/LeaderboardPage';
import NewsListPage from './pages/cms/NewsListPage';
import NewsDetailPage from './pages/cms/NewsDetailPage';
import CmsPage from './pages/cms/CmsPage';

// Wrapper to conditionally render Navbar/Footer
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <LayoutWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/news" element={<NewsListPage />} />
            <Route path="/news/:slug" element={<NewsDetailPage />} />
            <Route path="/page/:slug" element={<CmsPage />} />
            
            {/* Forum Routes */}
            <Route path="/forum" element={<ForumLayout />}>
              <Route index element={<ForumPage />} />
              <Route path="topic/:topicId" element={<ForumPage />} />
              <Route path="post/:postId" element={<PostPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
            </Route>

            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/events/create" element={
              <ProtectedRoute>
                <EventCreate />
              </ProtectedRoute>
            } />
            <Route path="/components" element={<Components />} />
            <Route path="/leaderboards" element={<Leaderboards />} />

            {/* Projects Routes */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/projects/create" element={
              <ProtectedRoute>
                <ProjectCreate />
              </ProtectedRoute>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/gamification" element={
              <ProtectedRoute>
                <GamificationDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="roles" element={<RolesAdmin />} />
              <Route path="regions" element={<RegionsAdmin />} />
              <Route path="interests" element={<InterestsAdmin />} />
              <Route path="projects" element={<ProjectsAdmin />} />
              <Route path="events" element={<EventsAdmin />} />
              <Route path="events-archives" element={<EventsArchivesAdmin />} />
              <Route path="cms" element={<CmsAdmin />} />
              <Route path="gamification" element={<GamificationAdmin />} />
              <Route path="stats" element={<StatsAdmin />} />
              <Route path="logs" element={<LogsAdmin />} />
              <Route path="settings" element={<SettingsAdmin />} />
            </Route>
          </Routes>
        </LayoutWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;
