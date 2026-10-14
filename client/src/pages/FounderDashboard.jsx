import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleDollarSign, Plus, Trash2 } from 'lucide-react';
import { deleteStartup, listMyStartups } from '../api/startupApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function FounderDashboard() {
  const { user, signOut } = useAuth();
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStartups = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try { const result = await listMyStartups(); setStartups(result.startups); }
    catch (loadError) { setError(loadError.response?.data?.error || 'Could not load your startups. Please try again.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadStartups(); }, [loadStartups]);

  async function handleDelete(startup) {
    if (!window.confirm(`Delete ${startup.name}? This cannot be undone.`)) return;
    setError('');
    try {
      await deleteStartup(startup.id);
      setStartups((current) => current.filter((item) => item.id !== startup.id));
    } catch (deleteError) { setError(deleteError.response?.data?.error || 'Could not delete this startup. Try again.'); }
  }

  return (
    <main className="account-shell">
      <header className="topbar">
        <Link className="brand" to="/"><span className="brand-mark"><CircleDollarSign size={21} /></span><span>EquiVest</span></Link>
        <div className="landing-nav"><span className="nav-link">Founder</span><button className="nav-link button-link" onClick={signOut}>Sign out</button></div>
      </header>
      <section className="dashboard-heading">
        <div><p className="eyebrow">Founder workspace</p><h1>Welcome, {user.name}</h1><p>Manage your startup profiles and keep your funding story up to date.</p></div>
        <Link className="primary-link" to="/founder/startups/new"><Plus size={18} /> Add startup</Link>
      </section>
      <div className="dashboard-summary"><span className="summary-count">{isLoading ? '—' : startups.length}</span><span>Startup profiles</span></div>
      {error && <div className="form-alert" role="alert">{error} {!isLoading && <button className="inline-button" onClick={loadStartups}>Retry</button>}</div>}
      {isLoading ? <p className="loading-state" role="status">Loading your startups…</p> : startups.length === 0 ? (
        <section className="empty-state"><div className="empty-mark"><Plus size={22} /></div><h2>Start with your startup profile</h2><p>Share your company’s stage, funding goal, and pitch so investors can understand what you are building.</p><Link className="primary-link" to="/founder/startups/new">Create startup profile <ArrowRight size={18} /></Link></section>
      ) : (
        <section className="startup-grid" aria-label="Your startups">
          {startups.map((startup) => <article className="startup-card" key={startup.id}>
            <div className="startup-card-top"><span className="industry-pill">{startup.industry}</span><span className="stage-pill">{startup.stage}</span></div>
            <h2>{startup.name}</h2><p className="startup-tagline">{startup.tagline}</p>
            <dl className="startup-facts"><div><dt>Funding sought</dt><dd>{money.format(startup.amountSought)}</dd></div><div><dt>Location</dt><dd>{startup.location || 'Not specified'}</dd></div></dl>
            <div className="startup-actions"><Link className="secondary-link" to={`/founder/startups/${startup.id}/edit`}>Edit profile</Link><button className="icon-button danger-button" aria-label={`Delete ${startup.name}`} onClick={() => handleDelete(startup)}><Trash2 size={17} /></button></div>
          </article>)}
        </section>
      )}
    </main>
  );
}
