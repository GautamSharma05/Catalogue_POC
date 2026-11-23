import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductCatalogPort } from '../domain/ports/product-catalog.port.js';
import { EmailPort } from '../domain/ports/email.port.js';
import { FakeStoreCatalogAdapter } from '../adapters/fake-store-catalog.adapter.js';
import { ConsoleEmailAdapter } from '../adapters/console-email.adapter.js';
import { SALES_INBOX_EMAIL } from './sales-inbox-email.token.js';

/**
 * Provides the swappable adapters (ProductCatalogPort, EmailPort) as
 * singletons shared across every feature module. Importing CoreModule from
 * two feature modules does not create two FakeStoreCatalogAdapter instances
 * (and so does not duplicate the TTL cache) - Nest resolves the same
 * CoreModule class to the same provider instances everywhere it's imported.
 *
 * Reads config via the injected ConfigService (registered globally in
 * AppModule), not a directly-called loadConfig() - this module no longer
 * needs ConfigModule imported explicitly here because AppModule's
 * ConfigModule.forRoot({ isGlobal: true }) makes ConfigService available
 * everywhere without re-importing.
 */
@Module({
  providers: [
    {
      provide: ProductCatalogPort,
      useFactory: () => new FakeStoreCatalogAdapter(),
    },
    {
      provide: EmailPort,
      useFactory: (configService: ConfigService) =>
        new ConsoleEmailAdapter(configService.get<string>('app.emailLogPath')!),
      inject: [ConfigService],
    },
    {
      provide: SALES_INBOX_EMAIL,
      useFactory: (configService: ConfigService) => configService.get<string>('app.salesInboxEmail'),
      inject: [ConfigService],
    },
  ],
  exports: [ProductCatalogPort, EmailPort, SALES_INBOX_EMAIL],
})
export class CoreModule {}
