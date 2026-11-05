import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { BarcodeService } from './barcode.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('barcode')
@UseGuards(JwtAuthGuard)
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Get('generate-ean13')
  generateEan13(@Query('productId') productId: string) {
    const num = Math.floor(Math.random() * 899999999) + 100000000;
    const barcode = this.barcodeService.generateEan13(num);
    return { barcode, format: 'EAN-13' };
  }

  @Post('validate')
  validateBarcode(@Body() body: { barcode: string; type?: 'EAN13' | 'CODE128' }) {
    return this.barcodeService.validateBarcode(body.barcode, body.type);
  }

  @Post('label-template')
  getLabelTemplate(
    @Body()
    body: {
      productName: string;
      barcode: string;
      sku: string;
      retailPrice: number;
      currency?: string;
      widthMm?: number;
      heightMm?: number;
    },
    @CurrentUser('tenant') tenant: any,
  ) {
    return this.barcodeService.generateLabelTemplate({
      ...body,
      companyName: tenant?.name || 'Cash & Carry Superstore',
      currency: body.currency || tenant?.currency || 'PKR',
    });
  }
}

