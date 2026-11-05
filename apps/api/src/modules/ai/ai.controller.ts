import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('query')
  processQuery(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @CurrentUser('role') userRole: string,
    @Body() body: { query: string; branchId?: string },
  ) {
    return this.aiService.processQuery({
      tenantId,
      branchId: body.branchId || userBranchId,
      userRole,
      query: body.query,
    });
  }

  @Get('inventory-insights')
  getInventoryInsights(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.aiService.getInventoryInsights(tenantId, branchId || userBranchId);
  }
}
