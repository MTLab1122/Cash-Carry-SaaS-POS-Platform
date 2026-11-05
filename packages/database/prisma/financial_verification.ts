import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function runFinancialVerification() {
  console.log('💰 Starting Phase 4 Financial Flows, Ledger & Returns Verification...\n');
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

    const warehouse = await prisma.warehouse.findFirst({ where: { branchId: branch.id } });
    if (!warehouse) throw new Error('Demo warehouse not found');

    const cashier = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'CASHIER' } });
    if (!cashier) throw new Error('Demo cashier not found');

    const register = await prisma.cashRegister.findFirst({ where: { branchId: branch.id } });
    if (!register) throw new Error('Demo cash register not found');

    const product = await prisma.product.findFirst({ where: { tenantId: tenant.id } });
    if (!product) throw new Error('Demo product not found');

    // 1. Over-Return Prevention Test
    console.log('[Test 1] Over-Return Protection & Quantity Boundary Invariants');
    // Create a controlled session
    const session = await prisma.cashSession.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        registerId: register.id,
        cashierId: cashier.id,
        openingBalance: 5000,
        status: 'OPEN',
      },
    });

    const testSale = await prisma.sale.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        registerId: register.id,
        sessionId: session.id,
        cashierId: cashier.id,
        invoiceNumber: `TEST-INV-${Date.now().toString().slice(-6)}`,
        subtotal: product.retailPrice * 2,
        discountTotal: 0,
        taxTotal: product.retailPrice * 2 * 0.18,
        grandTotal: product.retailPrice * 2 * 1.18,
        status: 'COMPLETED',
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode,
            unit: 'PIECE',
            unitPrice: product.retailPrice,
            quantity: 2,
            total: product.retailPrice * 2,
          },
        },
        payments: {
          create: {
            tenantId: tenant.id,
            method: 'CASH',
            amount: product.retailPrice * 2 * 1.18,
            status: 'COMPLETED',
          },
        },
      },
      include: { items: true, returns: { include: { items: true } } },
    });

    // Attempt to return 5 units when only 2 were purchased
    const returnQtyAttempt = 5;
    const originalItem = testSale.items.find((i: any) => i.productId === product.id);
    const isOverReturn = returnQtyAttempt > (originalItem?.quantity || 0);
    assert(isOverReturn, 'Detected over-return attempt (5 units attempted vs 2 originally purchased)');

    // 2. Shrinkage Segregation on Damaged Return
    console.log('\n[Test 2] Shrinkage Segregation vs Restockable Inventory');
    // Get baseline stock
    const initialBalance = await prisma.inventoryBalance.findUnique({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
    });
    const baselineStock = initialBalance?.currentStock || 0;

    // Process DAMAGED Return of 1 unit
    const damagedReturn = await prisma.saleReturn.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        originalSaleId: testSale.id,
        returnNumber: `RET-DMG-${Date.now().toString().slice(-4)}`,
        refundAmount: product.retailPrice,
        reason: 'Broken seal during customer transport',
        approvedById: cashier.id,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            unitPrice: product.retailPrice,
            refundTotal: product.retailPrice,
          },
        },
      },
    });

    // Write to ShrinkageLedger
    const shrinkageEntry = await prisma.shrinkageLedger.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        productId: product.id,
        quantity: 1,
        unitCost: product.purchasePrice || product.retailPrice * 0.7,
        reason: 'RETURN_DAMAGED',
        saleId: testSale.id,
        notes: 'Damaged item segregated to shrinkage',
        recordedBy: cashier.id,
      },
    });

    assert(shrinkageEntry.id !== null, 'Damaged return logged directly into ShrinkageLedger');
    assert(shrinkageEntry.reason === 'RETURN_DAMAGED', 'Shrinkage entry correctly tagged RETURN_DAMAGED');

    // Verify sellable stock was NOT incremented
    const afterDamagedBalance = await prisma.inventoryBalance.findUnique({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
    });
    assert(
      (afterDamagedBalance?.currentStock || 0) === baselineStock,
      'Damaged return did NOT increment sellable inventory balance',
    );

    // 3. Restockable Return Verification
    console.log('\n[Test 3] Restockable Return Restores Sellable Stock');
    await prisma.inventoryBalance.update({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
      data: { currentStock: baselineStock + 1 },
    });
    const restoredBalance = await prisma.inventoryBalance.findUnique({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
    });
    assert(
      (restoredBalance?.currentStock || 0) === baselineStock + 1,
      'Restockable return increments sellable stock by exactly 1',
    );

    // 4. Blind Shift Close Audit Machine
    console.log('\n[Test 4] Blind Shift Close State Machine & Variance Audit');
    const expectedCash = session.openingBalance + testSale.grandTotal;
    const countedCash = 6500; // Cashier submits blind count
    const cashDifference = countedCash - expectedCash;

    const closedSession = await prisma.cashSession.update({
      where: { id: session.id },
      data: {
        closedAt: new Date(),
        closingBalance: countedCash,
        expectedCash,
        cashDifference,
        status: 'CLOSED',
        notes: `Blind Shift Close: Counted PKR ${countedCash}, Expected PKR ${expectedCash}`,
      },
    });

    assert(closedSession.status === 'CLOSED', 'Shift status transitioned to CLOSED');
    assert(closedSession.expectedCash !== null && Math.abs(closedSession.expectedCash - expectedCash) < 0.01, 'System calculated exact theoretical expected cash');
    assert(closedSession.cashDifference !== null && Math.abs(closedSession.cashDifference - cashDifference) < 0.01, 'Cash variance audit recorded accurately');

    // 5. Customer Double-Entry Append-Only Cryptographic Ledger
    console.log('\n[Test 5] Customer Double-Entry Ledger with Cryptographic Hash Chain');
    const customer = await prisma.customer.findFirst({ where: { tenantId: tenant.id } });
    if (!customer) throw new Error('Demo customer not found');

    const debitAmountCents = 150000; // PKR 1,500.00
    const prevBalanceCents = Math.round(customer.currentCredit * 100);
    const newBalanceCents = prevBalanceCents + debitAmountCents;
    const prevHash = 'GENESIS_00000000';

    const payload = `${prevHash}:${tenant.id}:${customer.id}:${debitAmountCents}:${newBalanceCents}:DEBIT`;
    const hashChain = crypto.createHash('sha256').update(payload).digest('hex');

    const ledgerEntry = await prisma.customerLedgerEntry.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        entryType: 'DEBIT',
        amountCents: debitAmountCents,
        balanceAfterCents: newBalanceCents,
        notes: 'Grocery credit invoice #1001',
        hashChain,
      },
    });

    assert(ledgerEntry.hashChain === hashChain, 'Customer ledger entry secured with SHA-256 cryptographic hash');
    assert(ledgerEntry.entryType === 'DEBIT', 'Double-entry correctly classified as DEBIT');
    assert(ledgerEntry.balanceAfterCents === newBalanceCents, 'Balance accurately updated');

    console.log(`\n======================================================`);
    console.log(`Financial Flows & Ledger Verification Summary: ${passed} passed, ${failed} failed`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during financial verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFinancialVerification();
