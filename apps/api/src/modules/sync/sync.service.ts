import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PosService } from '../pos/pos.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    private posService: PosService,
  ) {}

  async handleIdempotentMutation(params: {
    tenantId: string;
    idempotencyKey: string;
    entityType: string;
    execute: () => Promise<any>;
  }) {
    const { tenantId, idempotencyKey, entityType, execute } = params;

    // 1. Check if mutation already processed
    const existing = await this.prisma.processedMutation.findUnique({
      where: { mutationId: idempotencyKey },
    });

    if (existing) {
      this.logger.log(`Idempotency hit: returning cached response for key ${idempotencyKey}`);
      return JSON.parse(existing.responseBody);
    }

    // 2. Execute mutation atomically
    const result = await execute();

    // 3. Persist mutation record
    await this.prisma.processedMutation.create({
      data: {
        tenantId,
        mutationId: idempotencyKey,
        entityType,
        responseBody: JSON.stringify(result),
      },
    });

    return result;
  }

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
      const localId = tx.localId || tx.id;
      try {
        if (tx.type === 'SALE' || tx.items) {
          await this.handleIdempotentMutation({
            tenantId,
            idempotencyKey: localId,
            entityType: 'SALE',
            execute: async () => {
              return this.posService.processCheckout({
                ...tx,
                localId,
                tenantId,
                branchId: tx.branchId || branchId,
                cashierId: tx.cashierId || cashierId,
              });
            },
          });

          results.synced++;
          results.syncedIds.push(localId);

          // Record in sync queue log
          await this.prisma.syncQueue.create({
            data: {
              deviceId,
              tenantId,
              entityType: 'SALE',
              localId,
              status: 'SYNCED',
              payload: JSON.stringify(tx),
              syncedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        this.logger.error(`Sync error on localId ${localId}: ${err.message}`);
        results.failed++;
        results.errors.push({
          localId,
          error: err.message,
        });

        await this.prisma.syncQueue.create({
          data: {
            deviceId,
            tenantId,
            entityType: 'SALE',
            localId,
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
      categoryName: p.category.name,
      retailPrice: p.retailPrice,
      purchasePrice: p.purchasePrice,
      unit: p.unit,
      currentStock: p.inventoryBalances[0]?.currentStock || 0,
      minStockLevel: p.minStockLevel,
    }));

    return {
      syncedAt: new Date().toISOString(),
      products: formattedProducts,
      categories,
      customers,
      registers,
    };
  }

  async reconcileNegativeStock(tenantId: string) {
    const negativeBalances = await this.prisma.inventoryBalance.findMany({
      where: {
        tenantId,
        currentStock: { lt: 0 },
      },
      include: {
        product: true,
        branch: true,
      },
    });

    const reconciliationAlerts = negativeBalances.map((b) => ({
      productId: b.productId,
      productName: b.product.name,
      sku: b.product.sku,
      branchId: b.branchId,
      branchName: b.branch.name,
      negativeStock: b.currentStock,
      status: 'AUDIT_SCHEDULED',
      message: `Negative stock variance detected (${b.currentStock} units). Physical count cycle required.`,
    }));

    return {
      reconciledAt: new Date().toISOString(),
      discrepancyCount: negativeBalances.length,
      alerts: reconciliationAlerts,
    };
  }
}
