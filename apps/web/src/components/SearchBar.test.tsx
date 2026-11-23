import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { SearchBar } from './SearchBar';
import { api } from '../lib/api-client';
import { useRecentSearchesStore } from '../stores/recent-searches.store';
import { createTestQueryClient } from '../test-support/render-with-providers';
import { QueryClientProvider } from '@tanstack/react-query';
import type { Product } from '../lib/types';

vi.mock('../lib/api-client', async () => {
  const actual = await vi.importActual<typeof import('../lib/api-client')>('../lib/api-client');
  return { ...actual, api: { searchProducts: vi.fn() } };
});

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

function product(id: number, title: string): Product {
  return {
    id,
    title,
    description: 'desc',
    price: 19.99,
    category: 'misc',
    imageUrl: 'https://example.com/img.jpg',
    rating: { rate: 4.5, count: 10 },
  };
}

function renderSearchBar() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SearchBar', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(api.searchProducts).mockReset();
    useRecentSearchesStore.setState({ terms: [] });
  });

  it('shows debounced product suggestions once 2+ characters are typed', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue([product(1, 'Steel Hammer'), product(2, 'Hand Saw')]);
    const user = userEvent.setup();

    renderSearchBar();
    await user.type(screen.getByRole('combobox'), 'ha');

    expect(await screen.findByText('Steel Hammer')).toBeInTheDocument();
    expect(screen.getByText('Hand Saw')).toBeInTheDocument();
    expect(api.searchProducts).toHaveBeenCalledWith('ha');
  });

  it('does not query the backend for a single character', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue([]);
    const user = userEvent.setup();

    renderSearchBar();
    await user.type(screen.getByRole('combobox'), 'h');
    await act(() => new Promise((resolve) => setTimeout(resolve, 350)));

    expect(api.searchProducts).not.toHaveBeenCalled();
  });

  it('clicking a suggestion navigates straight to its product page', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue([product(7, 'Steel Hammer')]);
    const user = userEvent.setup();

    renderSearchBar();
    await user.type(screen.getByRole('combobox'), 'hammer');
    await user.click(await screen.findByText('Steel Hammer'));

    expect(navigateMock).toHaveBeenCalledWith('/products/7');
  });

  it('pressing Enter with no suggestion highlighted goes to the full results page and records the search', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue([product(1, 'Steel Hammer')]);
    const user = userEvent.setup();

    renderSearchBar();
    await user.type(screen.getByRole('combobox'), 'hammer');
    await screen.findByText('Steel Hammer');
    await user.keyboard('{Enter}');

    expect(navigateMock).toHaveBeenCalledWith('/search?q=hammer');
    expect(useRecentSearchesStore.getState().terms).toEqual(['hammer']);
  });

  it('clicking the Search button (not pressing Enter) also goes to the full results page', async () => {
    // Acceptance criteria: "WHEN I click the search button" - a literal
    // clickable element has to exist and has to submit the search, not
    // just Enter-to-submit.
    vi.mocked(api.searchProducts).mockResolvedValue([]);
    const user = userEvent.setup();

    renderSearchBar();
    await user.type(screen.getByRole('combobox'), 'hammer');
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    expect(navigateMock).toHaveBeenCalledWith('/search?q=hammer');
  });

  it('arrow-down highlights the first suggestion so Enter selects it', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue([product(3, 'Steel Hammer')]);
    const user = userEvent.setup();

    renderSearchBar();
    await user.type(screen.getByRole('combobox'), 'hammer');
    await screen.findByText('Steel Hammer');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(navigateMock).toHaveBeenCalledWith('/products/3');
  });

  it('the clear button resets the field', async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByRole('combobox');
    await user.type(input, 'hammer');
    await user.click(screen.getByRole('button', { name: /clear search/i }));

    expect(input).toHaveValue('');
  });

  it('shows recent searches when the field is focused empty', async () => {
    useRecentSearchesStore.setState({ terms: ['hammer', 'saw'] });
    const user = userEvent.setup();

    renderSearchBar();
    await user.click(screen.getByRole('combobox'));

    expect(await screen.findByText('hammer')).toBeInTheDocument();
    expect(screen.getByText('saw')).toBeInTheDocument();
  });

  it('clicking "View all results" goes to the full results page', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue([product(1, 'Steel Hammer')]);
    const user = userEvent.setup();

    renderSearchBar();
    await user.type(screen.getByRole('combobox'), 'hammer');
    await screen.findByText('Steel Hammer');
    await user.click(screen.getByText(/view all results for/i));

    expect(navigateMock).toHaveBeenCalledWith('/search?q=hammer');
  });
});
