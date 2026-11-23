import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { EnquiryService } from './enquiry.service.js';
import { ProductCatalogPort } from '../../domain/ports/product-catalog.port.js';
import { EmailPort } from '../../domain/ports/email.port.js';
import { SALES_INBOX_EMAIL } from '../../core/sales-inbox-email.token.js';
import { FixtureCatalogAdapter } from '../../test-support/fixtures.js';

describe('EnquiryService', () => {
  let service: EnquiryService;
  let emailPort: EmailPort;

  beforeEach(async () => {
    emailPort = { send: vi.fn(async () => undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnquiryService,
        { provide: ProductCatalogPort, useClass: FixtureCatalogAdapter },
        { provide: EmailPort, useValue: emailPort },
        { provide: SALES_INBOX_EMAIL, useValue: 'sales@example.com' },
      ],
    }).compile();

    service = module.get<EnquiryService>(EnquiryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('submit sends one email for a valid, existing product', async () => {
    await service.submit({ productId: 1, name: 'Jane', email: 'jane@example.com', message: 'hi' });
    expect(emailPort.send).toHaveBeenCalledTimes(1);
  });
});
