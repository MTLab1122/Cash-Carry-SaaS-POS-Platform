import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getBalances(tenantId: string, branchId?: string, warehouseId?: string) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;
    if (warehouseId) where.warehouseId = warehouseId;

    const balances = await this.prisma.inventoryBalance.findMany({
      where,
      include: {
        product: { include: { category: true } },
        branch: true,
        warehouse: true,
      },
      orderBy: { product: { name: 'asc' } },
    });

    return balances.map((b) => ({
      ...b,
      isLowStock: b.currentStock <= b.product.minStockLevel,
      stockValue: b.currentStock * b.product.purchasePrice,
      retailValue: b.currentStock * b.product.retailPrice,
    }));
  }

  async getLedger(params: {
    tenantId: string;
    branchId?: string;
    productId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, branchId, productId, type, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.stockLedger.findMany({
        where,
        include: {
          product: true,
          branch: true,
          warehouse: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockLedger.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async adjustStock(params: {
    tenantId: string;
    branchId: string;
    warehouseId: string;
    productId: string;
    type: 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUBTRACT' | 'DAMAGE' | 'EXPIRY';
    quantity: number;
    notes?: string;
    userId: string;
  }) {
    const { tenantId, branchId, warehouseId, productId, type, quantity, notes, userId } = params;

    if (quantity <= 0) {
      throw new BadRequestException('Adjustment quantity must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.inventoryBalance.findUnique({
        where: {
          branchId_warehouseId_productId: { branchId, warehouseId, productId },
        },
        include: { product: true },
      });

      if (!balance) {
        throw new NotFoundException('Inventory record not found for this product and warehouse');
      }

      const isSubtract = ['ADJUSTMENT_SUBTRACT', 'DAMAGE', 'EXPIRY'].includes(type);
      if (isSubtract && balance.currentStock < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Current stock is ${balance.currentStock}, cannot reduce by ${quantity}`,
        );
      }

      const newBalance = isSubtract ? balance.currentStock - quantity : balance.currentStock + quantity;

      // Update balance
      await tx.inventoryBalance.update({
        where: { id: balance.id },
        data: { currentStock: newBalance },
      });

      // Record in Stock Ledger
      const ledger = await tx.stockLedger.create({
        data: {
          tenantId,
          branchId,
          warehouseId,
          productId,
          type,
          quantity: isSubtract ? -quantity : quantity,
          balanceAfter: newBalance,
          unitCost: balance.product.purchasePrice,
          referenceType: 'MANUAL_ADJUSTMENT',
          notes,
          createdById: userId,
        },
      });

      return { balance: newBalance, ledger };
    });
  }

  async transferStock(params: {
    tenantId: string;
    fromBranchId: string;
    fromWarehouseId: string;
    toBranchId: string;
    toWarehouseId: string;
    productId: string;
    quantity: number;
    notes?: string;
    userId: string;
  }) {
    const {
      tenantId,
      fromBranchId,
      fromWarehouseId,
      toBranchId,
      toWarehouseId,
      productId,
      quantity,
      notes,
      userId,
    } = params;

    if (quantity <= 0) {
      throw new BadRequestException('Transfer quantity must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Check source balance
      const sourceBalance = await tx.inventoryBalance.findUnique({
        where: {
          branchId_warehouseId_productId: {
            branchId: fromBranchId,
            warehouseId: fromWarehouseId,
            productId,
          },
        },
        include: { product: true },
      });

      if (!sourceBalance || sourceBalance.currentStock < quantity) {
        throw new BadRequestException(
          `Insufficient source stock. Available: ${sourceBalance?.currentStock ?? 0}`,
        );
      }

      // Deduct from source
      const newSourceStock = sourceBalance.currentStock - quantity;
      await tx.inventoryBalance.update({
        where: { id: sourceBalance.id },
        data: { currentStock: newSourceStock },
      });

      await tx.stockLedger.create({
        data: {
          tenantId,
          branchId: fromBranchId,
          warehouseId: fromWarehouseId,
          productId,
          type: 'TRANSFER_OUT',
          quantity: -quantity,
          balanceAfter: newSourceStock,
          unitCost: sourceBalance.product.purchasePrice,
          referenceType: 'BRANCH_TRANSFER',
          notes: `Transfer to branch ${toBranchId}: ${notes || ''}`,
          createdById: userId,
        },
      });

      // 2. Add to destination balance
      const destBalance = await tx.inventoryBalance.upsert({
        where: {
          branchId_warehouseId_productId: {
            branchId: toBranchId,
            warehouseId: toWarehouseId,
            productId,
          },
        },
        update: {
          currentStock: { increment: quantity },
        },
        create: {
          tenantId,
          branchId: toBranchId,
          warehouseId: toWarehouseId,
          productId,
          currentStock: quantity,
        },
      });

      await tx.stockLedger.create({
        data: {
          tenantId,
          branchId: toBranchId,
          warehouseId: toWarehouseId,
          productId,
          type: 'TRANSFER_IN',
          quantity,
          balanceAfter: destBalance.currentStock + quantity,
          unitCost: sourceBalance.product.purchasePrice,
          referenceType: 'BRANCH_TRANSFER',
          notes: `Transfer from branch ${fromBranchId}: ${notes || ''}`,
          createdById: userId,
        },
      });

      return { success: true, transferred: quantity };
    });
  }

  async getValuationSummary(tenantId: string, branchId?: string) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;

    const balances = await this.prisma.inventoryBalance.findMany({
      where,
      include: { product: true },
    });

    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalItems = 0;
    let lowStockCount = 0;

    for (const b of balances) {
      const qty = b.currentStock;
      totalItems += qty;
      totalCostValue += qty * b.product.purchasePrice;
      totalRetailValue += qty * b.product.retailPrice;
      if (qty <= b.product.minStockLevel) {
        lowStockCount++;
      }
    }

    const potentialProfit = totalRetailValue - totalCostValue;

    return {
      totalItems,
      totalCostValue,
      totalRetailValue,
      potentialProfit,
      lowStockCount,
      currency: 'PKR',
    };
  }
}

