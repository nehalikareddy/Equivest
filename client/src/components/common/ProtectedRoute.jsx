import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ role }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <main className="auth-shell"><p role="status">Loading your account…</p></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'founder' ? '/founder' : '/investor'} replace />;
  return <Outlet />;
}
