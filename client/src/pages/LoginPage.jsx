import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'Sign In — EquiVest'; }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const user = await signIn({ email: data.get('email'), password: data.get('password') });
      navigate(location.state?.from?.pathname || (user.role === 'founder' ? '/founder' : '/investor'), { replace: true });
    } catch (submissionError) {
      setError(submissionError.response?.data?.error || 'Could not sign in. Check your connection and try again.');
    } finally { setIsSubmitting(false); }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-heading">
        <Link className="auth-brand" to="/">EquiVest</Link>
        <p className="eyebrow">Welcome back</p>
        <h1 id="login-heading">Sign in to EquiVest</h1>
        <p className="auth-subtitle">Continue to your founder or investor account.</p>
        {error && <p className="form-alert" role="alert" aria-live="polite">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" required maxLength="254" />
          <label htmlFor="login-password">Password</label>
          <div className="password-field">
            <input id="login-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" required />
            <button type="button" className="visibility-toggle" aria-label={passwordVisible ? 'Hide password' : 'Show password'} onClick={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <button className="form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">New to EquiVest? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  );
}