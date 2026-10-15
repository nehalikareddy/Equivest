import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StartupDetailsPage from '../pages/StartupDetailsPage.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { name: 'Alex Investor', role: 'investor' }, signOut: vi.fn() })
}));
vi.mock('../api/startupApi.js', () => ({ getStartup: vi.fn() }));
vi.mock('../api/matchApi.js', () => ({ getMatches: vi.fn() }));

import { getStartup } from '../api/startupApi.js';
import { getMatches } from '../api/matchApi.js';

describe('startup details page', () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it('renders startup details with pitch, metadata, and match score breakdown for investors', async () => {
    getStartup.mockResolvedValue({
      startup: {
        id: 's-1',
        name: 'Northstar Labs',
        tagline: 'Autonomous supply chain routing',
        pitch: 'We reduce last-mile delivery costs by 22% for enterprise fleets.',
        industry: 'Technology',
        stage: 'Seed',
        amountSought: 15000000,
        location: 'Bengaluru',
        businessModel: 'B2B SaaS',
        website: 'https://northstar.example.com'
      }
    });
    getMatches.mockResolvedValue({
      matches: [{
        startup: { id: 's-1' },
        score: 100,
        reasons: [
          { criterion: 'industry', matched: true, points: 40, message: 'Matches your preferred industry' },
          { criterion: 'stage', matched: true, points: 30, message: 'Matches your preferred funding stage' },
          { criterion: 'amount', matched: true, points: 30, message: 'Funding request is within your investment range' }
        ]
      }]
    });

    render(
      <MemoryRouter initialEntries={['/startups/s-1']}>
        <Routes>
          <Route path="/startups/:startupId" element={<StartupDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Northstar Labs' })).toBeInTheDocument();
    expect(screen.getByText('100% match with your preferences')).toBeInTheDocument();
    expect(screen.getByText('B2B SaaS')).toBeInTheDocument();
    expect(screen.getByText('Matches your preferred industry')).toBeInTheDocument();
  });
});