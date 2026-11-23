import { describe, expect, it, vi } from 'vitest';

import { SubmitEnquiryUseCase } from './submit-enquiry.use-case.js';
import { FixtureCatalogAdapter } from '../../test-support/fixtures.js';
import type { EmailPort } from '../ports/email.port.js';

function makeEmailSpy(): EmailPort {
  return { send: vi.fn(async () => undefined) };
}

describe('SubmitEnquiryUseCase', () => {
  it('sends one email to the configured sales inbox for a valid enquiry', async () => {
    const emailPort = makeEmailSpy();
    const useCase = new SubmitEnquiryUseCase(new FixtureCatalogAdapter(), emailPort, 'sales@example.com');

    await useCase.execute({ productId: 1, name: 'Jane', email: 'jane@example.com', message: 'Interested!' });

    expect(emailPort.send).toHaveBeenCalledTimes(1);
    expect(emailPort.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'sales@example.com' }),
    );
  });

  it('throws a validation error and never calls the email adapter for an invalid email address', async () => {
    const emailPort = makeEmailSpy();
    const useCase = new SubmitEnquiryUseCase(new FixtureCatalogAdapter(), emailPort, 'sales@example.com');

    await expect(
      useCase.execute({ productId: 1, name: 'Jane', email: 'not-an-email', message: 'hi' }),
    ).rejects.toThrow();
    expect(emailPort.send).not.toHaveBeenCalled();
  });

  it('throws a not-found error and never calls the email adapter for an unknown productId', async () => {
    const emailPort = makeEmailSpy();
    const useCase = new SubmitEnquiryUseCase(new FixtureCatalogAdapter(), emailPort, 'sales@example.com');

    await expect(
      useCase.execute({ productId: 9999, name: 'Jane', email: 'jane@example.com', message: 'hi' }),
    ).rejects.toThrow();
    expect(emailPort.send).not.toHaveBeenCalled();
  });
});
