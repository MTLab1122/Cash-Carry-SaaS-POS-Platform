import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PosService } from '../pos/pos.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    private posService: PosService,
  ) {}

  async syncBatch(params: {
    deviceId: string;
    tenantId: string;
    branchId: string;
    cashierId: string;
    transactions: any[];
  }) {
    const { deviceId, tenantId, branchId, cashierId, transactions } = params;

    const results = {
      total: transactions.length,
      synced: 0,
      failed: 0,
      errors: [] as { localId: string; error: string }[],
      syncedIds: [] as string[],
    };

    for (const tx of transactions) {
      try {
        if (tx.type === 'SALE' || tx.items) {
          await this.posService.processCheckout({
            ...tx,
            localId: tx.localId || tx.id,
            tenantId,
            branchId: tx.branchId || branchId,
            cashierId: tx.cashierId || cashierId,
          });

          results.synced++;
          results.syncedIds.push(tx.localId || tx.id);

          // Record in sync queue log
          await this.prisma.syncQueue.create({
            data: {
              deviceId,
              tenantId,
              entityType: 'SALE',
              localId: tx.localId || tx.id,
              status: 'SYNCED',
              payload: JSON.stringify(tx),
              syncedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        this.logger.error(`Sync error on localId ${tx.localId || tx.id}: ${err.message}`);
        results.failed++;
        results.errors.push({
          localId: tx.localId || tx.id,
          error: err.message,
        });

        await this.prisma.syncQueue.create({
          data: {
            deviceId,
            tenantId,
            entityType: 'SALE',
            localId: tx.localId || tx.id,
            status: 'FAILED',
            payload: JSON.stringify(tx),
            errorMessage: err.message,
          },
        });
      }
    }

    return results;
  }

  async getDesktopDataCache(tenantId: string, branchId: string) {
    // Returns full snapshot for desktop SQLite database to seed local offline cache
    const [products, categories, customers, registers] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId, isActive: true },
        include: {
          category: true,
          inventoryBalances: { where: { branchId } },
        },
      }),
      this.prisma.category.findMany({ where: { tenantId } }),
      this.prisma.customer.findMany({ where: { tenantId } }),
      this.prisma.cashRegister.findMany({ where: { branchId, isActive: true } }),
    ]);

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      retailPrice: p.retailPrice,
      purchasePrice: p.purchasePrice,
      taxRate: p.taxRate,
      unit: p.unit,
      categoryId: p.categoryId,
      isWeighted: p.isWeighted,
      currentStock: p.inventoryBalances.reduce((sum, b) => sum + b.currentStock, 0),
    }));

    return {
      timestamp: new Date().toISOString(),
      products: formattedProducts,
      categories,
      customers,
      registers,
    };
  }
}
