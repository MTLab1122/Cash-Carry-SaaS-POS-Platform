import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      include: {
        warehouses: true,
        cashRegisters: true,
      },
      orderBy: { isMain: 'desc' },
    });
  }

  async create(tenantId: string, dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          tenantId,
          name: dto.name,
          code: dto.code,
          address: dto.address,
          city: dto.city || 'Lahore',
          phone: dto.phone,
          email: dto.email,
          isMain: false,
          isActive: true,
        },
      });

      // Default warehouse for new branch
      await tx.warehouse.create({
        data: {
          tenantId,
          branchId: branch.id,
          name: `${dto.name} Warehouse`,
          code: `${dto.code}-WH1`,
          isDefault: true,
        },
      });

      // Default Register for new branch
      await tx.cashRegister.create({
        data: {
          tenantId,
          branchId: branch.id,
          name: 'Counter 1',
          terminalCode: `${dto.code}-POS1`,
          isActive: true,
        },
      });

      return branch;
    });
  }

  async getRegisters(branchId: string) {
    return this.prisma.cashRegister.findMany({
      where: { branchId, isActive: true },
      include: {
        cashSessions: {
          where: { status: 'OPEN' },
          include: { cashier: true },
        },
      },
    });
  }

  async createRegister(tenantId: string, branchId: string, dto: { name: string; terminalCode: string }) {
    return this.prisma.cashRegister.create({
      data: {
        tenantId,
        branchId,
        name: dto.name,
        terminalCode: dto.terminalCode,
      },
    });
  }
}
