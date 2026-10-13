import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const user = await signUp({ name: data.get('name'), email: data.get('email'), password: data.get('password'), role: data.get('role') });
      navigate(user.role === 'founder' ? '/founder' : '/investor', { replace: true });
    } catch (submissionError) {
      setError(submissionError.response?.data?.error || 'Could not create your account. Please try again.');
    } finally { setIsSubmitting(false); }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="register-heading">
        <Link className="auth-brand" to="/">EquiVest</Link>
        <p className="eyebrow">Get started</p>
        <h1 id="register-heading">Create your account</h1>
        <p className="auth-subtitle">Choose how you’ll use EquiVest. You can build your profile next.</p>
        {error && <p className="form-alert" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="register-name">Full name</label>
          <input id="register-name" name="name" type="text" autoComplete="name" minLength="2" maxLength="100" required />
          <label htmlFor="register-email">Email</label>
          <input id="register-email" name="email" type="email" autoComplete="email" maxLength="254" required />
          <label htmlFor="register-password">Password</label>
          <div className="password-field">
            <input id="register-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" minLength="8" maxLength="128" required />
            <button type="button" className="visibility-toggle" aria-label={passwordVisible ? 'Hide password' : 'Show password'} onClick={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <label htmlFor="register-role">I am a</label>
          <select id="register-role" name="role" defaultValue="founder" required>
            <option value="founder">Founder</option>
            <option value="investor">Investor</option>
          </select>
          <button className="form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
