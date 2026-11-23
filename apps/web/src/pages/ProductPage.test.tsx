import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ProductPage } from './ProductPage';
import { SearchResultsPage } from './SearchResultsPage';
import { api, ApiError } from '../lib/api-client';
import { renderWithProviders } from '../test-support/render-with-providers';
import { useRecentlyViewedStore } from '../stores/recently-viewed.store';
import type { Product } from '../lib/types';

vi.mock('../lib/api-client', async () => {
  const actual = await vi.importActual<typeof import('../lib/api-client')>('../lib/api-client');
  return { ...actual, api: { getProductById: vi.fn(), searchProducts: vi.fn() } };
});

const sampleProduct: Product = {
  id: 1,
  title: 'Steel Hammer',
  description: 'A durable steel hammer',
  price: 19.99,
  category: 'tools',
  imageUrl: 'https://example.com/1.jpg',
  rating: { rate: 4.8, count: 120 },
};

function renderProductPage(id = '1') {
  return renderWithProviders(<ProductPage />, { route: `/products/${id}`, path: '/products/:id' });
}

describe('ProductPage', () => {
  beforeEach(() => {
    useRecentlyViewedStore.setState({ productIds: [] });
  });

  it('renders product title, price, and description from the detail API response', async () => {
    vi.mocked(api.getProductById).mockResolvedValue(sampleProduct);

    renderProductPage();

    expect(await screen.findByText('Steel Hammer')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('A durable steel hammer')).toBeInTheDocument();
  });

  it('renders a not-found message when the detail API returns 404', async () => {
    vi.mocked(api.getProductById).mockRejectedValue(new ApiError('No product found', 404));

    renderProductPage('9999');

    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i);
  });

  it('clicking Enquire opens the enquiry form', async () => {
    vi.mocked(api.getProductById).mockResolvedValue(sampleProduct);

    renderProductPage();

    const enquireButton = await screen.findByRole('button', { name: /enquire/i });
    await userEvent.click(enquireButton);

    expect(screen.getByLabelText(/enquiry form/i)).toBeInTheDocument();
  });

  it('records the viewed product id in the recently-viewed store', async () => {
    vi.mocked(api.getProductById).mockResolvedValue(sampleProduct);

    renderProductPage();

    await screen.findByText('Steel Hammer');
    expect(useRecentlyViewedStore.getState().productIds).toEqual([1]);
  });

  it('renders the product category as a link to the category page', async () => {
    vi.mocked(api.getProductById).mockResolvedValue(sampleProduct);

    renderProductPage();

    const categoryLink = await screen.findByRole('link', { name: 'tools' });
    expect(categoryLink).toHaveAttribute('href', '/categories/tools');
  });
});


describe('SearchResultsPage', () => {
  function renderSearchResults(query: string) {
    return renderWithProviders(<SearchResultsPage />, { route: `/search?q=${query}`, path: '/search' });
  }

  it('renders only products returned by the search API for the current query', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue([sampleProduct]);

    renderSearchResults('hammer');

    expect(await screen.findByText('Steel Hammer')).toBeInTheDocument();
    expect(api.searchProducts).toHaveBeenCalledWith('hammer');
  });

  it('renders an explicit no-results message for a search with zero results', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue([]);

    renderSearchResults('nonexistent');

    expect(await screen.findByText(/no results for that search/i)).toBeInTheDocument();
  });
});
