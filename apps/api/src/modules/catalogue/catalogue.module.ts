import { Module } from '@nestjs/common';
import { CatalogueController } from './catalogue.controller.js';
import { CatalogueService } from './catalogue.service.js';
import { CoreModule } from '../../core/core.module.js';

@Module({
  imports: [CoreModule],
  controllers: [CatalogueController],
  providers: [CatalogueService],
})
export class CatalogueModule {}
