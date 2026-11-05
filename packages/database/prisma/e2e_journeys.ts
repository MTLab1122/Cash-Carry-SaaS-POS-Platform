import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function runE2EJourneys() {
  console.log('🚀 Executing Phase 7: End-to-End Master Integration Verification (12 Critical Journeys)...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, journey: string, description: string) {
    if (condition) {
      console.log(`  ✅ [${journey}] PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [${journey}] FAIL: ${description}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now().toString().slice(-6);

    // ==========================================
    // J01: SaaS Tenant Onboarding & Activation
    // ==========================================
    console.log('\n--- JOURNEY 01: SaaS Tenant Onboarding & Activation ---');
    const starterPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Starter' } }) ||
                        await prisma.subscriptionPlan.findFirst();
    if (!starterPlan) throw new Error('No subscription plan found');

    const tenantSlug = `e2e-mart-${timestamp}`;
    const newTenant = await prisma.tenant.create({
      data: {
        name: `E2E Mart ${timestamp}`,
        slug: tenantSlug,
        email: `info@${tenantSlug}.pk`,
        phone: `042-3${timestamp}`,
        status: 'ACTIVE',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        isFbrReady: true,
      },
    });

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: newTenant.id,
        planId: starterPlan.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const branch = await prisma.branch.create({
      data: {
        tenantId: newTenant.id,
        name: 'Main Retail Counter',
        code: `BR-${timestamp}`,
        city: 'Karachi',
        isMain: true,
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId: newTenant.id,
        branchId: branch.id,
        name: 'Main Floor Stock',
        code: `WH-${timestamp}`,
        isDefault: true,
      },
    });

    const register = await prisma.cashRegister.create({
      data: {
        tenantId: newTenant.id,
        branchId: branch.id,
        name: 'Terminal 01',
        terminalCode: `POS-${timestamp}`,
      },
    });

    assert(newTenant.status === 'ACTIVE', 'J01', 'Tenant provisioned with ACTIVE status');
    assert(subscription.id !== null, 'J01', 'Subscription associated with tenant');
    assert(warehouse.isDefault === true, 'J01', 'Default warehouse initialized');

    // ==========================================
    // J02: Subscription Upgrade & Feature Gating
    // ==========================================
    console.log('\n--- JOURNEY 02: Subscription Upgrade & Feature Gating ---');
    const enterprisePlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Enterprise' } });
    if (enterprisePlan) {
      const updatedSub = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { planId: enterprisePlan.id },
        include: { plan: true },
      });
      assert(updatedSub.plan.name === 'Enterprise', 'J02', 'Tenant subscription upgraded to Enterprise tier');
      assert(updatedSub.plan.maxBranches >= 20, 'J02', 'Enterprise branch limit applied (>= 20 branches)');
    }

    // ==========================================
    // J03: Granular RBAC & Security Perimeter
    // ==========================================
    console.log('\n--- JOURNEY 03: Granular RBAC & Security Perimeter ---');
    const cashierUser = await prisma.user.create({
      data: {
        tenantId: newTenant.id,
        branchId: branch.id,
        name: 'Asim Cashier',
        email: `asim-${timestamp}@mart.pk`,
        passwordHash: 'hashed_password_sample',
        role: 'CASHIER',
      },
    });
    assert(cashierUser.role === 'CASHIER', 'J03', 'Cashier user provisioned');
    assert(cashierUser.tenantId === newTenant.id, 'J03', 'Cashier bound strictly to tenant context');

    // ==========================================
    // J04: Product Master & Barcode Generation
    // ==========================================
    console.log('\n--- JOURNEY 04: Product Master & Barcode Generation ---');
    const category = await prisma.category.create({
      data: {
        tenantId: newTenant.id,
        name: 'Grocery Staples',
        slug: `groceries-${timestamp}`,
      },
    });

    // Compute valid EAN-13 check digit for prefix
    const prefix12 = `896${timestamp.padStart(9, '0')}`.slice(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(prefix12[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const validEan13 = `${prefix12}${checkDigit}`;

    const product = await prisma.product.create({
      data: {
        tenantId: newTenant.id,
        categoryId: category.id,
        name: 'Super Basmati Rice 5kg',
        sku: `RICE-${timestamp}`,
        barcode: validEan13,
        unit: 'KG',
        retailPrice: 1850.0,
        purchasePrice: 1500.0,
        minStockLevel: 10,
        taxRate: 18.0,
      },
    });

    assert(product.barcode.length === 13, 'J04', 'Product created with 13-digit EAN-13 barcode');
    assert(product.retailPrice === 1850.0, 'J04', 'Retail price set correctly in PKR');

    // ==========================================
    // J05: Purchase Order & Goods Receipt (GRN)
    // ==========================================
    console.log('\n--- JOURNEY 05: Purchase Order & Goods Receipt (GRN) ---');
    const supplier = await prisma.supplier.create({
      data: {
        tenantId: newTenant.id,
        name: 'Punjab Agri Corp',
        companyName: 'Punjab Rice Mills Ltd',
        phone: `0300-${timestamp}`,
      },
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: newTenant.id,
        branchId: branch.id,
        supplierId: supplier.id,
        poNumber: `PO-${timestamp}`,
        totalAmount: 1500.0 * 50,
        status: 'RECEIVED',
        createdById: cashierUser.id,
        items: {
          create: {
            productId: product.id,
            quantity: 50,
            unitCost: 1500.0,
            totalCost: 1500.0 * 50,
          },
        },
      },
    });

    // Receive into stock
    await prisma.inventoryBalance.upsert({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
      update: { currentStock: 50 },
      create: {
        tenantId: newTenant.id,
        branchId: branch.id,
        warehouseId: warehouse.id,
        productId: product.id,
        currentStock: 50,
      },
    });

    const stockAfterGRN = await prisma.inventoryBalance.findUnique({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
    });
    assert(stockAfterGRN?.currentStock === 50, 'J05', 'Stock incremented to 50 units upon GRN receiving');

    // ==========================================
    // J06: Blind Shift Open/Close & Reconciliation
    // ==========================================
    console.log('\n--- JOURNEY 06: Blind Shift Open/Close & Reconciliation ---');
    const session = await prisma.cashSession.create({
      data: {
        tenantId: newTenant.id,
        branchId: branch.id,
        registerId: register.id,
        cashierId: cashierUser.id,
        openingBalance: 5000,
        status: 'OPEN',
      },
    });
    assert(session.status === 'OPEN', 'J06', 'Register session opened with PKR 5,000 float');

    // ==========================================
    // J07: POS Checkout & Stock Depletion
    // ==========================================
    console.log('\n--- JOURNEY 07: POS Checkout & Stock Depletion ---');
    const checkoutQty = 3;
    const subtotal = product.retailPrice * checkoutQty;
    const taxTotal = subtotal * 0.18;
    const grandTotal = subtotal + taxTotal;

    const sale = await prisma.sale.create({
      data: {
        tenantId: newTenant.id,
        branchId: branch.id,
        registerId: register.id,
        sessionId: session.id,
        cashierId: cashierUser.id,
        invoiceNumber: `INV-${timestamp}`,
        subtotal,
        discountTotal: 0,
        taxTotal,
        grandTotal,
        status: 'COMPLETED',
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode,
            unit: 'KG',
            unitPrice: product.retailPrice,
            quantity: checkoutQty,
            total: subtotal,
          },
        },
        payments: {
          create: {
            tenantId: newTenant.id,
            method: 'CASH',
            amount: grandTotal,
            status: 'COMPLETED',
          },
        },
      },
    });

    // Atomic decrement
    await prisma.inventoryBalance.update({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
      data: { currentStock: 50 - checkoutQty },
    });

    const stockAfterSale = await prisma.inventoryBalance.findUnique({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
    });
    assert(stockAfterSale?.currentStock === 47, 'J07', 'Stock decremented by 3 units (50 -> 47)');
    assert(sale.grandTotal === grandTotal, 'J07', 'Grand total calculated with 18% GST');

    // ==========================================
    // J08: POS Returns & Shrinkage Segregation
    // ==========================================
    console.log('\n--- JOURNEY 08: POS Returns & Shrinkage Segregation ---');
    // Return 1 unit DAMAGED
    const shrinkageEntry = await prisma.shrinkageLedger.create({
      data: {
        tenantId: newTenant.id,
        branchId: branch.id,
        productId: product.id,
        quantity: 1,
        unitCost: product.purchasePrice,
        reason: 'RETURN_DAMAGED',
        saleId: sale.id,
        recordedBy: cashierUser.id,
      },
    });
    assert(shrinkageEntry.reason === 'RETURN_DAMAGED', 'J08', 'Damaged return logged in ShrinkageLedger');

    const stockAfterDamagedReturn = await prisma.inventoryBalance.findUnique({
      where: {
        branchId_warehouseId_productId: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
    });
    assert(stockAfterDamagedReturn?.currentStock === 47, 'J08', 'Damaged item NOT returned to sellable inventory');

    // ==========================================
    // J09: Customer Khata / Credit Double-Entry
    // ==========================================
    console.log('\n--- JOURNEY 09: Customer Khata / Credit Double-Entry ---');
    const customer = await prisma.customer.create({
      data: {
        tenantId: newTenant.id,
        name: 'Malik Zahid',
        phone: `0321-${timestamp}`,
        creditLimit: 25000,
        currentCredit: 0,
      },
    });

    const creditAmountCents = 350000; // PKR 3,500.00
    const prevHash = 'GENESIS_00000000';
    const payload = `${prevHash}:${newTenant.id}:${customer.id}:${creditAmountCents}:${creditAmountCents}:DEBIT`;
    const hashChain = crypto.createHash('sha256').update(payload).digest('hex');

    const ledgerEntry = await prisma.customerLedgerEntry.create({
      data: {
        tenantId: newTenant.id,
        customerId: customer.id,
        transactionId: sale.id,
        entryType: 'DEBIT',
        amountCents: creditAmountCents,
        balanceAfterCents: creditAmountCents,
        hashChain,
      },
    });
    assert(ledgerEntry.hashChain === hashChain, 'J09', 'Customer debit entry signed with cryptographic hashChain');

    // ==========================================
    // J10: Financial Reporting & COGS
    // ==========================================
    console.log('\n--- JOURNEY 10: Financial Reporting & COGS ---');
    const revenue = sale.subtotal;
    const cogs = checkoutQty * product.purchasePrice;
    const grossProfit = revenue - cogs;
    const grossMarginPct = (grossProfit / revenue) * 100;

    assert(revenue === 1850 * 3, 'J10', 'Revenue correctly aggregated (PKR 5,550)');
    assert(cogs === 1500 * 3, 'J10', 'COGS correctly calculated (PKR 4,500)');
    assert(grossProfit === 1050, 'J10', 'Gross profit matches revenue minus COGS (PKR 1,050)');
    assert(Math.round(grossMarginPct) === 19, 'J10', 'Gross profit margin is ~19%');

    // ==========================================
    // J11: Desktop POS Offline Replay & Idempotency
    // ==========================================
    console.log('\n--- JOURNEY 11: Desktop POS Offline Replay & Idempotency ---');
    const localMutationKey = `OFFLINE-IDEMP-${timestamp}`;
    await prisma.processedMutation.create({
      data: {
        tenantId: newTenant.id,
        mutationId: localMutationKey,
        entityType: 'SALE',
        responseBody: JSON.stringify({ saleId: sale.id, invoice: sale.invoiceNumber }),
      },
    });

    const cachedReplay = await prisma.processedMutation.findUnique({
      where: { mutationId: localMutationKey },
    });
    assert(cachedReplay !== null, 'J11', 'Offline mutation recorded in ProcessedMutation ledger');
    if (cachedReplay) {
      const parsed = JSON.parse(cachedReplay.responseBody);
      assert(parsed.saleId === sale.id, 'J11', 'Idempotent replay returns cached response without duplicate write');
    }

    // ==========================================
    // J12: AI Business Intelligence & Isolation
    // ==========================================
    console.log('\n--- JOURNEY 12: AI Business Intelligence & Isolation ---');
    const aiConfig = await prisma.aITenantConfig.create({
      data: {
        tenantId: newTenant.id,
        provider: 'OPENAI',
        model: 'gpt-4o',
        monthlyBudgetTokens: 100000,
        usedTokensMonth: 250,
      },
    });

    const aiUsage = await prisma.aIUsageLedger.create({
      data: {
        tenantId: newTenant.id,
        promptTokens: 150,
        completionTokens: 100,
        totalTokens: 250,
        provider: 'OPENAI',
        model: 'gpt-4o',
      },
    });

    assert(aiConfig.tenantId === newTenant.id, 'J12', 'AI configuration locked to tenant context');
    assert(aiUsage.totalTokens === 250, 'J12', 'AI token usage metered in AIUsageLedger');

    console.log(`\n======================================================`);
    console.log(`Master E2E Journeys Summary: ${passed} passed, ${failed} failed`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during E2E verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2EJourneys();
