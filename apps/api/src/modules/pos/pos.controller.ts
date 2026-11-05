import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pos')
@UseGuards(JwtAuthGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('checkout')
  processCheckout(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @CurrentUser('id') cashierId: string,
    @Body() dto: any,
  ) {
    return this.posService.processCheckout({
      ...dto,
      tenantId,
      branchId: dto.branchId || userBranchId,
      cashierId,
    });
  }

  @Post('session/open')
  openSession(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @CurrentUser('id') cashierId: string,
    @Body()
    body: {
      branchId?: string;
      registerId: string;
      openingBalance: number;
      notes?: string;
    },
  ) {
    return this.posService.openSession({
      tenantId,
      branchId: body.branchId || userBranchId,
      registerId: body.registerId,
      cashierId,
      openingBalance: Number(body.openingBalance) || 0,
      notes: body.notes,
    });
  }

  @Post('session/:id/close')
  closeSession(
    @CurrentUser('id') cashierId: string,
    @Param('id') sessionId: string,
    @Body() body: { closingBalance: number; notes?: string },
  ) {
    return this.posService.closeSession({
      sessionId,
      cashierId,
      closingBalance: Number(body.closingBalance) || 0,
      notes: body.notes,
    });
  }

  @Get('session/active/:registerId')
  getActiveSession(@Param('registerId') registerId: string) {
    return this.posService.getActiveSession(registerId);
  }

  @Post('returns')
  processReturn(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('id') approvedById: string,
    @Body()
    body: {
      saleId: string;
      items: { productId: string; quantity: number; unitPrice: number }[];
      refundAmount: number;
      reason: string;
    },
  ) {
    return this.posService.processReturn({
      tenantId,
      branchId,
      approvedById,
      ...body,
    });
  }

  @Get('sales/recent')
  getRecentSales(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('branchId') userBranchId: string,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posService.getRecentSales({
      tenantId,
      branchId: branchId || userBranchId,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
