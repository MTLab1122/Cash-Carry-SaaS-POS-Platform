import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string, @Query('search') search?: string) {
    return this.customersService.findAll(tenantId, search);
  }

  @Get('phone/:phone')
  findByPhone(@CurrentUser('tenantId') tenantId: string, @Param('phone') phone: string) {
    return this.customersService.findByPhone(tenantId, phone);
  }

  @Post()
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: any) {
    return this.customersService.create(tenantId, dto);
  }

  @Post(':id/payment')
  recordPayment(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') customerId: string,
    @Body() body: { amount: number; notes?: string },
  ) {
    return this.customersService.recordPayment(tenantId, customerId, Number(body.amount) || 0, body.notes);
  }
}

