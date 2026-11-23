import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EnquiryService } from './enquiry.service.js';

@ApiTags('enquiries')
@Controller('api')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @Post('enquiries')
  @HttpCode(201)
  // Stricter than the app-wide default (100/min): this is the one write
  // endpoint that triggers an email send, so it's the one worth guarding
  // against a spam/abuse script specifically, not just generic traffic.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Submit a customer enquiry about a product - delivered via EmailPort to the sales inbox" })
  @ApiResponse({ status: 429, description: 'Too many enquiries from this client - limited to 5 per minute.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId', 'name', 'email', 'message'],
      properties: {
        productId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', example: 'jane@example.com' },
        message: { type: 'string', example: 'Is this still in stock?' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '{ status: "received" }' })
  @ApiResponse({ status: 400, description: 'Validation failed (missing field, invalid email, unknown productId, etc.).' })
  async submit(
    @Body() payload: { productId: number; name: string; email: string; message: string },
  ) {
    await this.enquiryService.submit(payload);
    return { status: 'received' };
  }
}
