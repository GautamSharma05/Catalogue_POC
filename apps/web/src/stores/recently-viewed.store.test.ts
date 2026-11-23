import { beforeEach, describe, expect, it } from 'vitest';

import { useRecentlyViewedStore } from './recently-viewed.store';

describe('useRecentlyViewedStore', () => {
  beforeEach(() => {
    useRecentlyViewedStore.setState({ productIds: [] });
  });

  it('starts empty', () => {
    expect(useRecentlyViewedStore.getState().productIds).toEqual([]);
  });

  it('adds a product id to the front of the list', () => {
    useRecentlyViewedStore.getState().addProduct(1);
    useRecentlyViewedStore.getState().addProduct(2);

    expect(useRecentlyViewedStore.getState().productIds).toEqual([2, 1]);
  });

  it('moves a re-viewed product id back to the front instead of duplicating it', () => {
    useRecentlyViewedStore.getState().addProduct(1);
    useRecentlyViewedStore.getState().addProduct(2);
    useRecentlyViewedStore.getState().addProduct(1);

    expect(useRecentlyViewedStore.getState().productIds).toEqual([1, 2]);
  });

  it('caps the list at 5 most-recent ids', () => {
    for (const id of [1, 2, 3, 4, 5, 6]) {
      useRecentlyViewedStore.getState().addProduct(id);
    }

    expect(useRecentlyViewedStore.getState().productIds).toEqual([6, 5, 4, 3, 2]);
  });

  it('clear empties the list', () => {
    useRecentlyViewedStore.getState().addProduct(1);
    useRecentlyViewedStore.getState().clear();

    expect(useRecentlyViewedStore.getState().productIds).toEqual([]);
  });
});
