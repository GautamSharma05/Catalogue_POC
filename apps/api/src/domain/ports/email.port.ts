export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

/**
 * Port the domain depends on to send email. Swapping providers (SES,
 * SendGrid, etc.) means writing a new adapter, not touching the enquiry
 * use-case.
 *
 * Declared as an abstract class (not an `interface`) so it survives
 * TypeScript's type erasure and can be used as a NestJS DI token via
 * `@Inject(EmailPort)` / `provide: EmailPort`.
 */
export abstract class EmailPort {
  abstract send(message: EmailMessage): Promise<void>;
}
