import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleDollarSign, Settings2 } from 'lucide-react';
import { getMatches } from '../api/matchApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const industries = ['Agriculture', 'Climate', 'Consumer', 'Education', 'FinTech', 'Healthcare', 'Manufacturing', 'Media', 'Real Estate', 'SaaS', 'Technology', 'Other'];
const stages = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'];
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function InvestorDashboard() {
  const { user, signOut } = useAuth();
  const [matches, setMatches] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [filters, setFilters] = useState({ industry: '', stage: '', sort: 'score' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    getMatches(params).then((result) => {
      if (active) { setMatches(result.matches); setPreferences(result.preferences); }
    }).catch((loadError) => {
      if (active) setError(loadError.response?.data?.error || 'Could not load startup matches. Please try again.');
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [filters]);

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <main className="account-shell">
      <header className="topbar"><Link className="brand" to="/"><span className="brand-mark"><CircleDollarSign size={21} /></span><span>EquiVest</span></Link><div className="landing-nav"><span className="nav-link">Investor</span><button className="nav-link button-link" onClick={signOut}>Sign out</button></div></header>
      <section className="dashboard-heading"><div><p className="eyebrow">Investor workspace</p><h1>Welcome, {user.name}</h1><p>Explore startups ranked by how closely they fit your investment criteria.</p></div><Link className="secondary-link" to="/investor/preferences"><Settings2 size={16} /> Preferences</Link></section>
      <section className="preferences-summary"><div><strong>Your investment criteria</strong><p>{preferences?.industries?.length ? preferences.industries.join(', ') : 'No preferred industries'} <span>·</span> {preferences?.stages?.length ? preferences.stages.join(', ') : 'No preferred stages'}</p><small>{preferences ? `${money.format(preferences.minTicket)} – ${money.format(preferences.maxTicket)}` : 'Loading preferences…'}</small></div><Link to="/investor/preferences">Edit preferences <span aria-hidden="true">→</span></Link></section>
      <section className="match-toolbar" aria-label="Match filters"><div><p className="eyebrow">Startup matches</p><h2>Explore opportunities</h2></div><div className="filter-controls"><label>Industry<select name="industry" value={filters.industry} onChange={updateFilter}><option value="">All industries</option>{industries.map((industry) => <option key={industry}>{industry}</option>)}</select></label><label>Stage<select name="stage" value={filters.stage} onChange={updateFilter}><option value="">All stages</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label><label>Sort by<select name="sort" value={filters.sort} onChange={updateFilter}><option value="score">Match score</option><option value="amount">Funding amount</option></select></label></div></section>
      {error && <div className="form-alert" role="alert">{error}</div>}
      {isLoading ? <p className="loading-state" role="status">Finding startups that match…</p> : matches.length === 0 ? <section className="empty-state"><h2>No startups found</h2><p>Try adjusting your filters or check back as founders add their profiles.</p></section> : (
        <section className="match-grid" aria-label="Ranked startup matches">
          {matches.map(({ startup, score, reasons }) => <article className="match-card" key={startup.id}>
            <div className="match-card-top"><span className="industry-pill">{startup.industry}</span><span className="stage-pill">{startup.stage}</span></div>
            <div className="match-score"><span>{score}%</span><div className="score-track" role="progressbar" aria-label={`${startup.name} match score`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={score}><span style={{ width: `${score}%` }} /></div><small>match</small></div>
            <h3>{startup.name}</h3><p className="startup-tagline">{startup.tagline}</p>
            <dl className="match-facts"><div><dt>Funding sought</dt><dd>{money.format(startup.amountSought)}</dd></div><div><dt>Location</dt><dd>{startup.location || 'Not specified'}</dd></div></dl>
            <details className="pitch-details"><summary>View pitch and matching reasons</summary><p>{startup.pitch}</p><ul>{reasons.map((reason) => <li key={reason.criterion} className={reason.matched ? 'reason-match' : 'reason-miss'}><span>{reason.points} pts</span> {reason.message}</li>)}</ul></details>
          </article>)}
        </section>
      )}
    </main>
  );
}
