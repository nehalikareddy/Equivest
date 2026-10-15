import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FounderDashboard from '../pages/FounderDashboard.jsx';
import StartupFormPage from '../pages/StartupFormPage.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { name: 'Sam Founder', role: 'founder' }, signOut: vi.fn() })
}));
vi.mock('../api/startupApi.js', () => ({
  analyzeStartupPitch: vi.fn(),
  createStartup: vi.fn(),
  deleteStartup: vi.fn(),
  getStartup: vi.fn(),
  listMyStartups: vi.fn(),
  updateStartup: vi.fn()
}));

import { analyzeStartupPitch, createStartup, deleteStartup, listMyStartups } from '../api/startupApi.js';

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

  it('calls deleteStartup and removes the startup card on confirmation', async () => {
    listMyStartups.mockResolvedValue({ startups: [{ id: 's-1', name: 'Northstar Labs', tagline: 'Smarter delivery plans', industry: 'Technology', stage: 'Seed', amountSought: 25000000, location: 'Bengaluru' }] });
    deleteStartup.mockResolvedValue({ message: 'Deleted' });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<MemoryRouter><FounderDashboard /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Northstar Labs' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Northstar Labs' }));

    await waitFor(() => expect(deleteStartup).toHaveBeenCalledWith('s-1'));
    expect(screen.queryByRole('heading', { name: 'Northstar Labs' })).not.toBeInTheDocument();
    confirmSpy.mockRestore();
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

  it('submits the startup creation form with valid data and navigates back to /founder', async () => {
    createStartup.mockResolvedValue({ startup: { id: 's-new' } });
    render(
      <MemoryRouter initialEntries={['/founder/startups/new']}>
        <Routes>
          <Route path="/founder/startups/new" element={<StartupFormPage />} />
          <Route path="/founder" element={<h1>Founder Workspace</h1>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Create a startup profile' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Startup name'), { target: { value: 'PulseGrid' } });
    fireEvent.change(screen.getByLabelText('Tagline'), { target: { value: 'Grid analytics for solar microgrids' } });
    fireEvent.change(screen.getByLabelText('Full pitch'), { target: { value: 'We provide real-time telemetry and demand forecasting for commercial solar microgrids across India.' } });
    fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'Climate' } });
    fireEvent.change(screen.getByLabelText('Funding stage'), { target: { value: 'Seed' } });
    fireEvent.change(screen.getByLabelText('Funding sought (INR)'), { target: { value: '15000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create startup' }));

    await waitFor(() => expect(createStartup).toHaveBeenCalledWith(expect.objectContaining({
      name: 'PulseGrid',
      industry: 'Climate',
      stage: 'Seed',
      amountSought: 15000000
    })));
    expect(await screen.findByRole('heading', { name: 'Founder Workspace' })).toBeInTheDocument();
  });
});