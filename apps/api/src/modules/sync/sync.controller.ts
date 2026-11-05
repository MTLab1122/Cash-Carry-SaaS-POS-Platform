import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('ping')
  ping(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return {
      status: 'ok',
      serverTime: new Date().toISOString(),
      tenantId,
      userId,
      version: '1.0.0',
    };
  }

  @Post('batch')
  syncBatch(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @CurrentUser('id') cashierId: string,
    @Body()
    body: {
      deviceId: string;
      branchId?: string;
      transactions: any[];
    },
  ) {
    return this.syncService.syncBatch({
      deviceId: body.deviceId || 'DESKTOP-POS-DEFAULT',
      tenantId,
      branchId: body.branchId || userBranchId,
      cashierId,
      transactions: body.transactions,
    });
  }

  @Get('cache')
  getDesktopDataCache(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.syncService.getDesktopDataCache(tenantId, branchId || userBranchId);
  }

  @Get('negative-stock')
  reconcileNegativeStock(@CurrentUser('tenantId') tenantId: string) {
    return this.syncService.reconcileNegativeStock(tenantId);
  }
}
