import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  // Super Admin view: list all businesses in the SaaS platform
  async findAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        branches: true,
        users: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Super Admin Platform Health & Revenue Stats
  async getPlatformStats() {
    const [tenants, subscriptions, totalSalesCount] = await Promise.all([
      this.prisma.tenant.findMany({
        include: {
          subscriptions: { include: { plan: true } },
        },
      }),
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
      this.prisma.sale.count(),
    ]);

    let mrr = 0;
    for (const sub of subscriptions) {
      if (sub.billingCycle === 'ANNUAL') {
        mrr += sub.plan.annualPrice / 12;
      } else {
        mrr += sub.plan.monthlyPrice;
      }
    }

    const arr = mrr * 12;
    const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
    const suspendedTenants = tenants.filter((t) => t.status === 'SUSPENDED').length;

    return {
      totalTenants: tenants.length,
      activeTenants,
      suspendedTenants,
      activeSubscriptions: subscriptions.length,
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      totalPlatformTransactions: totalSalesCount,
      currency: 'PKR',
    };
  }

  async toggleTenantStatus(tenantId: string, status: 'ACTIVE' | 'SUSPENDED') {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });
  }

  // Business Owner Tenant Settings
  async getTenantDetails(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: true,
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async updateTenantSettings(tenantId: string, dto: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        ntn: dto.ntn,
        strn: dto.strn,
        address: dto.address,
        city: dto.city,
        logoUrl: dto.logoUrl,
        isFbrReady: dto.isFbrReady !== undefined ? Boolean(dto.isFbrReady) : undefined,
      },
    });
  }

  // User management under tenant
  async getTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTenantUser(tenantId: string, dto: any) {
    const passwordHash = await bcrypt.hash(dto.password || 'Cashier123!', 10);
    return this.prisma.user.create({
      data: {
        tenantId,
        branchId: dto.branchId || null,
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        phone: dto.phone,
        isActive: true,
      },
    });
  }
}
