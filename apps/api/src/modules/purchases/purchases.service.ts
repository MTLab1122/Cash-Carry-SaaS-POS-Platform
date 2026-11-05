import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  // Suppliers
  async getSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(tenantId: string, dto: any) {
    return this.prisma.supplier.create({
      data: {
        tenantId,
        name: dto.name,
        companyName: dto.companyName || dto.name,
        phone: dto.phone,
        email: dto.email,
        ntn: dto.ntn,
        strn: dto.strn,
        address: dto.address,
        paymentTerms: dto.paymentTerms,
      },
    });
  }

  // Purchase Orders
  async getPurchaseOrders(tenantId: string, branchId?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseOrder(params: {
    tenantId: string;
    branchId: string;
    supplierId: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    notes?: string;
    userId: string;
  }) {
    const { tenantId, branchId, supplierId, items, notes, userId } = params;

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        tenantId,
        branchId,
        supplierId,
        totalAmount,
        notes,
        createdById: userId,
        status: 'ORDERED',
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            totalCost: i.quantity * i.unitCost,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        supplier: true,
      },
    });
  }

  // Goods Receiving Note (GRN) with Stock Ledger update
  async receiveGoods(params: {
    tenantId: string;
    branchId: string;
    warehouseId?: string;
    purchaseOrderId?: string;
    supplierId: string;
    items: {
      productId: string;
      orderedQuantity: number;
      receivedQuantity: number;
      damagedQuantity?: number;
      unitCost: number;
      expiryDate?: string;
      batchNumber?: string;
    }[];
    notes?: string;
    userId: string;
  }) {
    const { tenantId, branchId, purchaseOrderId, supplierId, items, notes, userId } = params;

    let warehouse = null;
    if (params.warehouseId) {
      warehouse = await this.prisma.warehouse.findUnique({ where: { id: params.warehouseId } });
    }
    if (!warehouse) {
      warehouse = await this.prisma.warehouse.findFirst({
        where: { branchId, isDefault: true },
      });
    }
    if (!warehouse) {
      warehouse = await this.prisma.warehouse.findFirst({ where: { branchId } });
    }

    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
    const totalAmount = items.reduce((sum, item) => sum + item.receivedQuantity * item.unitCost, 0);

    return this.prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceipt.create({
        data: {
          grnNumber,
          purchaseOrderId: purchaseOrderId || null,
          tenantId,
          branchId,
          supplierId,
          totalAmount,
          notes,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              orderedQuantity: i.orderedQuantity,
              receivedQuantity: i.receivedQuantity,
              damagedQuantity: i.damagedQuantity || 0,
              unitCost: i.unitCost,
              totalCost: i.receivedQuantity * i.unitCost,
              expiryDate: i.expiryDate ? new Date(i.expiryDate) : null,
              batchNumber: i.batchNumber,
            })),
          },
        },
      });

      // Update Inventory Balances and Ledger
      for (const item of items) {
        if (warehouse && item.receivedQuantity > 0) {
          const balance = await tx.inventoryBalance.findUnique({
            where: {
              branchId_warehouseId_productId: {
                branchId,
                warehouseId: warehouse.id,
                productId: item.productId,
              },
            },
          });

          const newStock = (balance?.currentStock || 0) + item.receivedQuantity;

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
              currentStock: item.receivedQuantity,
            },
          });

          await tx.stockLedger.create({
            data: {
              tenantId,
              branchId,
              warehouseId: warehouse.id,
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.receivedQuantity,
              balanceAfter: newStock,
              unitCost: item.unitCost,
              referenceType: 'GOODS_RECEIPT',
              referenceId: grn.id,
              notes: `Received via ${grnNumber}`,
              createdById: userId,
            },
          });
        }
      }

      // Update PO status if linked
      if (purchaseOrderId) {
        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: { status: 'RECEIVED' },
        });
      }

      // Update supplier balance
      await tx.supplier.update({
        where: { id: supplierId },
        data: { currentBalance: { increment: totalAmount } },
      });

      return grn;
    });
  }
}
