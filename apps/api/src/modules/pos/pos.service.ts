import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  async openSession(params: {
    tenantId: string;
    branchId: string;
    registerId: string;
    cashierId: string;
    openingBalance: number;
    notes?: string;
  }) {
    const { tenantId, branchId, registerId, cashierId, openingBalance, notes } = params;

    // Check if register already has an OPEN session
    const active = await this.prisma.cashSession.findFirst({
      where: { registerId, status: 'OPEN' },
    });
    if (active) {
      if (active.cashierId === cashierId) {
        return active; // Cashier resuming active session
      }
      throw new BadRequestException('This register already has an active session opened by another cashier.');
    }

    return this.prisma.cashSession.create({
      data: {
        tenantId,
        branchId,
        registerId,
        cashierId,
        openingBalance,
        status: 'OPEN',
        notes: notes || 'Cash register session started',
      },
      include: { register: true },
    });
  }

  async closeSession(params: {
    sessionId: string;
    closingBalance: number;
    notes?: string;
    cashierId: string;
  }) {
    const { sessionId, closingBalance, notes } = params;

    const session = await this.prisma.cashSession.findUnique({
      where: { id: sessionId },
      include: {
        sales: {
          include: { payments: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Cash session not found');
    }

    if (session.status === 'CLOSED') {
      return session;
    }

    // Calculate total cash collected during shift
    let totalCashSales = 0;
    for (const sale of session.sales) {
      for (const p of sale.payments) {
        if (p.method === 'CASH') {
          totalCashSales += p.amount;
        }
      }
    }

    const expectedCash = session.openingBalance + totalCashSales;
    const cashDifference = closingBalance - expectedCash;

    return this.prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        closedAt: new Date(),
        closingBalance,
        expectedCash,
        cashDifference,
        status: 'CLOSED',
        notes: notes ? `${session.notes || ''} | ${notes}` : session.notes,
      },
    });
  }

  async getActiveSession(registerId: string) {
    return this.prisma.cashSession.findFirst({
      where: { registerId, status: 'OPEN' },
      include: { cashier: true, register: true },
    });
  }

  async processCheckout(dto: {
    localId?: string;
    tenantId: string;
    branchId: string;
    registerId: string;
    sessionId: string;
    cashierId: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    items: {
      productId: string;
      productName: string;
      sku: string;
      barcode: string;
      unit: string;
      unitPrice: number;
      quantity: number;
      discount?: number;
      taxRate?: number;
      taxAmount?: number;
      total: number;
    }[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    payments: {
      method: string;
      amount: number;
      reference?: string;
    }[];
    notes?: string;
  }) {
    // 1. Check idempotency for offline desktop sync
    if (dto.localId) {
      const existing = await this.prisma.sale.findUnique({
        where: { localId: dto.localId },
        include: { items: true, payments: true },
      });
      if (existing) {
        return existing; // Already processed idempotently
      }
    }

    // Verify session
    const session = await this.prisma.cashSession.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session || session.status !== 'OPEN') {
      throw new BadRequestException('Active open cashier session is required to perform sales');
    }

    // Find default warehouse for stock decrement
    let warehouse = await this.prisma.warehouse.findFirst({
      where: { branchId: dto.branchId, isDefault: true },
    });
    if (!warehouse) {
      warehouse = await this.prisma.warehouse.findFirst({
        where: { branchId: dto.branchId },
      });
    }

    // Generate unique invoice number
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 900) + 100;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}${rand}`;
    const fbrInvoiceNo = `FBR-PK-${timestamp}${rand}99`;
    const fbrQrCode = `https://iris.fbr.gov.pk/verify?inv=${fbrInvoiceNo}`;

    // Execute atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // Create Sale
      const sale = await tx.sale.create({
        data: {
          localId: dto.localId,
          invoiceNumber,
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          registerId: dto.registerId,
          sessionId: dto.sessionId,
          cashierId: dto.cashierId,
          customerId: dto.customerId || null,
          subtotal: dto.subtotal,
          discountTotal: dto.discountTotal || 0,
          taxTotal: dto.taxTotal || 0,
          grandTotal: dto.grandTotal,
          status: 'COMPLETED',
          fbrInvoiceNo,
          fbrQrCode,
          notes: dto.notes,
        },
      });

      // Create Sale Items & Update Stock
      for (const item of dto.items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            barcode: item.barcode,
            unit: item.unit,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
            taxAmount: item.taxAmount || 0,
            total: item.total,
          },
        });

        // Decrement stock balance if warehouse exists
        if (warehouse) {
          const balance = await tx.inventoryBalance.findUnique({
            where: {
              branchId_warehouseId_productId: {
                branchId: dto.branchId,
                warehouseId: warehouse.id,
                productId: item.productId,
              },
            },
          });

          const currentStock = balance?.currentStock || 0;
          const newStock = currentStock - item.quantity;

          await tx.inventoryBalance.upsert({
            where: {
              branchId_warehouseId_productId: {
                branchId: dto.branchId,
                warehouseId: warehouse.id,
                productId: item.productId,
              },
            },
            update: { currentStock: newStock },
            create: {
              tenantId: dto.tenantId,
              branchId: dto.branchId,
              warehouseId: warehouse.id,
              productId: item.productId,
              currentStock: -item.quantity,
            },
          });

          // Stock Ledger Entry
          await tx.stockLedger.create({
            data: {
              tenantId: dto.tenantId,
              branchId: dto.branchId,
              warehouseId: warehouse.id,
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              balanceAfter: newStock,
              unitCost: item.unitPrice,
              referenceType: 'SALE_INVOICE',
              referenceId: sale.id,
              notes: `POS Sale ${invoiceNumber}`,
              createdById: dto.cashierId,
            },
          });
        }
      }

      // Record Payments
      for (const p of dto.payments) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            tenantId: dto.tenantId,
            method: p.method,
            amount: p.amount,
            reference: p.reference,
            status: 'COMPLETED',
          },
        });

        // If credit payment and customer exists, increment customer credit
        if (p.method === 'CREDIT' && dto.customerId) {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { currentCredit: { increment: p.amount } },
          });
        }
      }

      // Add loyalty points if customer exists (1 point per 100 PKR)
      if (dto.customerId) {
        const earnedPoints = Math.floor(dto.grandTotal / 100);
        if (earnedPoints > 0) {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { loyaltyPoints: { increment: earnedPoints } },
          });
        }
      }

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          items: true,
          payments: true,
          customer: true,
          cashier: { select: { id: true, name: true, email: true } },
          branch: true,
        },
      });
    });
  }

  async processReturn(params: {
    tenantId: string;
    branchId: string;
    saleId: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    refundAmount: number;
    reason: string;
    approvedById: string;
  }) {
    const { tenantId, branchId, saleId, items, refundAmount, reason, approvedById } = params;

    const originalSale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!originalSale) {
      throw new NotFoundException('Original sale not found');
    }

    let warehouse = await this.prisma.warehouse.findFirst({
      where: { branchId, isDefault: true },
    });
    if (!warehouse) {
      warehouse = await this.prisma.warehouse.findFirst({ where: { branchId } });
    }

    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      const returnRecord = await tx.saleReturn.create({
        data: {
          originalSaleId: originalSale.id,
          tenantId,
          branchId,
          returnNumber,
          refundAmount,
          reason,
          approvedById,
        },
      });

      for (const item of items) {
        await tx.saleReturnItem.create({
          data: {
            returnId: returnRecord.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            refundTotal: item.quantity * item.unitPrice,
          },
        });

        // Restore stock
        if (warehouse) {
          const balance = await tx.inventoryBalance.findUnique({
            where: {
              branchId_warehouseId_productId: {
                branchId,
                warehouseId: warehouse.id,
                productId: item.productId,
              },
            },
          });

          const newStock = (balance?.currentStock || 0) + item.quantity;

          await tx.inventoryBalance.upsert({
            where: {
              branchId_warehouseId_productId: {
                branchId,
                warehouseId: warehouse.id,
                productId: item.productId,
              },
            },
            update: { currentStock: newStock },
            create: {
              tenantId,
              branchId,
              warehouseId: warehouse.id,
              productId: item.productId,
              currentStock: item.quantity,
            },
          });

          await tx.stockLedger.create({
            data: {
              tenantId,
              branchId,
              warehouseId: warehouse.id,
              productId: item.productId,
              type: 'SALE_RETURN',
              quantity: item.quantity,
              balanceAfter: newStock,
              unitCost: item.unitPrice,
              referenceType: 'SALE_RETURN',
              referenceId: returnRecord.id,
              notes: `Refund for ${originalSale.invoiceNumber}: ${reason}`,
              createdById: approvedById,
            },
          });
        }
      }

      await tx.sale.update({
        where: { id: originalSale.id },
        data: { status: 'REFUNDED' },
      });

      return returnRecord;
    });
  }

  async getRecentSales(params: {
    tenantId: string;
    branchId?: string;
    limit?: number;
  }) {
    const { tenantId, branchId, limit = 20 } = params;
    return this.prisma.sale.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        items: true,
        payments: true,
        customer: true,
        cashier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
