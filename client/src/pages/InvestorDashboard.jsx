import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkCheck, BookmarkPlus, Settings2 } from 'lucide-react';
import { getMatches } from '../api/matchApi.js';
import { addToShortlist, listShortlist } from '../api/shortlistApi.js';
import NavBar from '../components/common/NavBar.jsx';
import { INDUSTRIES, STAGES } from '../constants/startupOptions.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../utils/format.js';

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [shortlistIds, setShortlistIds] = useState(new Set());
  const [shortlistLoaded, setShortlistLoaded] = useState(false);
  const [savingStartupId, setSavingStartupId] = useState('');
  const [shortlistError, setShortlistError] = useState('');
  const [filters, setFilters] = useState({ industry: '', stage: '', sort: 'score' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const isFirstRender = useRef(true);

  useEffect(() => { document.title = 'Investor Dashboard — EquiVest'; }, []);

  useEffect(() => {
    let active = true;
    const fetchMatches = () => {
      setIsLoading(true);
      setError('');
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      getMatches(params).then((result) => {
        if (active) { setMatches(result.matches); setPreferences(result.preferences); }
      }).catch((loadError) => {
        if (active) setError(loadError.response?.data?.error || 'Could not load startup matches. Please try again.');
      }).finally(() => { if (active) setIsLoading(false); });
    };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchMatches();
      return () => { active = false; };
    }

    const debounceTimer = setTimeout(fetchMatches, 150);
    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [filters]);

  useEffect(() => {
    let active = true;
    listShortlist().then(({ shortlist }) => {
      if (active) setShortlistIds(new Set(shortlist.map((item) => item.startup.id)));
    }).catch(() => {
      if (active) setShortlistError('Could not load your shortlist status.');
    }).finally(() => { if (active) setShortlistLoaded(true); });
    return () => { active = false; };
  }, []);

  const industrySummary = useMemo(
    () => (preferences?.industries?.length ? preferences.industries.join(', ') : 'No preferred industries'),
    [preferences]
  );
  const stageSummary = useMemo(
    () => (preferences?.stages?.length ? preferences.stages.join(', ') : 'No preferred stages'),
    [preferences]
  );

  async function saveStartup(startupId) {
    setSavingStartupId(startupId);
    setShortlistError('');
    try {
      await addToShortlist(startupId);
      setShortlistIds((current) => new Set([...current, startupId]));
    } catch (saveError) {
      setShortlistError(saveError.response?.data?.error || 'Could not add this startup to your shortlist.');
    } finally { setSavingStartupId(''); }
  }

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <main className="account-shell">
      <NavBar>
        <Link className="nav-link" to="/investor/shortlist">My shortlist</Link>
        <span className="nav-link">Investor</span>
      </NavBar>
      <section className="dashboard-heading"><div><p className="eyebrow">Investor workspace</p><h1>Welcome, {user.name}</h1><p>Explore startups ranked by how closely they fit your investment criteria.</p></div><Link className="secondary-link" to="/investor/preferences"><Settings2 size={16} /> Preferences</Link></section>
      <section className="preferences-summary"><div><strong>Your investment criteria</strong><p>{industrySummary} <span>·</span> {stageSummary}</p><small>{preferences ? `${formatINR.format(preferences.minTicket)} – ${formatINR.format(preferences.maxTicket)}` : 'Loading preferences…'}</small></div><Link to="/investor/preferences">Edit preferences <span aria-hidden="true">→</span></Link></section>
      <section className="match-toolbar" aria-label="Match filters"><div><p className="eyebrow">Startup matches</p><h2>Explore opportunities</h2></div><div className="filter-controls"><label>Industry<select name="industry" value={filters.industry} onChange={updateFilter}><option value="">All industries</option>{INDUSTRIES.map((industry) => <option key={industry}>{industry}</option>)}</select></label><label>Stage<select name="stage" value={filters.stage} onChange={updateFilter}><option value="">All stages</option>{STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></label><label>Sort by<select name="sort" value={filters.sort} onChange={updateFilter}><option value="score">Match score</option><option value="amount">Funding amount</option></select></label></div></section>
      {error && <div className="form-alert" role="alert" aria-live="polite">{error}</div>}
      {shortlistError && <div className="form-alert" role="alert" aria-live="polite">{shortlistError}</div>}
      {isLoading ? (
        <div className="loading-state" role="status" aria-live="polite">
          <span>Finding startups that match…</span>
          <div className="skeleton-grid" aria-hidden="true"><div className="skeleton-card" /><div className="skeleton-card" /></div>
        </div>
      ) : matches.length === 0 ? <section className="empty-state"><h2>No startups found</h2><p>Try adjusting your filters or check back as founders add their profiles.</p></section> : (
        <section className="match-grid" aria-label="Ranked startup matches">
          {matches.map(({ startup, score, reasons }) => <article className="match-card" key={startup.id}>
            <div className="match-card-top"><span className="industry-pill">{startup.industry}</span><span className="stage-pill">{startup.stage}</span></div>
            <div className="match-score"><span>{score}%</span><div className="score-track" role="progressbar" aria-label={`${startup.name} match score`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={score}><span style={{ width: `${score}%` }} /></div><small>match</small></div>
            <h3>{startup.name}</h3><p className="startup-tagline">{startup.tagline}</p>
            <dl className="match-facts"><div><dt>Funding sought</dt><dd>{formatINR.format(startup.amountSought)}</dd></div><div><dt>Location</dt><dd>{startup.location || 'Not specified'}</dd></div></dl>
            <details className="pitch-details"><summary>View pitch and matching reasons</summary><p>{startup.pitch}</p><ul>{reasons.map((reason) => <li key={reason.criterion} className={reason.matched ? 'reason-match' : 'reason-miss'}><span>{reason.points} pts</span> {reason.message}</li>)}</ul></details>
            <div className="match-card-actions"><Link className="secondary-link" to={`/startups/${startup.id}`}>View details</Link><button className="shortlist-button" disabled={!shortlistLoaded || shortlistIds.has(startup.id) || savingStartupId === startup.id} onClick={() => saveStartup(startup.id)}>{shortlistIds.has(startup.id) ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}{savingStartupId === startup.id ? 'Saving…' : shortlistIds.has(startup.id) ? 'Shortlisted' : 'Shortlist'}</button></div>
          </article>)}
        </section>
      )}
    </main>
  );
}