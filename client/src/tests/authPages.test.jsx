import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';

vi.mock('../api/authApi.js', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn()
}));

function renderPage(page) {
  return render(<MemoryRouter><AuthProvider>{page}</AuthProvider></MemoryRouter>);
}

describe('authentication forms', () => {
  beforeEach(() => sessionStorage.clear());

  it('exposes required email and password fields on login', () => {
    renderPage(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Sign in to EquiVest' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  it('allows a registrant to choose either founder or investor role', () => {
    renderPage(<RegisterPage />);
    const role = screen.getByLabelText('I am a');
    expect(role).toBeRequired();
    expect(role).toHaveDisplayValue('Founder');
    expect(screen.getByRole('option', { name: 'Investor' })).toHaveValue('investor');
  });
});
