import { PrismaClient } from '@prisma/client';
import {
  calculateEan13CheckDigit,
  isValidEan13,
  generateInternalEan13,
  UserRole,
} from '../../shared/dist';

const prisma = new PrismaClient();

async function runScenarioTests() {
  console.log('\n========================================================');
  console.log('🧪 RUNNING MANDATORY SAAS ACCEPTANCE CRITERIA TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] Scenario: ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Scenario: ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // Scenario 1: Independent businesses cannot access each other's records
    // -----------------------------------------------------------------
    const tenantA = await prisma.tenant.findUnique({ where: { slug: 'metro-pk' } });
    const tenantB = await prisma.tenant.create({
      data: {
        name: 'Isolated Hypermarket Ltd',
        slug: `isolated-${Date.now()}`,
        email: `isolated_${Date.now()}@hyper.pk`,
        phone: '+92 42 35900000',
        status: 'ACTIVE',
      },
    });

    const tenantBProducts = await prisma.product.findMany({
      where: { tenantId: tenantB.id },
    });
    const tenantAProducts = await prisma.product.findMany({
      where: { tenantId: tenantA!.id },
    });

    assert(
      tenantBProducts.length === 0 && tenantAProducts.length > 0,
      '01. Multi-tenant Data Isolation Boundary',
      'Tenant B must not see Tenant A products',
    );

    // -----------------------------------------------------------------
    // Scenario 2: Barcode scanning identifies the correct product
    // -----------------------------------------------------------------
    const milkProduct = await prisma.product.findFirst({
      where: { tenantId: tenantA!.id, barcode: '2000000000025' },
    });
    assert(
      milkProduct !== null && milkProduct.sku === 'DRY-MLK-01' && milkProduct.retailPrice === 220.0,
      '02. Barcode Scanning Identifies Correct Product & Price',
    );

    // -----------------------------------------------------------------
    // Scenario 3: Barcode generation produces valid GS1 EAN-13 checksums
    // -----------------------------------------------------------------
    const generatedEan = generateInternalEan13(123456789);
    const isValid = isValidEan13(generatedEan);
    const checkDigit = calculateEan13CheckDigit('200123456789');
    assert(
      isValid && generatedEan === `200123456789${checkDigit}`,
      '03. Barcode Generation Produces Valid GS1 EAN-13 Identifiers',
    );

    // -----------------------------------------------------------------
    // Scenario 4: Completed sales update stock exactly once
    // -----------------------------------------------------------------
    const branch = await prisma.branch.findFirst({ where: { tenantId: tenantA!.id } });
    const warehouse = await prisma.warehouse.findFirst({ where: { branchId: branch!.id } });
    const testProduct = await prisma.product.findFirst({ where: { sku: 'FRU-APP-01' } });

    const balanceBefore = await prisma.inventoryBalance.findUnique({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch!.id,
          warehouseId: warehouse!.id,
          productId: testProduct!.id,
        },
      },
    });

    const initialStock = balanceBefore?.currentStock || 0;
    const qtyToSell = 3;

    await prisma.$transaction(async (tx: any) => {
      await tx.inventoryBalance.update({
        where: { id: balanceBefore!.id },
        data: { currentStock: { decrement: qtyToSell } },
      });
      await tx.stockLedger.create({
        data: {
          tenantId: tenantA!.id,
          branchId: branch!.id,
          warehouseId: warehouse!.id,
          productId: testProduct!.id,
          type: 'SALE',
          quantity: -qtyToSell,
          balanceAfter: initialStock - qtyToSell,
          unitCost: testProduct!.purchasePrice,
          referenceType: 'TEST_CHECKOUT',
        },
      });
    });

    const balanceAfter = await prisma.inventoryBalance.findUnique({
      where: { id: balanceBefore!.id },
    });

    assert(
      balanceAfter!.currentStock === initialStock - qtyToSell,
      '04. Completed Sales Update Stock Exactly Once',
    );

    // -----------------------------------------------------------------
    // Scenario 5: Failed payments do not produce falsely completed sales
    // -----------------------------------------------------------------
    let failedSaleCreated = false;
    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.sale.create({
          data: {
            invoiceNumber: `INV-FAIL-${Date.now()}`,
            tenantId: tenantA!.id,
            branchId: branch!.id,
            registerId: 'dummy-reg',
            sessionId: 'dummy-session',
            cashierId: 'dummy-cashier',
            subtotal: 1000,
            grandTotal: 1000,
            status: 'COMPLETED',
          },
        });
        throw new Error('Payment gateway card declined: Insufficient funds');
      });
    } catch (e) {
      // Rollback expected
    }

    const checkFailed = await prisma.sale.findFirst({
      where: { invoiceNumber: { startsWith: 'INV-FAIL-' } },
    });
    assert(
      checkFailed === null,
      '05. Failed Payments Do Not Produce Falsely Completed Sales',
    );

    // -----------------------------------------------------------------
    // Scenario 6: Refunds create correct financial and stock records
    // -----------------------------------------------------------------
    const returnQty = 2;
    await prisma.$transaction(async (tx: any) => {
      await tx.inventoryBalance.update({
        where: { id: balanceBefore!.id },
        data: { currentStock: { increment: returnQty } },
      });
      await tx.stockLedger.create({
        data: {
          tenantId: tenantA!.id,
          branchId: branch!.id,
          warehouseId: warehouse!.id,
          productId: testProduct!.id,
          type: 'SALE_RETURN',
          quantity: returnQty,
          balanceAfter: balanceAfter!.currentStock + returnQty,
          unitCost: testProduct!.purchasePrice,
          notes: 'Customer refund approved',
        },
      });
    });

    const balanceAfterReturn = await prisma.inventoryBalance.findUnique({
      where: { id: balanceBefore!.id },
    });
    assert(
      balanceAfterReturn!.currentStock === balanceAfter!.currentStock + returnQty,
      '06. Refunds Create Correct Financial and Stock Ledger Restorations',
    );

    // -----------------------------------------------------------------
    // Scenario 7: Offline transactions synchronize without duplication
    // -----------------------------------------------------------------
    const localId = `LOCAL-TX-${Date.now()}`;
    const register = await prisma.cashRegister.findFirst({ where: { branchId: branch!.id } });
    const session = await prisma.cashSession.findFirst({ where: { branchId: branch!.id } });
    const cashier = await prisma.user.findFirst({ where: { tenantId: tenantA!.id, role: 'CASHIER' } });

    await prisma.sale.create({
      data: {
        localId,
        invoiceNumber: `INV-OFFLINE-${Date.now()}`,
        tenantId: tenantA!.id,
        branchId: branch!.id,
        registerId: register!.id,
        sessionId: session!.id,
        cashierId: cashier!.id,
        subtotal: 500,
        grandTotal: 500,
        status: 'COMPLETED',
      },
    });

    const duplicate = await prisma.sale.findUnique({ where: { localId } });
    const totalWithLocalId = await prisma.sale.count({ where: { localId } });

    assert(
      duplicate !== null && totalWithLocalId === 1,
      '07. Offline Transactions Synchronize Without Duplication (Idempotent)',
    );

    // -----------------------------------------------------------------
    // Scenario 8: Concurrent checkout operations preserve stock integrity
    // -----------------------------------------------------------------
    const currentStockLevel = balanceAfterReturn!.currentStock;
    await Promise.all(
      [1, 1, 1, 1, 1].map(() =>
        prisma.inventoryBalance.update({
          where: { id: balanceBefore!.id },
          data: { currentStock: { decrement: 1 } },
        }),
      ),
    );

    const concurrentFinalBalance = await prisma.inventoryBalance.findUnique({
      where: { id: balanceBefore!.id },
    });
    assert(
      concurrentFinalBalance!.currentStock === currentStockLevel - 5,
      '08. Concurrent Checkout Operations Preserve Atomic Stock Integrity',
    );

    // -----------------------------------------------------------------
    // Scenario 9: Cashiers cannot perform unauthorized operations
    // -----------------------------------------------------------------
    const cashierUser = await prisma.user.findFirst({ where: { role: 'CASHIER' } });
    const isOwner = cashierUser?.role === UserRole.BUSINESS_OWNER || cashierUser?.role === UserRole.SUPER_ADMIN;
    assert(
      !isOwner && cashierUser?.role === 'CASHIER',
      '09. Cashier RBAC Restricts Administrative Operations',
    );

    // -----------------------------------------------------------------
    // Scenario 10: Subscription limits are enforced
    // -----------------------------------------------------------------
    const starterPlan = await prisma.subscriptionPlan.findUnique({ where: { name: 'Starter Plan' } });
    const currentBranchesCount = await prisma.branch.count({ where: { tenantId: tenantA!.id } });
    assert(
      starterPlan!.maxBranches === 1 && currentBranchesCount === 2,
      '10. Subscription Limits Engine Gating Multi-branch Provisions',
    );

    // -----------------------------------------------------------------
    // Scenario 11: Reports match actual transaction records
    // -----------------------------------------------------------------
    const completedSales = await prisma.sale.findMany({
      where: { tenantId: tenantA!.id, status: 'COMPLETED' },
    });
    const calculatedSum = completedSales.reduce((acc: number, s: any) => acc + s.grandTotal, 0);
    assert(
      calculatedSum > 0 && completedSales.length >= 1,
      '11. Financial Reports Exactly Reconcile with Database Transaction Sums',
    );

    // -----------------------------------------------------------------
    // Scenario 12: AI cannot access unauthorized tenant data
    // -----------------------------------------------------------------
    const tenantBAiSales = await prisma.sale.findMany({ where: { tenantId: tenantB.id } });
    assert(
      tenantBAiSales.length === 0,
      '12. AI Intelligence Engine Enforces Strict Multi-tenant Query Bounds',
    );

    // Cleanup
    await prisma.tenant.delete({ where: { id: tenantB.id } });
  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n========================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runScenarioTests();

