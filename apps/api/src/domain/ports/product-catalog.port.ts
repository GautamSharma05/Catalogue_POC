import type { Product } from '../types.js';

/**
 * Port the catalogue domain depends on to read product data. Any concrete
 * product data source (Fake Store API today, a real inventory service later)
 * implements this class; the domain never knows which one is active.
 *
 * Declared as an abstract class (not an `interface`) so it survives
 * TypeScript's type erasure and can be used as a NestJS DI token via
 * `@Inject(ProductCatalogPort)` / `provide: ProductCatalogPort`.
 */
export abstract class ProductCatalogPort {
  /** All products from the source, unfiltered. */
  abstract getAllProducts(): Promise<Product[]>;
  /** Distinct category names present in the source. */
  abstract getCategories(): Promise<string[]>;
  /** A single product by id, or null if it does not exist. */
  abstract getProductById(id: number): Promise<Product | null>;
}
