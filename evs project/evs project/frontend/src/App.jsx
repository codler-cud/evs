import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import ActivityPage from './pages/ActivityPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AuthPage from './pages/AuthPage';
import ChallengesPage from './pages/ChallengesPage';
import CollectionCentresPage from './pages/CollectionCentresPage';
import DashboardPage from './pages/DashboardPage';
import IdentifyWastePage from './pages/IdentifyWastePage';
import LandingPage from './pages/LandingPage';
import LearnPage from './pages/LearnPage';
import ProfilePage from './pages/ProfilePage';
import ScanWastePage from './pages/ScanWastePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/identify" element={<IdentifyWastePage />} />
            <Route path="/scan" element={<ScanWastePage />} />
            <Route path="/centres" element={<CollectionCentresPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/learn" element={<LearnPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <ActivityPage />
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
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
