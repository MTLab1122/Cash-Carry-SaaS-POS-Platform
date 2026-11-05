import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: { email: string; password: string; tenantSlug?: string }) {
    const { email, password, tenantSlug } = loginDto;

    // Find user by email
    let user = null;
    if (tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });
      if (!tenant) {
        throw new UnauthorizedException('Tenant not found with slug: ' + tenantSlug);
      }
      user = await this.prisma.user.findFirst({
        where: { email, tenantId: tenant.id },
        include: { tenant: true, branch: true },
      });
    } else {
      user = await this.prisma.user.findFirst({
        where: { email },
        include: { tenant: true, branch: true },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    if (user.tenant && user.tenant.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your business account is suspended. Please contact platform support.');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Check open cash register session if user is Cashier
    let activeSession = null;
    if (user.role === 'CASHIER') {
      activeSession = await this.prisma.cashSession.findFirst({
        where: { cashierId: user.id, status: 'OPEN' },
        include: { register: true },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      branchId: user.branchId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        branch: user.branch,
        tenant: user.tenant,
        activeSession,
      },
    };
  }

  async registerTenant(dto: {
    businessName: string;
    slug: string;
    ownerName: string;
    email: string;
    password: string;
    phone: string;
    city?: string;
    country?: string;
    ntn?: string;
    strn?: string;
  }) {
    // Check if slug or email exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug.toLowerCase() },
    });
    if (existingTenant) {
      throw new BadRequestException('A business with this slug or domain already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create tenant in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.businessName,
          slug: dto.slug.toLowerCase(),
          email: dto.email,
          phone: dto.phone,
          city: dto.city || 'Lahore',
          country: dto.country || 'Pakistan',
          ntn: dto.ntn,
          strn: dto.strn,
          status: 'ACTIVE',
        },
      });

      // 2. Assign default Starter Plan or Trial
      const defaultPlan = await tx.subscriptionPlan.findFirst({
        where: { type: 'STARTER' },
      });
      if (defaultPlan) {
        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: defaultPlan.id,
            status: 'TRIAL',
            billingCycle: 'MONTHLY',
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
            nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // 3. Create Main Branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Branch - Head Office',
          code: 'MAIN-01',
          city: dto.city || 'Lahore',
          phone: dto.phone,
          isMain: true,
          isActive: true,
        },
      });

      // 4. Create Default Warehouse
      const warehouse = await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: 'Central Warehouse',
          code: 'WH-01',
          isDefault: true,
        },
      });

      // 5. Create Default POS Register
      await tx.cashRegister.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: 'Counter 1',
          terminalCode: 'POS-01',
          isActive: true,
        },
      });

      // 6. Create Owner User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: dto.ownerName,
          email: dto.email,
          passwordHash,
          role: 'BUSINESS_OWNER',
          phone: dto.phone,
          isActive: true,
        },
      });

      // 7. Seed initial default categories
      const standardCategories = ['Groceries', 'Beverages', 'Snacks', 'Personal Care', 'Dairy & Bakery'];
      for (const catName of standardCategories) {
        await tx.category.create({
          data: {
            tenantId: tenant.id,
            name: catName,
            slug: catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          },
        });
      }

      return { tenant, branch, user };
    });

    const payload = {
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
      tenantId: result.tenant.id,
      branchId: result.branch.id,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      message: 'Business tenant created successfully',
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.tenant.id,
        tenant: result.tenant,
        branch: result.branch,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            subscriptions: {
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        branch: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
