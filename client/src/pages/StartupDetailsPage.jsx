import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleDollarSign } from 'lucide-react';
import { getStartup } from '../api/startupApi.js';
import { getMatches } from '../api/matchApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function StartupDetailsPage() {
  const { startupId } = useParams();
  const { user, signOut } = useAuth();
  const [startup, setStartup] = useState(null);
  const [match, setMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const backPath = user.role === 'investor' ? '/investor/shortlist' : '/founder';
  return (
    <main className="account-shell form-page">
      <header className="topbar"><Link className="brand" to="/"><span className="brand-mark"><CircleDollarSign size={21} /></span><span>EquiVest</span></Link><button className="nav-link button-link" onClick={signOut}>Sign out</button></header>
      <section className="form-page-heading"><Link className="back-link" to={backPath}><ArrowLeft size={16} /> Back</Link></section>
      {error && <div className="form-alert" role="alert">{error}</div>}
      {isLoading ? <p className="loading-state" role="status">Loading startup details…</p> : startup && <article className="startup-detail-card">
        <div className="startup-card-top"><span className="industry-pill">{startup.industry}</span><span className="stage-pill">{startup.stage}</span></div>
        {match && <div className="detail-score">{match.score}% match with your preferences</div>}
        <h1>{startup.name}</h1><p className="detail-tagline">{startup.tagline}</p>
        <dl className="startup-facts"><div><dt>Funding sought</dt><dd>{money.format(startup.amountSought)}</dd></div><div><dt>Location</dt><dd>{startup.location || 'Not specified'}</dd></div><div><dt>Business model</dt><dd>{startup.businessModel || 'Not specified'}</dd></div></dl>
        <h2>Company pitch</h2><p className="full-pitch">{startup.pitch}</p>
        {startup.website && <p><a className="detail-website" href={startup.website} target="_blank" rel="noreferrer">Visit company website</a></p>}
        {match && <section className="detail-reasons"><h2>Why this matches</h2><ul>{match.reasons.map((reason) => <li key={reason.criterion}><strong>{reason.points} pts</strong> {reason.message}</li>)}</ul></section>}
      </article>}
    </main>
  );
}
