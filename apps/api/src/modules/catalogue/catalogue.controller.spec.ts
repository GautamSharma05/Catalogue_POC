import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CatalogueController } from './catalogue.controller.js';
import { CatalogueService } from './catalogue.service.js';
import { ProductCatalogPort } from '../../domain/ports/product-catalog.port.js';
import { FixtureCatalogAdapter } from '../../test-support/fixtures.js';
import { DomainExceptionFilter } from '../../core/domain-exception.filter.js';
import { CatalogSourceError } from '../../lib/errors.js';

async function buildApp(catalog: ProductCatalogPort = new FixtureCatalogAdapter()) {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [CatalogueController],
    providers: [CatalogueService, { provide: ProductCatalogPort, useValue: catalog }],
  }).compile();

  const app: INestApplication = module.createNestApplication();
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
  return app;
}

describe('CatalogueController', () => {
  it('should be defined', async () => {
    const app = await buildApp();
    const module = app.get(CatalogueController);
    expect(module).toBeDefined();
    await app.close();
  });

  it('GET /api/products/featured returns 200 with 5 items', async () => {
    const app = await buildApp();
    const response = await request(app.getHttpServer()).get('/api/products/featured');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    await app.close();
  });

  it('GET /api/categories/:slug/products returns 200 with top-rated and other items for that category', async () => {
    const app = await buildApp();
    const response = await request(app.getHttpServer()).get('/api/categories/tools/products');

    expect(response.status).toBe(200);
    expect(response.body.topRated.map((p: { id: number }) => p.id)).toEqual([1, 2, 3]);
    expect(response.body.others.map((p: { id: number }) => p.id)).toEqual([4]);
    await app.close();
  });

  it('GET /api/products?search= with an empty term returns 400', async () => {
    const app = await buildApp();
    const response = await request(app.getHttpServer()).get('/api/products').query({ search: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    await app.close();
  });

  it('GET /api/products?search=term returns 200 with only matching items', async () => {
    const app = await buildApp();
    const response = await request(app.getHttpServer()).get('/api/products').query({ search: 'drill' });

    expect(response.status).toBe(200);
    expect(response.body.map((p: { id: number }) => p.id)).toEqual([2]);
    await app.close();
  });

  it('GET /api/products/:id returns 404 for an unknown id', async () => {
    const app = await buildApp();
    const response = await request(app.getHttpServer()).get('/api/products/9999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    await app.close();
  });

  it('returns 502, not a raw 500 with a stack trace, when the catalog source fails', async () => {
    const failingCatalog: ProductCatalogPort = {
      getAllProducts: async () => {
        throw new CatalogSourceError('upstream down');
      },
      getCategories: async () => [],
      getProductById: async () => null,
    };
    const app = await buildApp(failingCatalog);

    const response = await request(app.getHttpServer()).get('/api/products/featured');

    expect(response.status).toBe(502);
    expect(response.body.error).toBe('Product data source is currently unavailable');
    await app.close();
  });
});
