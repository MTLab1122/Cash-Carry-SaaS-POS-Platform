import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

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
}
