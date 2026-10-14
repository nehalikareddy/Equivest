import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FounderDashboard from '../pages/FounderDashboard.jsx';
import StartupFormPage from '../pages/StartupFormPage.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { name: 'Sam Founder' }, signOut: vi.fn() })
}));
vi.mock('../api/startupApi.js', () => ({
  analyzeStartupPitch: vi.fn(),
  createStartup: vi.fn(),
  deleteStartup: vi.fn(),
  getStartup: vi.fn(),
  listMyStartups: vi.fn(),
  updateStartup: vi.fn()
}));

import { analyzeStartupPitch, listMyStartups } from '../api/startupApi.js';

describe('founder startup pages', () => {
  afterEach(cleanup);
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

  it('shows structured pitch feedback and the AI disclaimer', async () => {
    listMyStartups.mockResolvedValue({ startups: [{ id: 's-1', name: 'Northstar Labs', tagline: 'Smarter delivery plans', industry: 'Technology', stage: 'Seed', amountSought: 25000000, location: 'Bengaluru' }] });
    analyzeStartupPitch.mockResolvedValue({ analysis: {
      summary: 'The pitch explains a practical customer problem.',
      strengths: ['Clear target customer'],
      missingInformation: ['Market size is not stated'],
      suggestions: ['Add early customer validation']
    } });
    render(<MemoryRouter><FounderDashboard /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Analyze pitch' }));
    expect(await screen.findByRole('heading', { name: 'Pitch feedback' })).toBeInTheDocument();
    expect(screen.getByText('Clear target customer')).toBeInTheDocument();
    expect(screen.getByText('Market size is not stated')).toBeInTheDocument();
    expect(screen.getByText('Add early customer validation')).toBeInTheDocument();
    expect(screen.getByText(/AI generated feedback may be inaccurate and is not investment advice/)).toBeInTheDocument();
  });

  it('shows a configuration message and retry action when analysis is unavailable', async () => {
    listMyStartups.mockResolvedValue({ startups: [{ id: 's-2', name: 'Field Notes', tagline: 'A data layer for growers', industry: 'Agriculture', stage: 'Idea', amountSought: 1000000, location: '' }] });
    analyzeStartupPitch.mockRejectedValue({ response: { data: { error: 'AI pitch analysis is not configured. Add AI_PROVIDER_API_KEY on the server to enable it.' } } });
    render(<MemoryRouter><FounderDashboard /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Analyze pitch' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('AI pitch analysis is not configured');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
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
