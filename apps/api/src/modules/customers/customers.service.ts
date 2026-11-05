import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { cnic: { contains: search } },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findByPhone(tenantId: string, phone: string) {
    return this.prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
  }

  async create(tenantId: string, dto: any) {
    const existing = await this.prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone: dto.phone } },
    });
    if (existing) {
      throw new BadRequestException('A customer with this phone number already exists');
    }

    return this.prisma.customer.create({
      data: {
        tenantId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        cnic: dto.cnic,
        address: dto.address,
        creditLimit: Number(dto.creditLimit) || 0,
        loyaltyPoints: Number(dto.loyaltyPoints) || 0,
      },
    });
  }

  async recordPayment(tenantId: string, customerId: string, amount: number, notes?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const newCredit = Math.max(0, customer.currentCredit - amount);
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { currentCredit: newCredit },
    });
  }
}
