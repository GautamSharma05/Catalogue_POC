import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CategoriesPage } from './CategoriesPage';
import { api } from '../lib/api-client';
import { renderWithProviders } from '../test-support/render-with-providers';
import type { Product } from '../lib/types';

vi.mock('../lib/api-client', async () => {
  const actual = await vi.importActual<typeof import('../lib/api-client')>('../lib/api-client');
  return { ...actual, api: { getCategories: vi.fn(), getFeaturedProducts: vi.fn() } };
});

const sampleProducts: Product[] = [
  {
    id: 1,
    title: 'Electronics Item',
    description: 'An electronic device',
    price: 99.99,
    category: 'electronics',
    imageUrl: 'https://example.com/electronics.jpg',
    rating: { rate: 4.5, count: 100 },
  },
  {
    id: 2,
    title: 'Clothing Item',
    description: 'A piece of clothing',
    price: 29.99,
    category: "women's clothing",
    imageUrl: 'https://example.com/clothing.jpg',
    rating: { rate: 4.2, count: 50 },
  },
  {
    id: 3,
    title: 'Another Clothing',
    description: 'Another piece of clothing',
    price: 39.99,
    category: "women's clothing",
    imageUrl: 'https://example.com/clothing2.jpg',
    rating: { rate: 4.0, count: 30 },
  },
];

describe('CategoriesPage', () => {
  it('renders all categories with their product counts as links', async () => {
    vi.mocked(api.getCategories).mockResolvedValue(['electronics', "women's clothing"]);
    vi.mocked(api.getFeaturedProducts).mockResolvedValue(sampleProducts);

    renderWithProviders(<CategoriesPage />, { route: '/categories', path: '/categories' });

    expect(await screen.findByText('Browse all categories')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /electronics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /women's clothing/i })).toBeInTheDocument();
  });

  it('renders category cards as links to their category pages', async () => {
    vi.mocked(api.getCategories).mockResolvedValue(['electronics', "women's clothing"]);
    vi.mocked(api.getFeaturedProducts).mockResolvedValue(sampleProducts);

    renderWithProviders(<CategoriesPage />, { route: '/categories', path: '/categories' });

    const electronicsLink = await screen.findByRole('link', { name: /electronics/i });
    expect(electronicsLink).toHaveAttribute('href', '/categories/electronics');
  });

  it('renders an error state when categories API fails', async () => {
    vi.mocked(api.getCategories).mockRejectedValue(new Error('API error'));
    vi.mocked(api.getFeaturedProducts).mockResolvedValue([]);

    renderWithProviders(<CategoriesPage />, { route: '/categories', path: '/categories' });

    expect(await screen.findByText(/could not load categories/i)).toBeInTheDocument();
  });

  it('renders category page title and subheading', async () => {
    vi.mocked(api.getCategories).mockResolvedValue(['electronics']);
    vi.mocked(api.getFeaturedProducts).mockResolvedValue(sampleProducts.slice(0, 1));

    renderWithProviders(<CategoriesPage />, { route: '/categories', path: '/categories' });

    expect(await screen.findByText('Browse all categories')).toBeInTheDocument();
    expect(screen.getByText('Explore our entire collection')).toBeInTheDocument();
  });
});
