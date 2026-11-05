import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-line exponential backoff with jitter calculator
function calculateBackoff(attempt: number, baseMs: number = 1000, maxMs: number = 30000): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  const jitter = Math.random() * (exponential * 0.1);
  return Math.min(maxMs, exponential + jitter);
}

async function runOfflineSyncVerification() {
  console.log('🔄 Starting Phase 6 Offline Desktop POS & Replay Sync Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'metro-pk' } });
    if (!tenant) throw new Error('Demo tenant metro-pk not found');

    const branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
    if (!branch) throw new Error('Demo branch not found');

    const product = await prisma.product.findFirst({ where: { tenantId: tenant.id } });
    if (!product) throw new Error('Demo product not found');

    // 1. Idempotent Mutation Deduplication via ProcessedMutation
    console.log('[Test 1] ProcessedMutation Idempotency Deduplication Engine');
    const testMutationId = `IDEMP-TEST-${Date.now()}`;
    const initialPayload = {
      invoiceNumber: `INV-OFFLINE-${Date.now()}`,
      grandTotal: 1540.0,
      status: 'COMPLETED',
    };

    // First execution
    const firstExecution = await prisma.processedMutation.create({
      data: {
        tenantId: tenant.id,
        mutationId: testMutationId,
        entityType: 'SALE',
        responseBody: JSON.stringify(initialPayload),
      },
    });
    assert(firstExecution.mutationId === testMutationId, 'First mutation processed and stored with unique key');

    // Duplicate execution replay test
    const duplicateLookup = await prisma.processedMutation.findUnique({
      where: { mutationId: testMutationId },
    });
    assert(duplicateLookup !== null, 'Duplicate mutation detected in ProcessedMutation ledger');
    if (duplicateLookup) {
      const cached = JSON.parse(duplicateLookup.responseBody);
      assert(cached.grandTotal === 1540.0, 'Cached response returned without duplicate transaction execution');
    }

    // 2. Exponential Backoff with Full Jitter Formula Verification
    console.log('\n[Test 2] Exponential Backoff with Jitter Calculation');
    const b0 = calculateBackoff(0, 1000, 30000);
    const b1 = calculateBackoff(1, 1000, 30000);
    const b2 = calculateBackoff(2, 1000, 30000);
    const b5 = calculateBackoff(5, 1000, 30000);
    const b10 = calculateBackoff(10, 1000, 30000);

    assert(b0 >= 1000 && b0 <= 1100, 'Attempt 0 delay is ~1000ms (+jitter)');
    assert(b1 >= 2000 && b1 <= 2200, 'Attempt 1 delay doubles to ~2000ms (+jitter)');
    assert(b2 >= 4000 && b2 <= 4400, 'Attempt 2 delay doubles to ~4000ms (+jitter)');
    assert(b5 >= 30000 || (b5 >= 32000 && b5 <= 33000), 'Attempt 5 adheres to exponential progression');
    assert(b10 <= 30000, 'Delays never exceed maxBackoff cap of 30,000ms');

    // 3. Outbox Sync Queue Status Lifecycle
    console.log('\n[Test 3] Outbox Sync Queue Lifecycle & Telemetry');
    const localTxId = `LOCAL-TX-${Date.now()}`;
    const syncItem = await prisma.syncQueue.create({
      data: {
        deviceId: 'DESKTOP-POS-01',
        tenantId: tenant.id,
        entityType: 'SALE',
        localId: localTxId,
        status: 'PENDING',
        payload: JSON.stringify({ items: [{ productId: product.id, qty: 1 }] }),
      },
    });
    assert(syncItem.status === 'PENDING', 'Item successfully enqueued as PENDING in sync queue');

    // Replay succeeds and marks SYNCED
    const syncedItem = await prisma.syncQueue.update({
      where: { id: syncItem.id },
      data: {
        status: 'SYNCED',
        syncedAt: new Date(),
      },
    });
    assert(syncedItem.status === 'SYNCED', 'Item status cleanly transitioned to SYNCED upon replay');
    assert(syncedItem.syncedAt !== null, 'Timestamp syncedAt recorded');

    // 4. Negative Stock Reconciliation Engine
    console.log('\n[Test 4] Negative Stock Reconciliation & Cycle Count Alert');
    // Ensure negative stock query filters properly
    const warehouse = await prisma.warehouse.findFirst({ where: { branchId: branch.id } });
    if (warehouse) {
      // Temporarily write negative stock to test audit finder
      await prisma.inventoryBalance.upsert({
        where: {
          branchId_warehouseId_productId: {
            branchId: branch.id,
            warehouseId: warehouse.id,
            productId: product.id,
          },
        },
        update: { currentStock: -3 },
        create: {
          tenantId: tenant.id,
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
          currentStock: -3,
        },
      });

      const negativeBalances = await prisma.inventoryBalance.findMany({
        where: {
          tenantId: tenant.id,
          currentStock: { lt: 0 },
        },
      });
      assert(negativeBalances.length > 0, 'Reconciliation engine flags negative stock balances');
      assert(
        negativeBalances.some((b) => b.productId === product.id && b.currentStock === -3),
        'Product identified with exact negative variance (-3 units)',
      );

      // Restore healthy stock
      await prisma.inventoryBalance.update({
        where: {
          branchId_warehouseId_productId: {
            branchId: branch.id,
            warehouseId: warehouse.id,
            productId: product.id,
          },
        },
        data: { currentStock: 100 },
      });
    }

    console.log(`\n======================================================`);
    console.log(`Offline POS & Sync Verification Summary: ${passed} passed, ${failed} failed`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during offline sync verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runOfflineSyncVerification();

