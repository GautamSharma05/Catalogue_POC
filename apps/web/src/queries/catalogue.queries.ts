import { useQuery, useQueries } from '@tanstack/react-query';

import { api } from '../lib/api-client';

/**
 * Centralized query keys. Keeping them here (rather than inline at each
 * call site) means invalidating/prefetching a given query is a single
 * import, not a string literal duplicated across components.
 */
export const catalogueKeys = {
  featured: () => ['products', 'featured'] as const,
  categories: () => ['categories'] as const,
  categoryView: (slug: string) => ['categories', slug, 'products'] as const,
  search: (term: string) => ['products', 'search', term] as const,
  product: (id: number) => ['products', id] as const,
};

export function useFeaturedProductsQuery() {
  return useQuery({
    queryKey: catalogueKeys.featured(),
    queryFn: api.getFeaturedProducts,
  });
}

/**
 * Backs the persistent header category nav. Long staleTime because the
 * category list itself (not the products in it) changes essentially
 * never for this PoC's data source.
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: catalogueKeys.categories(),
    queryFn: api.getCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryViewQuery(slug: string) {
  return useQuery({
    queryKey: catalogueKeys.categoryView(slug),
    queryFn: () => api.getCategoryView(slug),
    enabled: slug.length > 0,
  });
}

/**
 * `minLength` lets call-sites set their own trigger threshold (the live
 * search combobox wants >=2 characters before hitting the backend per
 * keystroke; the full /search results page fires on any non-empty term
 * since the user already pressed Enter) while sharing one cache entry
 * per term - a suggestion the combobox already fetched is instantly
 * available if the visitor lands on the full results page for it.
 */
export function useSearchProductsQuery(term: string, minLength = 1) {
  return useQuery({
    queryKey: catalogueKeys.search(term),
    queryFn: () => api.searchProducts(term),
    enabled: term.trim().length >= minLength,
  });
}

export function useProductQuery(id: number) {
  return useQuery({
    queryKey: catalogueKeys.product(id),
    queryFn: () => api.getProductById(id),
    enabled: Number.isInteger(id),
  });
}

/**
 * Fetches many products by id in parallel, each as its own cache entry
 * (so a product already cached from useProductQuery is reused, not
 * refetched). Used to resolve the "recently viewed" id list kept in
 * Zustand into actual product data.
 */
export function useProductsByIdQuery(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: catalogueKeys.product(id),
      queryFn: () => api.getProductById(id),
    })),
  });
}
