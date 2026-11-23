import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { api } from './lib/api-client';
import { createTestQueryClient } from './test-support/render-with-providers';

vi.mock('./lib/api-client', () => ({
  api: {
    getFeaturedProducts: vi.fn(async () => []),
    getCategories: vi.fn(async () => ['electronics', "men's clothing", 'jewelery', "women's clothing"]),
  },
}));

function renderApp(route = '/') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the Home route at path /', async () => {
    renderApp('/');

    await waitFor(() => expect(api.getFeaturedProducts).toHaveBeenCalled());
    expect(await screen.findByText(/top rated products/i)).toBeInTheDocument();
  });

  it('renders a not-found view for an unknown path', () => {
    renderApp('/nope');

    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('renders category nav links for the first 3 categories', async () => {
    renderApp('/');

    await waitFor(() => expect(api.getCategories).toHaveBeenCalled());

    expect(await screen.findByRole('link', { name: 'electronics' })).toHaveAttribute(
      'href',
      '/categories/electronics',
    );
    expect(screen.getByRole('link', { name: "men's clothing" })).toHaveAttribute(
      'href',
      '/categories/men\'s%20clothing',
    );
    expect(screen.getByRole('link', { name: 'jewelery' })).toHaveAttribute(
      'href',
      '/categories/jewelery',
    );
  });

  it('renders a "See all" link when there are more than 3 categories', async () => {
    renderApp('/');

    const seeAllLink = await screen.findByRole('link', { name: /see all/i });
    expect(seeAllLink).toHaveAttribute('href', '/categories');
  });
});
