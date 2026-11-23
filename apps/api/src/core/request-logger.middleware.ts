import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Structured, one-line-JSON request logging. Registered as global
 * middleware (not an interceptor) so it also covers requests that never
 * reach a controller - a 404 on an unknown path, or a request rejected
 * by CORS - which an interceptor would miss entirely since interceptors
 * only wrap successfully-matched route handlers.
 *
 * Deliberately not pino/pino-http: one more dependency to justify for a
 * format Nest's own Logger can already produce. If log volume or a real
 * log aggregator (needing NDJSON at high throughput) becomes a real
 * requirement, swap this file for nestjs-pino - the interface (one
 * middleware, one call site in main.ts) doesn't change.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on('finish', () => {
      const entry = {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        ip: req.ip,
      };
      this.logger.log(JSON.stringify(entry));
    });

    next();
  }
}
