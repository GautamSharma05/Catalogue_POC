import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { vi } from 'vitest';
import { EnquiryController } from './enquiry.controller.js';
import { EnquiryService } from './enquiry.service.js';
import { ProductCatalogPort } from '../../domain/ports/product-catalog.port.js';
import { EmailPort } from '../../domain/ports/email.port.js';
import { SALES_INBOX_EMAIL } from '../../core/sales-inbox-email.token.js';
import { FixtureCatalogAdapter } from '../../test-support/fixtures.js';
import { DomainExceptionFilter } from '../../core/domain-exception.filter.js';

async function buildApp(emailPort: EmailPort) {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [EnquiryController],
    providers: [
      EnquiryService,
      { provide: ProductCatalogPort, useClass: FixtureCatalogAdapter },
      { provide: EmailPort, useValue: emailPort },
      { provide: SALES_INBOX_EMAIL, useValue: 'sales@example.com' },
    ],
  }).compile();

  const app: INestApplication = module.createNestApplication();
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
  return app;
}

describe('EnquiryController', () => {
  it('should be defined', async () => {
    const emailPort: EmailPort = { send: vi.fn(async () => undefined) };
    const app = await buildApp(emailPort);
    expect(app.get(EnquiryController)).toBeDefined();
    await app.close();
  });

  it('POST /api/enquiries with a valid payload returns 201 and triggers one email send', async () => {
    const emailPort: EmailPort = { send: vi.fn(async () => undefined) };
    const app = await buildApp(emailPort);

    const response = await request(app.getHttpServer())
      .post('/api/enquiries')
      .send({ productId: 1, name: 'Jane', email: 'jane@example.com', message: 'Interested!' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ status: 'received' });
    expect(emailPort.send).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('POST /api/enquiries with a missing field returns 400 and does not send an email', async () => {
    const emailPort: EmailPort = { send: vi.fn(async () => undefined) };
    const app = await buildApp(emailPort);

    const response = await request(app.getHttpServer())
      .post('/api/enquiries')
      .send({ productId: 1, name: 'Jane', message: 'hi' });

    expect(response.status).toBe(400);
    expect(emailPort.send).not.toHaveBeenCalled();
    await app.close();
  });

  it('POST /api/enquiries with an unknown productId returns 404 and does not send an email', async () => {
    const emailPort: EmailPort = { send: vi.fn(async () => undefined) };
    const app = await buildApp(emailPort);

    const response = await request(app.getHttpServer())
      .post('/api/enquiries')
      .send({ productId: 9999, name: 'Jane', email: 'jane@example.com', message: 'hi' });

    expect(response.status).toBe(404);
    expect(emailPort.send).not.toHaveBeenCalled();
    await app.close();
  });
});
