import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CatalogueModule } from './modules/catalogue/catalogue.module.js';
import { EnquiryModule } from './modules/enquiry/enquiry.module.js';
import { CoreModule } from './core/core.module.js';
import { HealthModule } from './health/health.module.js';
import { RequestLoggerMiddleware } from './core/request-logger.middleware.js';
import configuration from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    // Generous global baseline (every route, 100 req/min/IP) so a single
    // misbehaving client can't hammer the whole API; the one write
    // endpoint that actually matters for abuse (/api/enquiries) gets its
    // own much stricter @Throttle override - see EnquiryController.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    CoreModule,
    CatalogueModule,
    EnquiryModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Applied via configure(), not app.use() in main.ts, specifically so
    // it covers every path including ones no controller matches (404s) -
    // '*' here means "all routes", not "all middleware".
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
