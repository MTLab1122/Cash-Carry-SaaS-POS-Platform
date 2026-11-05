import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('kpis')
  getKpis(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getDashboardKpis(tenantId, branchId || userBranchId);
  }

  @Get('sales-trends')
  getSalesTrends(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getSalesTrends(tenantId, branchId || userBranchId);
  }

  @Get('sales-by-category')
  getSalesByCategory(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getSalesByCategory(tenantId, branchId || userBranchId);
  }

  @Get('cashier-performance')
  getCashierPerformance(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getCashierPerformance(tenantId, branchId || userBranchId);
  }
}

