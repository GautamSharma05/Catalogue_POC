import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueService } from './catalogue.service.js';
import { ProductCatalogPort } from '../../domain/ports/product-catalog.port.js';
import { FixtureCatalogAdapter } from '../../test-support/fixtures.js';

describe('CatalogueService', () => {
  let service: CatalogueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogueService,
        { provide: ProductCatalogPort, useClass: FixtureCatalogAdapter },
      ],
    }).compile();

    service = module.get<CatalogueService>(CatalogueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getFeatured returns exactly 5 products', async () => {
    const featured = await service.getFeatured();
    expect(featured).toHaveLength(5);
  });

  it('getProductById returns null for an unknown id', async () => {
    const product = await service.getProductById(9999);
    expect(product).toBeNull();
  });
});
