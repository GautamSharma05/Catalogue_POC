import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { CatalogSourceError, NotFoundError, ValidationError } from '../lib/errors.js';

/**
 * Central error -> HTTP status mapping, equivalent to the old Express
 * error-handler middleware. Never leaks stack traces to the client.
 * Domain errors (ValidationError/NotFoundError/CatalogSourceError) are
 * mapped first; anything already an HttpException (thrown by Nest's own
 * BadRequestException/NotFoundException, or validation pipes) passes
 * through with its own status/body.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof ValidationError) {
      res.status(400).json({ error: exception.message, details: exception.details });
      return;
    }
    if (exception instanceof NotFoundError) {
      res.status(404).json({ error: exception.message });
      return;
    }
    if (exception instanceof CatalogSourceError) {
      res.status(502).json({ error: 'Product data source is currently unavailable' });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(typeof body === 'string' ? { error: body } : body);
      return;
    }

    console.error(exception);
    res.status(500).json({ error: 'Internal server error' });
  }
}
