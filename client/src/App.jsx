import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ArrowRight, CircleDollarSign, Handshake, Search } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import FounderDashboard from './pages/FounderDashboard.jsx';
import StartupFormPage from './pages/StartupFormPage.jsx';
import InvestorDashboard from './pages/InvestorDashboard.jsx';
import InvestorPreferencesPage from './pages/InvestorPreferencesPage.jsx';

function LandingPage() {
  const { user, isLoading } = useAuth();
  const homePath = user?.role === 'founder' ? '/founder' : '/investor';
  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="EquiVest home"><span className="brand-mark"><CircleDollarSign size={21} /></span><span>EquiVest</span></Link>
        <nav className="landing-nav" aria-label="Main navigation">
          {user ? <Link className="nav-link" to={homePath}>My account</Link> : !isLoading && <><Link className="nav-link" to="/login">Sign in</Link><Link className="nav-action" to="/register">Get started</Link></>}
        </nav>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Capital meets conviction</p>
          <h1>Find the right partners for your next stage.</h1>
          <p className="intro">EquiVest is building a clearer way for founders and investors to discover opportunities that fit.</p>
          <Link className="primary-link" to={user ? homePath : '/register'}>{user ? 'Open your account' : 'Get started'} <ArrowRight size={18} /></Link>
        </div>
        <div className="hero-card" aria-label="Platform preview">
          <div className="card-heading"><span className="status-dot" /> A more focused introduction</div>
          <div className="preview-line"><span className="preview-icon"><Search size={18} /></span><span><strong>Discover</strong><small>Explore aligned opportunities</small></span></div>
          <div className="preview-line"><span className="preview-icon"><Handshake size={18} /></span><span><strong>Connect</strong><small>Compare preferences with clarity</small></span></div>
          <div className="preview-foot">Matching criteria will be transparent and explainable.</div>
        </div>
      </section>
      <section id="how-it-works" className="info-section">
        <p className="eyebrow">Designed for both sides</p>
        <div className="info-grid">
          <article><h2>For founders</h2><p>Present your startup’s stage, funding needs, and vision in one clear profile.</p></article>
          <article><h2>For investors</h2><p>Set your investment preferences and review startups ranked against them.</p></article>
          <article><h2>Clear by design</h2><p>Understand the factors behind a match instead of relying on a black box.</p></article>
        </div>
      </section>
      <footer>EquiVest <span>·</span> Building better startup introductions</footer>
    </main>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={user.role === 'founder' ? '/founder' : '/investor'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute role="founder" />}>
        <Route path="/founder" element={<FounderDashboard />} />
        <Route path="/founder/startups/new" element={<StartupFormPage />} />
        <Route path="/founder/startups/:startupId/edit" element={<StartupFormPage />} />
      </Route>
      <Route element={<ProtectedRoute role="investor" />}>
        <Route path="/investor" element={<InvestorDashboard />} />
        <Route path="/investor/preferences" element={<InvestorPreferencesPage />} />
      </Route>
      <Route element={<ProtectedRoute />}><Route path="/account" element={<RoleRedirect />} /></Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
