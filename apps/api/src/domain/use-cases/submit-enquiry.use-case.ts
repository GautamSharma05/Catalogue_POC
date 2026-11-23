import { z } from 'zod';

import { EmailPort } from '../ports/email.port.js';
import { ProductCatalogPort } from '../ports/product-catalog.port.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';

export const enquirySchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  message: z.string().trim().min(1),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/**
 * Validates an enquiry, confirms the product exists, then emails the sales
 * inbox. Validation and not-found failures never reach the EmailPort.
 */
export class SubmitEnquiryUseCase {
  constructor(
    private readonly catalog: ProductCatalogPort,
    private readonly email: EmailPort,
    private readonly salesInboxEmail: string,
  ) {}

  async execute(input: unknown): Promise<void> {
    const parsed = enquirySchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('Invalid enquiry payload', parsed.error.flatten());
    }

    const { productId, name, email, message } = parsed.data;
    const product = await this.catalog.getProductById(productId);
    if (!product) {
      throw new NotFoundError(`No product found with id ${productId}`);
    }

    await this.email.send({
      to: this.salesInboxEmail,
      subject: `New enquiry: ${product.title}`,
      body: [
        `Product: ${product.title} (#${product.id})`,
        `From: ${name} <${email}>`,
        '',
        message,
      ].join('\n'),
    });
  }
}
