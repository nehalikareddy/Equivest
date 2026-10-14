import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FounderDashboard from '../pages/FounderDashboard.jsx';
import StartupFormPage from '../pages/StartupFormPage.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { name: 'Sam Founder' }, signOut: vi.fn() })
}));
vi.mock('../api/startupApi.js', () => ({
  createStartup: vi.fn(),
  deleteStartup: vi.fn(),
  getStartup: vi.fn(),
  listMyStartups: vi.fn(),
  updateStartup: vi.fn()
}));

import { listMyStartups } from '../api/startupApi.js';

describe('founder startup pages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the founder empty state when there are no profiles', async () => {
    listMyStartups.mockResolvedValue({ startups: [] });
    render(<MemoryRouter><FounderDashboard /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Start with your startup profile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create startup profile/ })).toHaveAttribute('href', '/founder/startups/new');
  });

  it('renders real startup details returned by the API', async () => {
    listMyStartups.mockResolvedValue({ startups: [{ id: 's-1', name: 'Northstar Labs', tagline: 'Smarter delivery plans', industry: 'Technology', stage: 'Seed', amountSought: 25000000, location: 'Bengaluru' }] });
    render(<MemoryRouter><FounderDashboard /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Northstar Labs' })).toBeInTheDocument();
    expect(screen.getByText('₹2,50,00,000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/founder/startups/s-1/edit');
  });

  it('requires the key startup details in the creation form', async () => {
    render(<MemoryRouter initialEntries={['/founder/startups/new']}><Routes><Route path="/founder/startups/new" element={<StartupFormPage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Create a startup profile' })).toBeInTheDocument());
    expect(screen.getByLabelText('Startup name')).toBeRequired();
    expect(screen.getByLabelText('Full pitch')).toBeRequired();
    expect(screen.getByLabelText('Funding sought (INR)')).toBeRequired();
    expect(screen.getByRole('option', { name: 'Pre-Seed' })).toBeInTheDocument();
  });
});
