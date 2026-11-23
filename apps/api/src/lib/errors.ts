/** Thrown by a ProductCatalogPort implementation when the upstream source fails. */
export class CatalogSourceError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'CatalogSourceError';
  }
}

/** Thrown when a referenced entity (e.g. a product id) does not exist. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Thrown when caller-supplied input fails validation. */
export class ValidationError extends Error {
  constructor(message: string, readonly details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}
