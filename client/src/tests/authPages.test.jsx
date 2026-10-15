import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import App from '../App.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import api from '../api/axios.js';
import { getCurrentUser, login, logout, register } from '../api/authApi.js';

vi.mock('../api/matchApi.js', () => ({ getMatches: vi.fn().mockResolvedValue({ matches: [], preferences: { industries: [], stages: [], minTicket: 1, maxTicket: 1 } }) }));
vi.mock('../api/shortlistApi.js', () => ({ listShortlist: vi.fn().mockResolvedValue({ shortlist: [] }), addToShortlist: vi.fn() }));
vi.mock('../api/authApi.js', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn()
}));

function renderPage(page) {
  return render(<MemoryRouter><AuthProvider>{page}</AuthProvider></MemoryRouter>);
}

describe('authentication forms and session behaviors', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockRejectedValue(new Error('No active session'));
    logout.mockResolvedValue({ message: 'Logged out' });
  });

  it('exposes required email and password fields on login', () => {
    renderPage(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Sign in to EquiVest' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  it('submits login form and redirects to founder dashboard', async () => {
    login.mockResolvedValue({ user: { id: 'u1', name: 'Sam Founder', role: 'founder' } });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/founder" element={<h1>Founder Home</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sam@equivest.dev' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Founder Home' })).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({ email: 'sam@equivest.dev', password: 'Password123!' });
  });

  it('shows server error message on invalid login credentials', async () => {
    login.mockRejectedValue({ response: { data: { error: 'Invalid email or password.' } } });
    renderPage(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'wrong@equivest.dev' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('redirects authenticated users away from /login to their role dashboard', async () => {
    getCurrentUser.mockResolvedValue({ user: { id: 'u2', name: 'Asha Investor', role: 'investor' } });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: /Welcome, Asha Investor/i })).toBeInTheDocument();
  });

  it('allows a registrant to choose either founder or investor role and validates password confirmation', async () => {
    renderPage(<RegisterPage />);
    const role = screen.getByLabelText('I am a');
    expect(role).toBeRequired();
    expect(role).toHaveDisplayValue('Founder');
    expect(screen.getByRole('option', { name: 'Investor' })).toHaveValue('investor');

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Riya Investor' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'riya@equivest.dev' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Different123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match.');
    expect(register).not.toHaveBeenCalled();
  });

  it('renders the public landing page with register and sign-in actions', async () => {
    renderPage(<LandingPage />);
    expect(await screen.findByRole('heading', { name: /find the right partners/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Register' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Sign in' })).toHaveLength(2);
  });

  it('shows the active role dashboard for an authenticated user on LandingPage', async () => {
    getCurrentUser.mockResolvedValue({ user: { name: 'Asha Investor', role: 'investor' } });
    renderPage(<LandingPage />);
    expect(await screen.findByRole('link', { name: 'My dashboard' })).toHaveAttribute('href', '/investor');
    expect(screen.getByRole('link', { name: 'Open your dashboard' })).toHaveAttribute('href', '/investor');
  });

  it('calls the logout API and clears the local user state', async () => {
    getCurrentUser.mockResolvedValue({ user: { name: 'Asha Investor', role: 'investor' } });
    function SessionControls() {
      const { user, signOut } = useAuth();
      return <div><span>{user?.name || 'Signed out'}</span><button onClick={signOut}>Sign out</button></div>;
    }
    render(<MemoryRouter><AuthProvider><SessionControls /></AuthProvider></MemoryRouter>);
    expect(await screen.findByText('Asha Investor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(await screen.findByText('Signed out')).toBeInTheDocument();
  });

  it('sends credentials and clears auth state after a protected request returns 401', async () => {
    getCurrentUser.mockResolvedValue({ user: { name: 'Asha Investor', role: 'investor' } });
    function CurrentUser() { return <span>{useAuth().user?.name || 'Expired session'}</span>; }
    render(<MemoryRouter><AuthProvider><CurrentUser /></AuthProvider></MemoryRouter>);
    expect(await screen.findByText('Asha Investor')).toBeInTheDocument();
    expect(api.defaults.withCredentials).toBe(true);
    const originalAdapter = api.defaults.adapter;
    api.defaults.adapter = async (config) => { throw Object.assign(new Error('Unauthorized'), { config, response: { status: 401, config, data: {} } }); };
    try { await expect(api.get('/protected-resource')).rejects.toMatchObject({ response: { status: 401 } }); }
    finally { api.defaults.adapter = originalAdapter; }
    expect(await screen.findByText('Expired session')).toBeInTheDocument();
  });
});