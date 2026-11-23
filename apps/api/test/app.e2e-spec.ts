import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { DomainExceptionFilter } from '../src/core/domain-exception.filter.js';

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  it('GET /health returns 200 ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /api/products/featured returns 5 products from the live Fake Store API', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/featured');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
  }, 15_000);

  afterEach(async () => {
    await app.close();
  });
});
