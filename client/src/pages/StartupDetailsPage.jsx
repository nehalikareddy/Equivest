import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getStartup } from '../api/startupApi.js';
import { getMatches } from '../api/matchApi.js';
import NavBar from '../components/common/NavBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../utils/format.js';

export default function StartupDetailsPage() {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startup, setStartup] = useState(null);
  const [match, setMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { document.title = startup ? `${startup.name} — EquiVest` : 'Startup Details — EquiVest'; }, [startup]);

  useEffect(() => {
    let active = true;
    const matchRequest = user.role === 'investor' ? getMatches().catch(() => null) : Promise.resolve(null);
    Promise.all([getStartup(startupId), matchRequest]).then(([startupResult, matchResult]) => {
      if (!active) return;
      setStartup(startupResult.startup);
      setMatch(matchResult?.matches.find((item) => item.startup.id === startupId) || null);
    }).catch((loadError) => {
      if (active) setError(loadError.response?.data?.error || 'Could not load startup details.');
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [startupId, user.role]);

  return (
    <main className="account-shell form-page">
      <NavBar />
      <section className="form-page-heading">
        <button type="button" className="back-link button-link" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
      </section>
      {error && <div className="form-alert" role="alert" aria-live="polite">{error}</div>}
      {isLoading ? <p className="loading-state" role="status">Loading startup details…</p> : startup && <article className="startup-detail-card">
        <div className="startup-card-top"><span className="industry-pill">{startup.industry}</span><span className="stage-pill">{startup.stage}</span></div>
        {match && <div className="detail-score">{match.score}% match with your preferences</div>}
        <h1>{startup.name}</h1><p className="detail-tagline">{startup.tagline}</p>
        <dl className="startup-facts"><div><dt>Funding sought</dt><dd>{formatINR.format(startup.amountSought)}</dd></div><div><dt>Location</dt><dd>{startup.location || 'Not specified'}</dd></div><div><dt>Business model</dt><dd>{startup.businessModel || 'Not specified'}</dd></div></dl>
        <h2>Company pitch</h2><p className="full-pitch">{startup.pitch}</p>
        {startup.website && <p><a className="detail-website" href={startup.website} target="_blank" rel="noreferrer">Visit company website</a></p>}
        {match && <section className="detail-reasons"><h2>Why this matches</h2><ul>{match.reasons.map((reason) => <li key={reason.criterion}><strong>{reason.points} pts</strong> {reason.message}</li>)}</ul></section>}
      </article>}
    </main>
  );
}