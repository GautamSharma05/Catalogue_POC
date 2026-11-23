import { describe, expect, it } from 'vitest';

import { CatalogueUseCases } from './catalogue.use-cases.js';
import { FixtureCatalogAdapter } from '../../test-support/fixtures.js';

describe('CatalogueUseCases', () => {
  it('getFeatured returns exactly 5 highest-rated products', async () => {
    const useCases = new CatalogueUseCases(new FixtureCatalogAdapter());

    const featured = await useCases.getFeatured();

    expect(featured).toHaveLength(5);
    const ratings = featured.map((p) => p.rating.rate);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it('getCategoryView splits top-rated from remaining items for one category', async () => {
    const useCases = new CatalogueUseCases(new FixtureCatalogAdapter());

    const view = await useCases.getCategoryView('tools');

    expect(view.topRated.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(view.others.map((p) => p.id)).toEqual([4]);
  });

  it('getCategoryView with fewer than the top-rated count does not throw or pad with other categories', async () => {
    const useCases = new CatalogueUseCases(new FixtureCatalogAdapter());

    const view = await useCases.getCategoryView('home');

    expect(view.topRated.map((p) => p.id)).toEqual([8]);
    expect(view.others).toEqual([]);
  });

  it('searchProducts matches on partial, case-insensitive title text', async () => {
    const useCases = new CatalogueUseCases(new FixtureCatalogAdapter());

    const results = await useCases.searchProducts('DRILL');

    expect(results.map((p) => p.id)).toEqual([2]);
  });

  it('searchProducts returns an empty array for a non-matching term', async () => {
    const useCases = new CatalogueUseCases(new FixtureCatalogAdapter());

    const results = await useCases.searchProducts('spaceship');

    expect(results).toEqual([]);
  });

  it('getProductDetail returns null for an unknown id', async () => {
    const useCases = new CatalogueUseCases(new FixtureCatalogAdapter());

    const product = await useCases.getProductDetail(9999);

    expect(product).toBeNull();
  });
});
