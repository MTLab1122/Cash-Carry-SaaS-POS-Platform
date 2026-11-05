import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

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
      include: {
        ledgerEntries: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByPhone(tenantId: string, phone: string) {
    return this.prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
      include: {
        ledgerEntries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
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
    return this.recordLedgerMutation({
      tenantId,
      customerId,
      entryType: 'CREDIT',
      amount,
      notes: notes || 'Customer credit balance repayment',
    });
  }

  async recordLedgerMutation(params: {
    tenantId: string;
    customerId: string;
    entryType: 'DEBIT' | 'CREDIT';
    amount: number;
    transactionId?: string;
    notes?: string;
  }) {
    const { tenantId, customerId, entryType, amount, transactionId, notes } = params;
    const amountCents = Math.round(amount * 100);

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (customer.tenantId !== tenantId) {
        throw new BadRequestException('Tenant isolation violation');
      }

      // Check credit limit on DEBIT (customer taking goods on credit)
      if (entryType === 'DEBIT' && customer.creditLimit > 0) {
        if (customer.currentCredit + amount > customer.creditLimit) {
          throw new BadRequestException(
            `Credit limit exceeded. Current: PKR ${customer.currentCredit}, Limit: PKR ${customer.creditLimit}, Attempted: PKR ${amount}`,
          );
        }
      }

      // Find the last ledger entry for hash chaining
      const lastEntry = await tx.customerLedgerEntry.findFirst({
        where: { tenantId, customerId },
        orderBy: { createdAt: 'desc' },
      });

      const prevHash = lastEntry?.hashChain || 'GENESIS_HASH_0000000000000000';
      const prevBalanceCents = lastEntry?.balanceAfterCents ?? Math.round(customer.currentCredit * 100);

      const balanceAfterCents =
        entryType === 'DEBIT'
          ? prevBalanceCents + amountCents
          : Math.max(0, prevBalanceCents - amountCents);

      const payload = `${prevHash}:${tenantId}:${customerId}:${amountCents}:${balanceAfterCents}:${entryType}:${Date.now()}`;
      const hashChain = crypto.createHash('sha256').update(payload).digest('hex');

      const entry = await tx.customerLedgerEntry.create({
        data: {
          tenantId,
          customerId,
          transactionId,
          entryType,
          amountCents,
          balanceAfterCents,
          notes,
          hashChain,
        },
      });

      // Update customer balance in PKR
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          currentCredit: balanceAfterCents / 100,
        },
      });

      return { entry, customer: updatedCustomer };
    });
  }

  async getLedgerHistory(tenantId: string, customerId: string, limit = 50) {
    return this.prisma.customerLedgerEntry.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
