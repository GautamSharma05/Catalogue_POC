import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { DomainExceptionFilter } from '../src/core/domain-exception.filter.js';

/**
 * Boots the full AppModule (like app.e2e-spec.ts) specifically because
 * the throttling guard is registered globally via APP_GUARD in
 * AppModule itself - a controller-level TestingModule (as used in
 * enquiry.controller.spec.ts) never has it wired in, so this behavior
 * can only be exercised end-to-end.
 */
describe('Rate limiting (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it(
    'POST /api/enquiries returns 429 after 5 requests within the window, while other routes stay unaffected',
    async () => {
      const payload = { productId: 1, name: 'Jane', email: 'jane@example.com', message: 'Interested!' };

      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer()).post('/api/enquiries').send(payload);
        expect(response.status).toBe(201);
      }

      const sixth = await request(app.getHttpServer()).post('/api/enquiries').send(payload);
      expect(sixth.status).toBe(429);

      // The strict @Throttle on this route is scoped to it specifically -
      // an unrelated route should be completely unaffected even right
      // after the enquiry limit above was exhausted on the same app
      // instance (same throttler storage).
      const health = await request(app.getHttpServer()).get('/health');
      expect(health.status).toBe(200);
    },
    15_000,
  );
});
