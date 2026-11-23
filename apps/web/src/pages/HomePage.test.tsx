import { screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { HomePage } from './HomePage';
import { api } from '../lib/api-client';
import { renderWithProviders } from '../test-support/render-with-providers';
import { useRecentlyViewedStore } from '../stores/recently-viewed.store';
import type { Product } from '../lib/types';

vi.mock('../lib/api-client', () => ({
  api: { getFeaturedProducts: vi.fn(), getProductById: vi.fn() },
}));

function product(id: number): Product {
  return {
    id,
    title: `Product ${id}`,
    description: 'desc',
    price: 10,
    category: 'misc',
    imageUrl: 'https://example.com/img.jpg',
    rating: { rate: 4.5, count: 10 },
  };
}

describe('HomePage', () => {
  beforeEach(() => {
    useRecentlyViewedStore.setState({ productIds: [] });
  });

  it('renders exactly 5 product tiles from the featured API response', async () => {
    vi.mocked(api.getFeaturedProducts).mockResolvedValue([1, 2, 3, 4, 5].map(product));

    renderWithProviders(<HomePage />);

    const tiles = await screen.findAllByRole('link', { name: /Product \d/ });
    expect(tiles).toHaveLength(5);
  });

  it('shows a loading state before the API response resolves', () => {
    vi.mocked(api.getFeaturedProducts).mockReturnValue(new Promise(() => {}));

    renderWithProviders(<HomePage />);

    expect(screen.getByText(/loading featured products/i)).toBeInTheDocument();
  });

  it('shows an error state if the featured request fails', async () => {
    vi.mocked(api.getFeaturedProducts).mockRejectedValue(new Error('network down'));

    renderWithProviders(<HomePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
  });

  it('renders a Recently viewed section when the store has prior product ids', async () => {
    vi.mocked(api.getFeaturedProducts).mockResolvedValue([1, 2, 3, 4, 5].map(product));
    vi.mocked(api.getProductById).mockImplementation(async (id: number) => product(id));
    useRecentlyViewedStore.setState({ productIds: [42] });

    renderWithProviders(<HomePage />);

    expect(await screen.findByText(/recently viewed/i)).toBeInTheDocument();
    expect(await screen.findByText('Product 42')).toBeInTheDocument();
  });
});
