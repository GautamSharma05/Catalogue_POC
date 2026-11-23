import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { DomainExceptionFilter } from './core/domain-exception.filter.js';
import type { AppConfig } from './config/configuration.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable NestJS shutdown hooks so lifecycle events (onModuleDestroy,
  // beforeApplicationShutdown, onApplicationShutdown) fire on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  // Helmet first: it only sets response headers, so it should run before
  // anything that might short-circuit the response (CORS, the exception
  // filter's error responses, etc.) so every response - success or
  // error - carries the same security headers.
  app.use(helmet());

  app.useGlobalFilters(new DomainExceptionFilter());

  const corsOrigin = configService.get<AppConfig['corsOrigin']>('app.corsOrigin');
  app.enableCors({
    origin: corsOrigin || '*',
    methods: 'GET,POST,OPTIONS',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Catalogue PoC API')
    .setDescription(
      'Product catalogue and enquiry API backing the Catalogue PoC web client. ' +
        'Product data is sourced from the Fake Store API behind ProductCatalogPort; ' +
        'enquiries are logged via EmailPort (console/file adapter in this environment).',
    )
    .setVersion('0.1.0')
    .addTag('catalogue', 'Browse, search, and category endpoints')
    .addTag('enquiries', 'Customer enquiry submission')
    .addTag('health', 'Liveness check')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = configService.get<AppConfig['port']>('app.port')!;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(`API docs at http://localhost:${port}/api/docs`);
  });

  // Graceful shutdown: on SIGTERM (Docker/K8s stop) or SIGINT (Ctrl-C),
  // stop accepting new connections, let in-flight requests drain (up to
  // the timeout), run NestJS lifecycle hooks, then exit cleanly.
  const SHUTDOWN_TIMEOUT_MS = 10_000;

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — starting graceful shutdown…`);

    // Safety net: if cleanup hangs, force-exit after the timeout.
    const forceExit = setTimeout(() => {
      console.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref(); // don't keep the event loop alive just for this timer

    try {
      await app.close(); // stops listener, drains connections, runs lifecycle hooks
      console.log('Shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
