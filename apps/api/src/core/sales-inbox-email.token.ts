/**
 * Injection token for the sales inbox email address. EnquiryService
 * depends on this one plain string value instead of the whole
 * ConfigService - same reasoning as ProductCatalogPort/EmailPort: a
 * small, specific, easily-mocked seam instead of a broad dependency that
 * would force every test touching EnquiryService to also stand up
 * ConfigModule.
 */
export const SALES_INBOX_EMAIL = Symbol('SALES_INBOX_EMAIL');
