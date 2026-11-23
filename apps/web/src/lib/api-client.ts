import type { CategoryView, EnquiryInput, Product } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError((body as { error?: string } | undefined)?.error ?? 'Request failed', response.status, body);
  }
  return body as T;
}

/**
 * The only module in this app that talks to the backend. All product data
 * flows through our own API — this client never calls the Fake Store API
 * directly.
 */
export const api = {
  getFeaturedProducts: () => request<Product[]>('/api/products/featured'),
  getCategories: () => request<string[]>('/api/categories'),
  getCategoryView: (slug: string) => request<CategoryView>(`/api/categories/${encodeURIComponent(slug)}/products`),
  searchProducts: (term: string) => request<Product[]>(`/api/products?search=${encodeURIComponent(term)}`),
  getProductById: (id: number) => request<Product>(`/api/products/${id}`),
  submitEnquiry: (input: EnquiryInput) =>
    request<{ status: string }>('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
