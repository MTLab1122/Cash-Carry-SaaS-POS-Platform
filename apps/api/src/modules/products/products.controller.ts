import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAll({
      tenantId,
      branchId: branchId || userBranchId,
      categoryId,
      search,
      lowStockOnly: lowStockOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('categories')
  getCategories(@CurrentUser('tenantId') tenantId: string) {
    return this.productsService.getCategories(tenantId);
  }

  @Post('categories')
  createCategory(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: { name: string; description?: string },
  ) {
    return this.productsService.createCategory(tenantId, dto);
  }

  @Post('ai-suggest')
  aiSuggest(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { prompt: string },
  ) {
    return this.productsService.aiSuggest(tenantId, body.prompt);
  }

  @Get('scan/:code')
  findByBarcode(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') branchId: string,
    @Param('code') code: string,
  ) {
    return this.productsService.findByBarcodeOrSku(tenantId, code, branchId);
  }

  @Get(':id')
  findById(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.productsService.findById(tenantId, id);
  }

  @Post()
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') branchId: string,
    @Body() dto: any,
  ) {
    return this.productsService.create(tenantId, dto.branchId || branchId, dto);
  }

  @Put(':id')
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.productsService.delete(tenantId, id);
  }

  @Post('bulk-import')
  bulkImport(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') branchId: string,
    @Body() body: { items: any[]; branchId?: string },
  ) {
    return this.productsService.bulkImport(tenantId, body.branchId || branchId, body.items);
  }
}
