import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleDollarSign } from 'lucide-react';
import { getInvestorProfile, saveInvestorProfile } from '../api/investorApi.js';

const industries = ['Agriculture', 'Climate', 'Consumer', 'Education', 'FinTech', 'Healthcare', 'Manufacturing', 'Media', 'Real Estate', 'SaaS', 'Technology', 'Other'];
const stages = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'];

export default function InvestorPreferencesPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({ industries: [], stages: [], minTicket: '1', maxTicket: '1' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    getInvestorProfile().then(({ profile }) => {
      if (active) setPreferences({ ...profile, minTicket: String(profile.minTicket), maxTicket: String(profile.maxTicket) });
    }).catch((loadError) => {
      if (active) setError(loadError.response?.data?.error || 'Could not load your preferences. Please try again.');
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  function toggle(field, value) {
    setPreferences((current) => ({
      ...current,
      [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value]
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    const minTicket = Number(preferences.minTicket);
    const maxTicket = Number(preferences.maxTicket);
    if (!Number.isFinite(minTicket) || !Number.isFinite(maxTicket) || minTicket <= 0 || maxTicket <= 0 || minTicket > maxTicket) {
      setError('Enter positive investment amounts, and make sure the minimum does not exceed the maximum.');
      return;
    }
    setIsSaving(true);
    try {
      await saveInvestorProfile({ ...preferences, minTicket, maxTicket });
      setNotice('Your investment preferences were saved.');
      navigate('/investor', { replace: true });
    } catch (saveError) {
      setError(saveError.response?.data?.details?.map((item) => item.message).join(' ') || saveError.response?.data?.error || 'Could not save preferences. Please try again.');
    } finally { setIsSaving(false); }
  }

  return (
    <main className="account-shell form-page">
      <header className="topbar"><Link className="brand" to="/"><span className="brand-mark"><CircleDollarSign size={21} /></span><span>EquiVest</span></Link><Link className="nav-link" to="/investor">Investor dashboard</Link></header>
      <section className="form-page-heading"><Link className="back-link" to="/investor"><ArrowLeft size={16} /> Back to matches</Link><p className="eyebrow">Investor profile</p><h1>Investment preferences</h1><p>Choose the industries, stages, and funding range that guide your startup matches.</p></section>
      {error && <div className="form-alert" role="alert">{error}</div>}
      {notice && <div className="success-alert" role="status">{notice}</div>}
      {isLoading ? <p className="loading-state" role="status">Loading your preferences…</p> : <form className="preferences-form" onSubmit={handleSubmit}>
        <fieldset className="preference-group"><legend>Preferred industries</legend><p>Select one or more industries.</p><div className="choice-grid">{industries.map((industry) => <label className="choice-chip" key={industry}><input type="checkbox" checked={preferences.industries.includes(industry)} onChange={() => toggle('industries', industry)} /><span>{industry}</span></label>)}</div></fieldset>
        <fieldset className="preference-group"><legend>Preferred funding stages</legend><p>Select stages that fit your investment focus.</p><div className="choice-grid">{stages.map((stage) => <label className="choice-chip" key={stage}><input type="checkbox" checked={preferences.stages.includes(stage)} onChange={() => toggle('stages', stage)} /><span>{stage}</span></label>)}</div></fieldset>
        <fieldset className="preference-group"><legend>Investment range (INR)</legend><p>Set the amount you typically invest in a startup.</p><div className="range-fields"><div className="form-field"><label htmlFor="minimum-ticket">Minimum investment</label><input id="minimum-ticket" type="number" min="1" step="1" value={preferences.minTicket} onChange={(event) => setPreferences((current) => ({ ...current, minTicket: event.target.value }))} required /></div><div className="form-field"><label htmlFor="maximum-ticket">Maximum investment</label><input id="maximum-ticket" type="number" min="1" step="1" value={preferences.maxTicket} onChange={(event) => setPreferences((current) => ({ ...current, maxTicket: event.target.value }))} required /></div></div></fieldset>
        <div className="startup-form-actions"><Link to="/investor" className="secondary-link">Cancel</Link><button className="form-submit" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save preferences'}</button></div>
      </form>}
    </main>
  );
}
