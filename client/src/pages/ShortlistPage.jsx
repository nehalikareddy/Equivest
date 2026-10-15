import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkMinus } from 'lucide-react';
import { listShortlist, removeFromShortlist } from '../api/shortlistApi.js';
import NavBar from '../components/common/NavBar.jsx';
import StartupCard from '../components/StartupCard.jsx';

export default function ShortlistPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState('');

  useEffect(() => { document.title = 'Your Shortlist — EquiVest'; }, []);

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
      <NavBar><Link className="nav-link" to="/investor">Matches</Link></NavBar>
      <section className="dashboard-heading"><div><p className="eyebrow">Investor workspace</p><h1>Your shortlist</h1><p>Startups you saved to review again.</p></div><Link className="secondary-link" to="/investor">Browse matches</Link></section>
      {error && <div className="form-alert" role="alert" aria-live="polite">{error} {!isLoading && <button className="inline-button" onClick={loadShortlist}>Retry</button>}</div>}
      {isLoading ? <div className="loading-state" role="status" aria-live="polite"><span>Loading your shortlist…</span><div className="skeleton-grid" aria-hidden="true"><div className="skeleton-card" /><div className="skeleton-card" /></div></div> : items.length === 0 ? <section className="empty-state"><div className="empty-mark"><BookmarkMinus size={20} /></div><h2>Your shortlist is empty</h2><p>Save startups from your matches to keep them together here.</p><Link className="primary-link" to="/investor">Explore startup matches</Link></section> : (
        <section className="startup-grid" aria-label="Saved startups">
          {items.map(({ startup }) => (
            <StartupCard
              key={startup.id}
              startup={startup}
              actions={
                <>
                  <Link className="secondary-link" to={`/startups/${startup.id}`}>View details</Link>
                  <button className="shortlist-button remove-shortlist" disabled={removingId === startup.id} onClick={() => removeItem(startup.id)}>
                    <BookmarkMinus size={16} />{removingId === startup.id ? 'Removing…' : 'Remove'}
                  </button>
                </>
              }
            />
          ))}
        </section>
      )}
    </main>
  );
}