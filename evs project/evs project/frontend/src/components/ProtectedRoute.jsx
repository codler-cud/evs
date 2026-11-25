import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-emerald-900">
          <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading your EcoSort session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 ecosort-card text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Administrator Access Required</h2>
        <p className="text-slate-600 text-sm mb-4">
          This area is restricted to EcoSort administrators. Sign in with an admin account to view analytics and manage catalog data.
        </p>
      </div>
    );
  }

  return children;
}
