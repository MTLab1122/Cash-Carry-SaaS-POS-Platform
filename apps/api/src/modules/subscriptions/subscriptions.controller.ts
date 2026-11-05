import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  getCurrent(@CurrentUser('tenantId') tenantId: string) {
    return this.subscriptionsService.getTenantSubscription(tenantId);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  upgradePlan(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { planId: string; billingCycle?: 'MONTHLY' | 'ANNUAL' },
  ) {
    return this.subscriptionsService.upgradePlan(tenantId, body.planId, body.billingCycle);
  }
}
