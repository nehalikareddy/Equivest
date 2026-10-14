import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkMinus, CircleDollarSign } from 'lucide-react';
import { listShortlist, removeFromShortlist } from '../api/shortlistApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function ShortlistPage() {
  const { signOut } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState('');

  const loadShortlist = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try { const result = await listShortlist(); setItems(result.shortlist); }
    catch (loadError) { setError(loadError.response?.data?.error || 'Could not load your shortlist. Please try again.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadShortlist(); }, [loadShortlist]);

  async function removeItem(startupId) {
    setRemovingId(startupId);
    setError('');
    try {
      await removeFromShortlist(startupId);
      setItems((current) => current.filter((item) => item.startup.id !== startupId));
    } catch (removeError) {
      setError(removeError.response?.data?.error || 'Could not remove this startup from your shortlist.');
    } finally { setRemovingId(''); }
  }

  return (
    <main className="account-shell">
      <header className="topbar"><Link className="brand" to="/"><span className="brand-mark"><CircleDollarSign size={21} /></span><span>EquiVest</span></Link><div className="landing-nav"><Link className="nav-link" to="/investor">Matches</Link><button className="nav-link button-link" onClick={signOut}>Sign out</button></div></header>
      <section className="dashboard-heading"><div><p className="eyebrow">Investor workspace</p><h1>Your shortlist</h1><p>Startups you saved to review again.</p></div><Link className="secondary-link" to="/investor">Browse matches</Link></section>
      {error && <div className="form-alert" role="alert">{error} {!isLoading && <button className="inline-button" onClick={loadShortlist}>Retry</button>}</div>}
      {isLoading ? <p className="loading-state" role="status">Loading your shortlist…</p> : items.length === 0 ? <section className="empty-state"><div className="empty-mark"><BookmarkMinus size={20} /></div><h2>Your shortlist is empty</h2><p>Save startups from your matches to keep them together here.</p><Link className="primary-link" to="/investor">Explore startup matches</Link></section> : (
        <section className="startup-grid" aria-label="Saved startups">
          {items.map(({ startup }) => <article className="startup-card" key={startup.id}>
            <div className="startup-card-top"><span className="industry-pill">{startup.industry}</span><span className="stage-pill">{startup.stage}</span></div>
            <h2>{startup.name}</h2><p className="startup-tagline">{startup.tagline}</p>
            <dl className="startup-facts"><div><dt>Funding sought</dt><dd>{money.format(startup.amountSought)}</dd></div><div><dt>Location</dt><dd>{startup.location || 'Not specified'}</dd></div></dl>
            <div className="startup-actions"><Link className="secondary-link" to={`/startups/${startup.id}`}>View details</Link><button className="shortlist-button remove-shortlist" disabled={removingId === startup.id} onClick={() => removeItem(startup.id)}><BookmarkMinus size={16} />{removingId === startup.id ? 'Removing…' : 'Remove'}</button></div>
          </article>)}
        </section>
      )}
    </main>
  );
}
