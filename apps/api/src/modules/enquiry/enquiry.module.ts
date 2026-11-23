import { Module } from '@nestjs/common';
import { EnquiryController } from './enquiry.controller.js';
import { EnquiryService } from './enquiry.service.js';
import { CoreModule } from '../../core/core.module.js';

@Module({
  imports: [CoreModule],
  controllers: [EnquiryController],
  providers: [EnquiryService],
})
export class EnquiryModule {}
