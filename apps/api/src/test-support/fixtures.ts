import { ProductCatalogPort } from '../domain/ports/product-catalog.port.js';
import type { Product } from '../domain/types.js';

export const fixtureProducts: Product[] = [
  { id: 1, title: 'Steel Hammer', description: 'A durable steel hammer', price: 19.99, category: 'tools', imageUrl: 'https://example.com/1.jpg', rating: { rate: 4.8, count: 120 } },
  { id: 2, title: 'Cordless Drill', description: 'Battery powered drill', price: 59.99, category: 'tools', imageUrl: 'https://example.com/2.jpg', rating: { rate: 4.5, count: 80 } },
  { id: 3, title: 'Paint Brush Set', description: 'Set of 5 brushes', price: 12.5, category: 'tools', imageUrl: 'https://example.com/3.jpg', rating: { rate: 3.2, count: 15 } },
  { id: 4, title: 'Hand Saw', description: 'Fine-tooth hand saw', price: 24.0, category: 'tools', imageUrl: 'https://example.com/4.jpg', rating: { rate: 2.9, count: 9 } },
  { id: 5, title: 'Winter Jacket', description: 'Warm winter jacket', price: 89.99, category: 'clothing', imageUrl: 'https://example.com/5.jpg', rating: { rate: 4.9, count: 300 } },
  { id: 6, title: 'Running Shoes', description: 'Lightweight running shoes', price: 69.99, category: 'clothing', imageUrl: 'https://example.com/6.jpg', rating: { rate: 4.7, count: 250 } },
  { id: 7, title: 'Wool Scarf', description: 'Soft wool scarf', price: 15.0, category: 'clothing', imageUrl: 'https://example.com/7.jpg', rating: { rate: 4.1, count: 40 } },
  { id: 8, title: 'Desk Lamp', description: 'LED desk lamp', price: 29.99, category: 'home', imageUrl: 'https://example.com/8.jpg', rating: { rate: 4.0, count: 60 } },
];

/** In-memory ProductCatalogPort for use-case/route tests. No network calls. */
export class FixtureCatalogAdapter implements ProductCatalogPort {
  constructor(private readonly products: Product[] = fixtureProducts) {}

  async getAllProducts(): Promise<Product[]> {
    return this.products;
  }

  async getCategories(): Promise<string[]> {
    return [...new Set(this.products.map((p) => p.category))].sort();
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }
}
