import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  async getTenantSubscription(tenantId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) {
      throw new NotFoundException('No active subscription found');
    }
    return sub;
  }

  async upgradePlan(tenantId: string, planId: string, billingCycle: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const durationDays = billingCycle === 'ANNUAL' ? 365 : 30;
    const now = new Date();
    const nextBilling = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId,
        status: 'ACTIVE',
        billingCycle,
        startDate: now,
        endDate: nextBilling,
        nextBillingDate: nextBilling,
        autoRenew: true,
      },
      include: { plan: true },
    });
  }
}

