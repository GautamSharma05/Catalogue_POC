import { ProductCatalogPort } from '../domain/ports/product-catalog.port.js';
import type { Product } from '../domain/types.js';
import { CatalogSourceError } from '../lib/errors.js';
import { TtlCache } from '../lib/cache.js';

/** Shape returned by https://fakestoreapi.com/products — kept private to this file. */
interface FakeStoreProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: { rate: number; count: number };
}

export type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

const DEFAULT_TTL_MS = 60_000;

/**
 * ProductCatalogPort backed by the Fake Store API. Maps its shape to the
 * internal Product type and caches the full product list briefly so the
 * public API is not called on every request.
 */
export class FakeStoreCatalogAdapter implements ProductCatalogPort {
  private readonly cache: TtlCache<Product[]>;

  constructor(
    private readonly baseUrl: string = 'https://fakestoreapi.com',
    private readonly fetchImpl: FetchLike = fetch as unknown as FetchLike,
    ttlMs: number = DEFAULT_TTL_MS,
  ) {
    this.cache = new TtlCache<Product[]>(ttlMs);
  }

  async getAllProducts(): Promise<Product[]> {
    const cached = this.cache.get();
    if (cached) return cached;

    const raw = await this.fetchJson<FakeStoreProduct[]>('/products');
    const products = raw.map(mapProduct);
    this.cache.set(products);
    return products;
  }

  async getCategories(): Promise<string[]> {
    const products = await this.getAllProducts();
    return [...new Set(products.map((p) => p.category))].sort();
  }

  async getProductById(id: number): Promise<Product | null> {
    const products = await this.getAllProducts();
    return products.find((p) => p.id === id) ?? null;
  }

  private async fetchJson<T>(path: string): Promise<T> {
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`);
    } catch (cause) {
      throw new CatalogSourceError(`Failed to reach product source at ${path}`, cause);
    }
    if (!response.ok) {
      throw new CatalogSourceError(`Product source responded with status ${response.status} for ${path}`);
    }
    return (await response.json()) as T;
  }
}

function mapProduct(raw: FakeStoreProduct): Product {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    price: raw.price,
    category: raw.category,
    imageUrl: raw.image,
    rating: { rate: raw.rating.rate, count: raw.rating.count },
  };
}
