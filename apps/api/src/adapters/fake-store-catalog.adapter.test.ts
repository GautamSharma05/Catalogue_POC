import { describe, expect, it, vi } from 'vitest';

import { FakeStoreCatalogAdapter, type FetchLike } from './fake-store-catalog.adapter.js';
import { CatalogSourceError } from '../lib/errors.js';

const rawProduct = {
  id: 1,
  title: 'Widget',
  description: 'A widget',
  price: 9.99,
  category: 'tools',
  image: 'https://example.com/widget.jpg',
  rating: { rate: 4.2, count: 10 },
};

function makeFetch(payload: unknown, ok = true, status = 200): FetchLike {
  return vi.fn(async () => ({ ok, status, json: async () => payload }));
}

describe('FakeStoreCatalogAdapter', () => {
  it('maps the Fake Store product shape to the internal Product type', async () => {
    const fetchMock = makeFetch([rawProduct]);
    const adapter = new FakeStoreCatalogAdapter('https://fakestoreapi.com', fetchMock, 60_000);

    const products = await adapter.getAllProducts();

    expect(products).toEqual([
      {
        id: 1,
        title: 'Widget',
        description: 'A widget',
        price: 9.99,
        category: 'tools',
        imageUrl: 'https://example.com/widget.jpg',
        rating: { rate: 4.2, count: 10 },
      },
    ]);
  });

  it('returns a cached result on a second call within the TTL window', async () => {
    const fetchMock = makeFetch([rawProduct]);
    const adapter = new FakeStoreCatalogAdapter('https://fakestoreapi.com', fetchMock, 60_000);

    await adapter.getAllProducts();
    await adapter.getAllProducts();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches again after the TTL has expired', async () => {
    const fetchMock = makeFetch([rawProduct]);
    const adapter = new FakeStoreCatalogAdapter('https://fakestoreapi.com', fetchMock, 1);

    await adapter.getAllProducts();
    await new Promise((resolve) => setTimeout(resolve, 5));
    await adapter.getAllProducts();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws a CatalogSourceError instead of a raw fetch error when the upstream call fails', async () => {
    const fetchMock: FetchLike = vi.fn(async () => {
      throw new Error('network down');
    });
    const adapter = new FakeStoreCatalogAdapter('https://fakestoreapi.com', fetchMock, 60_000);

    await expect(adapter.getAllProducts()).rejects.toBeInstanceOf(CatalogSourceError);
  });

  it('throws a CatalogSourceError when the upstream response is not ok', async () => {
    const fetchMock = makeFetch({ error: 'boom' }, false, 500);
    const adapter = new FakeStoreCatalogAdapter('https://fakestoreapi.com', fetchMock, 60_000);

    await expect(adapter.getAllProducts()).rejects.toBeInstanceOf(CatalogSourceError);
  });
});
