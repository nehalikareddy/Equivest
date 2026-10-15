import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import FounderDashboard from './pages/FounderDashboard.jsx';
import StartupFormPage from './pages/StartupFormPage.jsx';
import InvestorDashboard from './pages/InvestorDashboard.jsx';
import InvestorPreferencesPage from './pages/InvestorPreferencesPage.jsx';
import ShortlistPage from './pages/ShortlistPage.jsx';
import StartupDetailsPage from './pages/StartupDetailsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={user.role === 'founder' ? '/founder' : '/investor'} replace />;
}

function PublicOnlyRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p role="status" className="loading-state">Loading...</p>;
  if (user) return <Navigate to={user.role === 'founder' ? '/founder' : '/investor'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route element={<ProtectedRoute role="founder" />}>
        <Route path="/founder" element={<FounderDashboard />} />
        <Route path="/founder/startups/new" element={<StartupFormPage />} />
        <Route path="/founder/startups/:startupId/edit" element={<StartupFormPage />} />
      </Route>
      <Route element={<ProtectedRoute role="investor" />}>
        <Route path="/investor" element={<InvestorDashboard />} />
        <Route path="/investor/preferences" element={<InvestorPreferencesPage />} />
        <Route path="/investor/shortlist" element={<ShortlistPage />} />
      </Route>
      <Route element={<ProtectedRoute />}><Route path="/startups/:startupId" element={<StartupDetailsPage />} /></Route>
      <Route element={<ProtectedRoute />}><Route path="/account" element={<RoleRedirect />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}