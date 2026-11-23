import { ProductCatalogPort } from '../ports/product-catalog.port.js';
import type { CategoryView, Product } from '../types.js';

const FEATURED_COUNT = 5;
const TOP_RATED_PER_CATEGORY = 3;

/**
 * Catalogue read behaviors (featured, category view, search, detail) built
 * purely on top of ProductCatalogPort. "Top rated" is a documented
 * assumption: the N highest `rating.rate` values, id ascending as a
 * tiebreaker so results are deterministic.
 */
export class CatalogueUseCases {
  constructor(private readonly catalog: ProductCatalogPort) {}

  async getFeatured(): Promise<Product[]> {
    const products = await this.catalog.getAllProducts();
    return topRated(products, FEATURED_COUNT);
  }

  async getCategoryView(category: string): Promise<CategoryView> {
    const products = await this.catalog.getAllProducts();
    const inCategory = products.filter((p) => p.category === category);
    const top = topRated(inCategory, TOP_RATED_PER_CATEGORY);
    const topIds = new Set(top.map((p) => p.id));
    const others = inCategory.filter((p) => !topIds.has(p.id));
    return { category, topRated: top, others };
  }

  async searchProducts(term: string): Promise<Product[]> {
    const normalized = term.trim().toLowerCase();
    if (normalized.length === 0) return [];
    const products = await this.catalog.getAllProducts();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(normalized) ||
        p.description.toLowerCase().includes(normalized),
    );
  }

  async getProductDetail(id: number): Promise<Product | null> {
    return this.catalog.getProductById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.catalog.getCategories();
  }
}

function topRated(products: Product[], count: number): Product[] {
  return [...products]
    .sort((a, b) => b.rating.rate - a.rating.rate || a.id - b.id)
    .slice(0, count);
}
