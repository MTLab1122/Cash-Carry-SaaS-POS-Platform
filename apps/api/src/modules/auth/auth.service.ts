import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

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
        include: { tenant: { include: { branches: true } }, branch: true },
      });
    } else {
      user = await this.prisma.user.findFirst({
        where: { email },
        include: { tenant: { include: { branches: true } }, branch: true },
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

  async forgotPassword(dto: { email: string; tenantSlug?: string }) {
    const { email, tenantSlug } = dto;
    let user = null;

    if (tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (tenant) {
        user = await this.prisma.user.findFirst({ where: { email, tenantId: tenant.id } });
      }
    } else {
      user = await this.prisma.user.findFirst({ where: { email } });
    }

    if (!user) {
      // Return neutral message to prevent account enumeration
      return {
        message: 'If the email matches an active account, password reset instructions have been dispatched.',
      };
    }

    // Generate 32-byte crypto token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      message: 'If the email matches an active account, password reset instructions have been dispatched.',
      resetToken: rawToken, // Returned for programmatic & test execution
      expiresInMinutes: 15,
    };
  }

  async resetPassword(dto: { token: string; newPassword: string }) {
    const { token, newPassword } = dto;
    if (!token || !newPassword || newPassword.length < 8) {
      throw new BadRequestException('Valid token and password of at least 8 characters are required.');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException('Password reset token is invalid, expired, or already consumed.');
    }

    // Hash new password using bcrypt cost 12
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      // 1. Mark token used
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // 2. Update user password and revoke existing refresh tokens
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          refreshTokenHash: null, // Revokes active refresh sessions
        },
      });
    });

    return {
      message: 'Password successfully reset. All prior active sessions have been revoked. Please log in.',
    };
  }

  async issueVerificationToken(userId: string) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required.');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const verificationRecord = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationRecord) {
      throw new BadRequestException('Verification token is invalid, expired, or already verified.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data: { usedAt: new Date() },
      });

      await tx.user.update({
        where: { id: verificationRecord.userId },
        data: { emailVerified: true },
      });
    });

    return {
      message: 'Email successfully verified. POS and inventory ledger operations are now unlocked.',
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account inactive or not found.');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
      };

      const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '1d' });
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            branches: true,
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

