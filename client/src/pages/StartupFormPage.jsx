import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createStartup, getStartup, updateStartup } from '../api/startupApi.js';
import NavBar from '../components/common/NavBar.jsx';
import { INDUSTRIES, STAGES } from '../constants/startupOptions.js';

const initialForm = { name: '', tagline: '', pitch: '', industry: '', stage: '', amountSought: '', location: '', businessModel: '', website: '' };

export default function StartupFormPage() {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(startupId);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = isEditing ? 'Edit Startup — EquiVest' : 'Create Startup — EquiVest'; }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return undefined;
    let active = true;
    getStartup(startupId).then(({ startup }) => {
      if (active) setForm({ ...initialForm, ...startup, amountSought: String(startup.amountSought) });
    }).catch((loadError) => {
      if (active) setError(loadError.response?.data?.error || 'Could not load this startup.');
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [isEditing, startupId]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    const data = { ...form, amountSought: Number(form.amountSought) };
    try {
      if (isEditing) await updateStartup(startupId, data);
      else await createStartup(data);
      navigate('/founder', { replace: true });
    } catch (saveError) {
      setError(saveError.response?.data?.details?.map((item) => item.message).join(' ') || saveError.response?.data?.error || 'Could not save your startup. Please try again.');
    } finally { setIsSubmitting(false); }
  }

  if (isLoading) return <main className="account-shell"><p role="status" className="loading-state">Loading startup details…</p></main>;

  return (
    <main className="account-shell form-page">
      <NavBar showSignOut={false}><Link className="nav-link" to="/founder">Founder dashboard</Link></NavBar>
      <section className="form-page-heading"><Link className="back-link" to="/founder"><ArrowLeft size={16} /> Back to dashboard</Link><p className="eyebrow">Startup profile</p><h1>{isEditing ? 'Edit your startup' : 'Create a startup profile'}</h1><p>Share the information investors need to understand your business and funding goal.</p></section>
      {error && <div className="form-alert" role="alert" aria-live="polite">{error}</div>}
      <form className="startup-form" onSubmit={handleSubmit}>
        <div className="form-field"><label htmlFor="startup-name">Startup name</label><input id="startup-name" name="name" value={form.name} onChange={updateField} minLength="2" maxLength="120" required /></div>
        <div className="form-field"><label htmlFor="startup-tagline">Tagline</label><input id="startup-tagline" name="tagline" value={form.tagline} onChange={updateField} minLength="5" maxLength="180" required /><small>A short sentence that describes what you do.</small></div>
        <div className="form-field full-field"><label htmlFor="startup-pitch">Full pitch</label><textarea id="startup-pitch" name="pitch" value={form.pitch} onChange={updateField} minLength="30" maxLength="10000" rows="6" required /><small>At least 30 characters. Explain the problem, your solution, and your business.</small></div>
        <div className="form-field"><label htmlFor="startup-industry">Industry</label><select id="startup-industry" name="industry" value={form.industry} onChange={updateField} required><option value="">Choose an industry</option>{INDUSTRIES.map((industry) => <option key={industry}>{industry}</option>)}</select></div>
        <div className="form-field"><label htmlFor="startup-stage">Funding stage</label><select id="startup-stage" name="stage" value={form.stage} onChange={updateField} required><option value="">Choose a stage</option>{STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></div>
        <div className="form-field"><label htmlFor="startup-amount">Funding sought (INR)</label><input id="startup-amount" name="amountSought" type="number" min="1" step="1" value={form.amountSought} onChange={updateField} required /></div>
        <div className="form-field"><label htmlFor="startup-location">Location</label><input id="startup-location" name="location" value={form.location} onChange={updateField} maxLength="120" placeholder="City, Country" /></div>
        <div className="form-field"><label htmlFor="startup-model">Business model</label><input id="startup-model" name="businessModel" value={form.businessModel} onChange={updateField} maxLength="500" placeholder="e.g. B2B SaaS" /></div>
        <div className="form-field"><label htmlFor="startup-website">Website</label><input id="startup-website" name="website" type="url" value={form.website} onChange={updateField} maxLength="2048" placeholder="https://example.com" /></div>
        <div className="startup-form-actions"><Link to="/founder" className="secondary-link">Cancel</Link><button className="form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create startup'}</button></div>
      </form>
    </main>
  );
}