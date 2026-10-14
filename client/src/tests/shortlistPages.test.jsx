import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShortlistPage from '../pages/ShortlistPage.jsx';

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ signOut: vi.fn() }) }));
vi.mock('../api/shortlistApi.js', () => ({ listShortlist: vi.fn(), removeFromShortlist: vi.fn() }));

import { listShortlist, removeFromShortlist } from '../api/shortlistApi.js';

describe('investor shortlist page', () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it('shows saved startup details and links to the startup detail page', async () => {
    listShortlist.mockResolvedValue({ shortlist: [{ id: 'saved-1', startup: { id: 'startup-1', name: 'Northstar Labs', tagline: 'Better delivery planning', industry: 'Technology', stage: 'Seed', amountSought: 10000000, location: 'Pune' } }] });
    render(<MemoryRouter><ShortlistPage /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Northstar Labs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute('href', '/startups/startup-1');
    expect(screen.getByRole('link', { name: 'Browse matches' })).toHaveAttribute('href', '/investor');
  });

  it('removes a startup and updates the saved list', async () => {
    listShortlist.mockResolvedValue({ shortlist: [{ id: 'saved-1', startup: { id: 'startup-1', name: 'Northstar Labs', tagline: 'Better delivery planning', industry: 'Technology', stage: 'Seed', amountSought: 10000000 } }] });
    removeFromShortlist.mockResolvedValue({});
    render(<MemoryRouter><ShortlistPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Remove/ }));
    expect(removeFromShortlist).toHaveBeenCalledWith('startup-1');
    expect(await screen.findByRole('heading', { name: 'Your shortlist is empty' })).toBeInTheDocument();
  });
});
