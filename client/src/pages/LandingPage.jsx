import { Link } from 'react-router-dom';
import { ArrowRight, CircleDollarSign, Handshake, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const homePath = user?.role === 'founder' ? '/founder' : '/investor';

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="EquiVest home"><span className="brand-mark"><CircleDollarSign size={21} /></span><span>EquiVest</span></Link>
        <nav className="landing-nav" aria-label="Main navigation">
          {user ? <Link className="nav-link" to={homePath}>My dashboard</Link> : !isLoading && <><Link className="nav-link" to="/login">Sign in</Link><Link className="nav-action" to="/register">Register</Link></>}
        </nav>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Startup &amp; investor matching</p>
          <h1>Find the right partners for your next stage.</h1>
          <p className="intro">EquiVest helps founders present their funding goals and lets investors discover startups aligned with their preferences.</p>
          <div className="landing-actions">
            {user ? <Link className="primary-link" to={homePath}>Open your dashboard <ArrowRight size={18} /></Link> : <><Link className="primary-link" to="/register">Register <ArrowRight size={18} /></Link><Link className="secondary-link" to="/login">Sign in</Link></>}
          </div>
        </div>
        <div className="hero-card" aria-label="Platform preview">
          <div className="card-heading"><span className="status-dot" /> A more focused introduction</div>
          <div className="preview-line"><span className="preview-icon"><Search size={18} /></span><span><strong>Discover</strong><small>Explore aligned opportunities</small></span></div>
          <div className="preview-line"><span className="preview-icon"><Handshake size={18} /></span><span><strong>Compare</strong><small>Review clear matching criteria</small></span></div>
          <div className="preview-foot">Matching criteria are transparent and explainable.</div>
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
