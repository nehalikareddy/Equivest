import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvestorDashboard from '../pages/InvestorDashboard.jsx';
import InvestorPreferencesPage from '../pages/InvestorPreferencesPage.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { name: 'Alex Investor' }, signOut: vi.fn() })
}));
vi.mock('../api/matchApi.js', () => ({ getMatches: vi.fn() }));
vi.mock('../api/investorApi.js', () => ({ getInvestorProfile: vi.fn(), saveInvestorProfile: vi.fn() }));

import { getMatches } from '../api/matchApi.js';
import { getInvestorProfile, saveInvestorProfile } from '../api/investorApi.js';

describe('investor pages', () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it('renders match scores and criterion explanations from the API', async () => {
    getMatches.mockResolvedValue({
      preferences: { industries: ['Technology'], stages: ['Seed'], minTicket: 100, maxTicket: 500 },
      matches: [{ startup: { id: 's1', name: 'Northstar Labs', tagline: 'A logistics platform', industry: 'Technology', stage: 'Seed', amountSought: 250, location: 'Pune', pitch: 'We improve delivery planning for local companies.' }, score: 85, reasons: [{ criterion: 'industry', matched: true, points: 40, message: 'Matches your preferred industry' }, { criterion: 'stage', matched: true, points: 30, message: 'Matches your preferred funding stage' }, { criterion: 'amount', matched: true, points: 15, message: 'Funding request is close to your investment range' }] }]
    });
    render(<MemoryRouter><InvestorDashboard /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Northstar Labs' })).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    fireEvent.click(screen.getByText('View pitch and matching reasons'));
    expect(screen.getByText('Matches your preferred industry')).toBeInTheDocument();
  });

  it('prevents saving an investment range where the minimum exceeds the maximum', async () => {
    getInvestorProfile.mockResolvedValue({ profile: { industries: [], stages: [], minTicket: 100, maxTicket: 500 } });
    render(<MemoryRouter><InvestorPreferencesPage /></MemoryRouter>);
    const minimum = await screen.findByLabelText('Minimum investment');
    fireEvent.change(minimum, { target: { value: '600' } });
    fireEvent.change(screen.getByLabelText('Maximum investment'), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('minimum does not exceed the maximum');
    expect(saveInvestorProfile).not.toHaveBeenCalled();
  });

  it('reloads matches when an industry filter is selected', async () => {
    getMatches.mockResolvedValue({ preferences: { industries: [], stages: [], minTicket: 1, maxTicket: 1 }, matches: [] });
    render(<MemoryRouter><InvestorDashboard /></MemoryRouter>);
    await screen.findByRole('heading', { name: 'No startups found' });
    fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'FinTech' } });
    await waitFor(() => expect(getMatches).toHaveBeenLastCalledWith({ industry: 'FinTech', sort: 'score' }));
  });
});
