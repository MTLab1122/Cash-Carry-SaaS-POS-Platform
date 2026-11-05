import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('expenses')
  getExpenses(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.financeService.getExpenses(tenantId, branchId || userBranchId);
  }

  @Post('expenses')
  createExpense(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.financeService.createExpense({
      tenantId,
      branchId: dto.branchId || userBranchId,
      userId,
      title: dto.title,
      category: dto.category,
      amount: Number(dto.amount) || 0,
      paymentMethod: dto.paymentMethod,
      reference: dto.reference,
      notes: dto.notes,
    });
  }

  @Get('summary')
  getSummary(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.financeService.getProfitLossSummary(tenantId, branchId || userBranchId);
  }
}
