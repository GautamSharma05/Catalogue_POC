import { Injectable, Inject } from '@nestjs/common';
import { CatalogueUseCases } from '../../domain/use-cases/catalogue.use-cases.js';
import { ProductCatalogPort } from '../../domain/ports/product-catalog.port.js';
import type { Product } from '../../domain/types.js';

@Injectable()
export class CatalogueService {
  private catalogueUseCases: CatalogueUseCases;

  constructor(@Inject(ProductCatalogPort) private catalog: ProductCatalogPort) {
    this.catalogueUseCases = new CatalogueUseCases(catalog);
  }

  async getFeatured() {
    return this.catalogueUseCases.getFeatured();
  }

  async getCategoryView(slug: string) {
    return this.catalogueUseCases.getCategoryView(slug);
  }

  async getCategories() {
    return this.catalogueUseCases.getCategories();
  }

  async search(term: string) {
    return this.catalogueUseCases.searchProducts(term);
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.catalogueUseCases.getProductDetail(id);
  }
}
