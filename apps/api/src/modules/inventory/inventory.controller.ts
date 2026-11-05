import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('balances')
  getBalances(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getBalances(tenantId, branchId || userBranchId, warehouseId);
  }

  @Get('ledger')
  getLedger(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getLedger({
      tenantId,
      branchId: branchId || userBranchId,
      productId,
      type,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('valuation')
  getValuation(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.getValuationSummary(tenantId, branchId || userBranchId);
  }

  @Post('adjust')
  adjustStock(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      branchId: string;
      warehouseId: string;
      productId: string;
      type: 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUBTRACT' | 'DAMAGE' | 'EXPIRY';
      quantity: number;
      notes?: string;
    },
  ) {
    return this.inventoryService.adjustStock({
      tenantId,
      userId,
      ...body,
    });
  }

  @Post('transfer')
  transferStock(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      fromBranchId: string;
      fromWarehouseId: string;
      toBranchId: string;
      toWarehouseId: string;
      productId: string;
      quantity: number;
      notes?: string;
    },
  ) {
    return this.inventoryService.transferStock({
      tenantId,
      userId,
      ...body,
    });
  }
}

