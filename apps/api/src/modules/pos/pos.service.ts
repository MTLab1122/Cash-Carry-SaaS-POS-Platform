import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

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

  // Blind Shift Close: Cashier submits counted cash without seeing system expected cash
  async closeSession(params: {
    sessionId: string;
    closingBalance: number;
    notes?: string;
    cashierId: string;
    countedCard?: number;
  }) {
    const { sessionId, closingBalance, notes, cashierId, countedCard = 0 } = params;

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

    if (session.status === 'CLOSED' || session.status === 'LOCKED') {
      return session;
    }

    // 1. Calculate actual system theoretical cash & card totals
    let totalCashSales = 0;
    let totalCardSales = 0;
    for (const sale of session.sales) {
      if (sale.status === 'CANCELLED') continue;
      for (const p of sale.payments) {
        if (p.method === 'CASH') {
          totalCashSales += p.amount;
        } else if (p.method === 'CARD') {
          totalCardSales += p.amount;
        }
      }
    }

    const expectedCash = session.openingBalance + totalCashSales;
    const cashDifference = closingBalance - expectedCash;
    const isVariance = Math.abs(cashDifference) > 0.01;

    const auditNote = `Blind Shift Close: Counted PKR ${closingBalance}, Expected PKR ${expectedCash}, Variance: ${cashDifference >= 0 ? '+' : ''}${cashDifference} PKR${notes ? ` | ${notes}` : ''}`;

    return this.prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        closedAt: new Date(),
        closingBalance,
        expectedCash,
        cashDifference,
        status: 'CLOSED',
        notes: auditNote,
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
      throw new BadRequestException('Cannot checkout: Register session is closed or invalid.');
    }

    // Determine default warehouse for the branch
    let warehouse = await this.prisma.warehouse.findFirst({
      where: { branchId: dto.branchId, isDefault: true },
    });
    if (!warehouse) {
      warehouse = await this.prisma.warehouse.findFirst({
        where: { branchId: dto.branchId },
      });
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    // Atomic Database Transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Sale Header
      const sale = await tx.sale.create({
        data: {
          localId: dto.localId,
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          registerId: dto.registerId,
          sessionId: dto.sessionId,
          cashierId: dto.cashierId,
          customerId: dto.customerId,
          invoiceNumber,
          subtotal: dto.subtotal,
          discountTotal: dto.discountTotal,
          taxTotal: dto.taxTotal,
          grandTotal: dto.grandTotal,
          status: 'COMPLETED',
          notes: dto.notes,
        },
      });

      // 2. Create Sale Items and Decrement Inventory
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
            taxRate: item.taxRate || 18,
            taxAmount: item.taxAmount || 0,
            total: item.total,
          },
        });

        // Atomic Stock Decrement
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

          const currentStock = balance ? balance.currentStock : 0;
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

          // Append-only Stock Ledger Entry
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

      // 3. Record Payments
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

        // 4. Double-entry Customer Ledger for Credit sales
        if (p.method === 'CREDIT' && dto.customerId) {
          const customer = await tx.customer.findUnique({
            where: { id: dto.customerId },
          });

          if (customer) {
            const amountCents = Math.round(p.amount * 100);
            const lastLedger = await tx.customerLedgerEntry.findFirst({
              where: { tenantId: dto.tenantId, customerId: dto.customerId },
              orderBy: { createdAt: 'desc' },
            });

            const prevHash = lastLedger?.hashChain || 'GENESIS_00000000';
            const prevBalanceCents = lastLedger?.balanceAfterCents ?? Math.round(customer.currentCredit * 100);
            const newBalanceCents = prevBalanceCents + amountCents;

            const payload = `${prevHash}:${dto.tenantId}:${dto.customerId}:${amountCents}:${newBalanceCents}:DEBIT:${Date.now()}`;
            const hashChain = crypto.createHash('sha256').update(payload).digest('hex');

            await tx.customerLedgerEntry.create({
              data: {
                tenantId: dto.tenantId,
                customerId: dto.customerId,
                transactionId: sale.id,
                entryType: 'DEBIT',
                amountCents,
                balanceAfterCents: newBalanceCents,
                notes: `POS Credit Purchase ${invoiceNumber}`,
                hashChain,
              },
            });

            await tx.customer.update({
              where: { id: dto.customerId },
              data: { currentCredit: newBalanceCents / 100 },
            });
          }
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

  // POS Returns Engine with Over-Return Prevention & Shrinkage Segregation
  async processReturn(params: {
    tenantId: string;
    branchId: string;
    saleId: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      disposition?: 'RESTOCKABLE' | 'DAMAGED';
      damageReason?: string;
    }[];
    refundAmount: number;
    reason: string;
    approvedById: string;
    supervisorPin?: string;
  }) {
    const { tenantId, branchId, saleId, items, refundAmount, reason, approvedById, supervisorPin } = params;

    const originalSale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        returns: {
          include: { items: true },
        },
      },
    });

    if (!originalSale) {
      throw new NotFoundException('Original sale invoice not found');
    }

    if (originalSale.tenantId !== tenantId) {
      throw new ForbiddenException('Tenant isolation violation');
    }

    // 1. Prevent Over-Returns: Check cumulative returned quantities against original quantities
    for (const returnItem of items) {
      const originalItem = originalSale.items.find((i) => i.productId === returnItem.productId);
      if (!originalItem) {
        throw new BadRequestException(
          `Product ${returnItem.productId} was not part of the original invoice.`,
        );
      }

      // Calculate previously returned quantity for this product
      let previouslyReturnedQty = 0;
      for (const priorReturn of originalSale.returns) {
        for (const priorItem of priorReturn.items) {
          if (priorItem.productId === returnItem.productId) {
            previouslyReturnedQty += priorItem.quantity;
          }
        }
      }

      const maxAllowed = originalItem.quantity - previouslyReturnedQty;
      if (returnItem.quantity > maxAllowed) {
        throw new BadRequestException(
          `Over-return violation for item ${originalItem.productName}: Attempted to return ${returnItem.quantity}, but only ${maxAllowed} remaining eligible from original sale of ${originalItem.quantity}.`,
        );
      }
    }

    // 2. Anomaly Scoring: If refund amount > 80% of ticket value, flag and require supervisor PIN
    const returnRatio = refundAmount / originalSale.grandTotal;
    const isAnomaly = returnRatio > 0.8;
    if (isAnomaly && !supervisorPin) {
      // In production, supervisor PIN or authorized manager role required
      const approver = await this.prisma.user.findUnique({ where: { id: approvedById } });
      const isManager = ['SUPER_ADMIN', 'BUSINESS_OWNER', 'BRANCH_MANAGER', 'GENERAL_MANAGER'].includes(
        approver?.role || '',
      );
      if (!isManager) {
        throw new ForbiddenException(
          'Return anomaly score > 0.85 (High value refund relative to ticket). Supervisor PIN or Manager approval required.',
        );
      }
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

        const isDamaged = item.disposition === 'DAMAGED';

        if (isDamaged) {
          // Segregate into ShrinkageLedger - DO NOT RESTORE SELLABLE INVENTORY
          await tx.shrinkageLedger.create({
            data: {
              tenantId,
              branchId,
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitPrice,
              reason: item.damageReason || 'RETURN_DAMAGED',
              saleId: originalSale.id,
              notes: `Refund ${returnNumber}: Item damaged/expired`,
              recordedBy: approvedById,
            },
          });
        } else {
          // RESTOCKABLE: Increment sellable inventory balance and log StockLedger SALE_RETURN
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
      }

      // Mark sale status
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
