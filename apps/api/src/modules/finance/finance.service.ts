import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getExpenses(tenantId: string, branchId?: string) {
    return this.prisma.expense.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
      },
      include: { branch: true },
      orderBy: { date: 'desc' },
    });
  }

  async createExpense(params: {
    tenantId: string;
    branchId: string;
    title: string;
    category: string;
    amount: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    userId: string;
  }) {
    return this.prisma.expense.create({
      data: {
        tenantId: params.tenantId,
        branchId: params.branchId,
        title: params.title,
        category: params.category,
        amount: params.amount,
        paymentMethod: params.paymentMethod || 'CASH',
        reference: params.reference,
        notes: params.notes,
        createdById: params.userId,
      },
    });
  }

  async getProfitLossSummary(tenantId: string, branchId?: string) {
    // 1. Total Sales & Tax Collected
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    let totalRevenue = 0;
    let totalTax = 0;
    let totalDiscounts = 0;
    let costOfGoodsSold = 0;

    for (const s of sales) {
      totalRevenue += s.grandTotal;
      totalTax += s.taxTotal;
      totalDiscounts += s.discountTotal;
      for (const item of s.items) {
        costOfGoodsSold += item.quantity * (item.product?.purchasePrice || 0);
      }
    }

    // 2. Expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;

    // 3. Receivables & Payables
    const customers = await this.prisma.customer.findMany({ where: { tenantId } });
    const totalReceivables = customers.reduce((sum, c) => sum + c.currentCredit, 0);

    const suppliers = await this.prisma.supplier.findMany({ where: { tenantId } });
    const totalPayables = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

    return {
      totalRevenue,
      totalTax,
      totalDiscounts,
      costOfGoodsSold,
      grossProfit,
      totalExpenses,
      netProfit,
      totalReceivables,
      totalPayables,
      currency: 'PKR',
    };
  }
}

