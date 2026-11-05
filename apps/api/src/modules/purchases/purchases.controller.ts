import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get('suppliers')
  getSuppliers(@CurrentUser('tenantId') tenantId: string) {
    return this.purchasesService.getSuppliers(tenantId);
  }

  @Post('suppliers')
  createSupplier(@CurrentUser('tenantId') tenantId: string, @Body() dto: any) {
    return this.purchasesService.createSupplier(tenantId, dto);
  }

  @Get('orders')
  getOrders(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.purchasesService.getPurchaseOrders(tenantId, branchId || userBranchId);
  }

  @Post('orders')
  createOrder(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.purchasesService.createPurchaseOrder({
      tenantId,
      branchId: dto.branchId || userBranchId,
      userId,
      ...dto,
    });
  }

  @Post('receive-goods')
  receiveGoods(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.purchasesService.receiveGoods({
      tenantId,
      branchId: dto.branchId || userBranchId,
      userId,
      ...dto,
    });
  }
}

