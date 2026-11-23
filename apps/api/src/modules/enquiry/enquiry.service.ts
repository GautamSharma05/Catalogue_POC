import { Injectable, Inject } from '@nestjs/common';
import { SubmitEnquiryUseCase } from '../../domain/use-cases/submit-enquiry.use-case.js';
import { ProductCatalogPort } from '../../domain/ports/product-catalog.port.js';
import { EmailPort } from '../../domain/ports/email.port.js';
import { SALES_INBOX_EMAIL } from '../../core/sales-inbox-email.token.js';

@Injectable()
export class EnquiryService {
  private submitEnquiryUseCase: SubmitEnquiryUseCase;

  constructor(
    @Inject(ProductCatalogPort) private catalog: ProductCatalogPort,
    @Inject(EmailPort) private email: EmailPort,
    @Inject(SALES_INBOX_EMAIL) private salesInboxEmail: string,
  ) {
    this.submitEnquiryUseCase = new SubmitEnquiryUseCase(catalog, email, salesInboxEmail);
  }

  async submit(payload: { productId: number; name: string; email: string; message: string }) {
    return this.submitEnquiryUseCase.execute(payload);
  }
}
