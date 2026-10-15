import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Sparkles, Trash2 } from 'lucide-react';
import { analyzeStartupPitch, deleteStartup, listMyStartups } from '../api/startupApi.js';
import NavBar from '../components/common/NavBar.jsx';
import StartupCard from '../components/StartupCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function FounderDashboard() {
  const { user } = useAuth();
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pitchAnalyses, setPitchAnalyses] = useState({});

  useEffect(() => { document.title = 'Founder Dashboard — EquiVest'; }, []);

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

  async function handleAnalyze(startup) {
    setPitchAnalyses((current) => ({ ...current, [startup.id]: { loading: true, error: '', analysis: null } }));
    try {
      const { analysis } = await analyzeStartupPitch(startup.id);
      setPitchAnalyses((current) => ({ ...current, [startup.id]: { loading: false, error: '', analysis } }));
    } catch (analysisError) {
      setPitchAnalyses((current) => ({ ...current, [startup.id]: { loading: false, error: analysisError.response?.data?.error || 'Could not analyze this pitch. Please retry.', analysis: null } }));
    }
  }

  return (
    <main className="account-shell">
      <NavBar><span className="nav-link">Founder</span></NavBar>
      <section className="dashboard-heading">
        <div><p className="eyebrow">Founder workspace</p><h1>Welcome, {user.name}</h1><p>Manage your startup profiles and keep your funding story up to date.</p></div>
        <Link className="primary-link" to="/founder/startups/new"><Plus size={18} /> Add startup</Link>
      </section>
      <div className="dashboard-summary"><span className="summary-count">{isLoading ? '—' : startups.length}</span><span>Startup profiles</span></div>
      {error && <div className="form-alert" role="alert" aria-live="polite">{error} {!isLoading && <button className="inline-button" onClick={loadStartups}>Retry</button>}</div>}
      {isLoading ? <div className="loading-state" role="status" aria-live="polite"><span>Loading your startups…</span><div className="skeleton-grid" aria-hidden="true"><div className="skeleton-card" /><div className="skeleton-card" /></div></div> : startups.length === 0 ? (
        <section className="empty-state"><div className="empty-mark"><Plus size={22} /></div><h2>Start with your startup profile</h2><p>Share your company’s stage, funding goal, and pitch so investors can understand what you are building.</p><Link className="primary-link" to="/founder/startups/new">Create startup profile <ArrowRight size={18} /></Link></section>
      ) : (
        <section className="startup-grid" aria-label="Your startups">
          {startups.map((startup) => (
            <StartupCard
              key={startup.id}
              startup={startup}
              actions={
                <>
                  <Link className="secondary-link" to={`/founder/startups/${startup.id}/edit`}>Edit profile</Link>
                  <button className="secondary-link" onClick={() => handleAnalyze(startup)} disabled={pitchAnalyses[startup.id]?.loading}>
                    <Sparkles size={16} />{pitchAnalyses[startup.id]?.loading ? 'Analyzing…' : 'Analyze pitch'}
                  </button>
                  <button className="icon-button danger-button" aria-label={`Delete ${startup.name}`} onClick={() => handleDelete(startup)}>
                    <Trash2 size={17} />
                  </button>
                </>
              }
            >
              {pitchAnalyses[startup.id]?.error && <div className="form-alert" role="alert" aria-live="polite">{pitchAnalyses[startup.id].error} <button className="inline-button" onClick={() => handleAnalyze(startup)}>Retry</button></div>}
              {pitchAnalyses[startup.id]?.analysis && (
                <section className="pitch-analysis" aria-label={`${startup.name} pitch analysis`}>
                  <h3>Pitch feedback</h3><p>{pitchAnalyses[startup.id].analysis.summary}</p>
                  {['strengths', 'missingInformation', 'suggestions'].map((key) => (
                    <div key={key}>
                      <h4>{key === 'missingInformation' ? 'Missing or weak information' : key[0].toUpperCase() + key.slice(1)}</h4>
                      <ul>{pitchAnalyses[startup.id].analysis[key].map((item, index) => <li key={`${key}-${index}`}>{item}</li>)}</ul>
                    </div>
                  ))}
                  <small>AI generated feedback may be inaccurate and is not investment advice.</small>
                </section>
              )}
            </StartupCard>
          ))}
        </section>
      )}
    </main>
  );
}