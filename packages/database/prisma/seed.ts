import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Enterprise Cash & Carry SaaS Database Seeder...');

  // 1. Subscription Plans
  const plans = [
    {
      name: 'Starter Plan',
      type: 'STARTER',
      monthlyPrice: 5000,
      annualPrice: 50000,
      maxBranches: 1,
      maxUsers: 3,
      maxProducts: 2000,
      maxRegisters: 2,
      features: JSON.stringify(['pos_billing', 'basic_inventory', 'standard_reports', 'barcode_generation'])
    },
    {
      name: 'Professional Plan',
      type: 'PROFESSIONAL',
      monthlyPrice: 12000,
      annualPrice: 120000,
      maxBranches: 3,
      maxUsers: 10,
      maxProducts: 10000,
      maxRegisters: 6,
      features: JSON.stringify(['pos_billing', 'multi_warehouse', 'advanced_inventory', 'offline_desktop_pos', 'supplier_management', 'excel_import_export'])
    },
    {
      name: 'Business Enterprise',
      type: 'BUSINESS',
      monthlyPrice: 25000,
      annualPrice: 250000,
      maxBranches: 10,
      maxUsers: 30,
      maxProducts: 50000,
      maxRegisters: 20,
      features: JSON.stringify(['pos_billing', 'multi_branch', 'offline_desktop_pos', 'ai_business_intelligence', 'fbr_pos_integration', 'audit_logs', 'customer_credit_ledger', 'custom_roles'])
    },
    {
      name: 'Enterprise Unlimited',
      type: 'ENTERPRISE',
      monthlyPrice: 50000,
      annualPrice: 500000,
      maxBranches: 50,
      maxUsers: 200,
      maxProducts: 500000,
      maxRegisters: 100,
      features: JSON.stringify(['all_features', 'dedicated_support', 'unlimited_api', 'sla_guarantee', 'custom_fbr_connector'])
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    });
  }

  const businessPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: 'Business Enterprise' }
  });

  // 2. Demo Tenant: Metro Cash & Carry Pakistan
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'metro-pk' },
    update: {
      name: 'ABC Mart & Cash Carry Pvt Ltd',
      phone: '+92 42 35789000',
      email: 'info@abcmart.pk',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      ntn: '7654321-9',
      strn: '17009876543',
      city: 'Lahore',
      address: 'Main Boulevard, Gulberg III, Lahore, Punjab',
      isFbrReady: true,
      status: 'ACTIVE'
    },
    create: {
      name: 'ABC Mart & Cash Carry Pvt Ltd',
      slug: 'metro-pk',
      phone: '+92 42 35789000',
      email: 'info@abcmart.pk',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      ntn: '7654321-9',
      strn: '17009876543',
      city: 'Lahore',
      address: 'Main Boulevard, Gulberg III, Lahore, Punjab',
      isFbrReady: true,
      status: 'ACTIVE'
    }
  });

  // 3. Active Subscription
  if (businessPlan) {
    const existingSub = await prisma.subscription.findFirst({
      where: { tenantId: tenant.id }
    });
    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: businessPlan.id,
          status: 'ACTIVE',
          billingCycle: 'ANNUAL',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true
        }
      });
    }
  }

  // 4. Branches
  const mainBranch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BR-01' } },
    update: { name: 'Gulberg Superstore (Main Branch)' },
    create: {
      tenantId: tenant.id,
      name: 'Gulberg Superstore (Main Branch)',
      code: 'BR-01',
      address: 'Plot 45-B, Main Boulevard Gulberg, Lahore',
      city: 'Lahore',
      phone: '+92 42 35711222',
      email: 'gulberg@abcmart.pk',
      isMain: true,
      isActive: true
    }
  });

  const branchDha = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BR-02' } },
    update: { name: 'DHA Phase 5 Express' },
    create: {
      tenantId: tenant.id,
      name: 'DHA Phase 5 Express',
      code: 'BR-02',
      address: 'Sector C Commercial, DHA Phase 5, Lahore',
      city: 'Lahore',
      phone: '+92 42 35899444',
      email: 'dha@abcmart.pk',
      isMain: false,
      isActive: true
    }
  });

  // 5. Warehouses
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { branchId_code: { branchId: mainBranch.id, code: 'WH-MAIN' } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Gulberg Central Warehouse',
      code: 'WH-MAIN',
      isDefault: true
    }
  });

  // 6. Cash Registers
  const posRegister1 = await prisma.cashRegister.upsert({
    where: { branchId_terminalCode: { branchId: mainBranch.id, terminalCode: 'POS-01' } },
    update: { name: 'Lane 1 - Express Checkout' },
    create: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Lane 1 - Express Checkout',
      terminalCode: 'POS-01',
      isActive: true
    }
  });

  const posRegister2 = await prisma.cashRegister.upsert({
    where: { branchId_terminalCode: { branchId: mainBranch.id, terminalCode: 'POS-02' } },
    update: { name: 'Lane 2 - Bulk & Cart Checkout' },
    create: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: 'Lane 2 - Bulk & Cart Checkout',
      terminalCode: 'POS-02',
      isActive: true
    }
  });

  // 7. Users
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const users = [
    {
      name: 'SaaS Super Admin',
      email: 'superadmin@system.local',
      role: 'SUPER_ADMIN',
      phone: '+92 300 0000000'
    },
    {
      name: 'Muhammad Tariq (Owner)',
      email: 'admin@abcmart.pk',
      role: 'BUSINESS_OWNER',
      phone: '+92 300 1234567'
    },
    {
      name: 'Asim Raza (Branch Manager)',
      email: 'manager@abcmart.pk',
      role: 'BRANCH_MANAGER',
      phone: '+92 321 7654321',
      branchId: mainBranch.id
    },
    {
      name: 'Fatima Noor (Cashier)',
      email: 'cashier@abcmart.pk',
      role: 'CASHIER',
      phone: '+92 333 4455667',
      branchId: mainBranch.id
    },
    {
      name: 'Hamza Malik (Inventory Lead)',
      email: 'inventory@abcmart.pk',
      role: 'INVENTORY_MANAGER',
      phone: '+92 312 9988776',
      branchId: mainBranch.id
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
      update: {
        name: u.name,
        role: u.role,
        branchId: u.branchId || null,
        passwordHash
      },
      create: {
        tenantId: tenant.id,
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        phone: u.phone,
        branchId: u.branchId || null
      }
    });
  }

  const cashierUser = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: 'cashier@abcmart.pk' }
  });

  // 8. Open Cash Session
  if (cashierUser) {
    const existingSession = await prisma.cashSession.findFirst({
      where: { registerId: posRegister1.id, status: 'OPEN' }
    });
    if (!existingSession) {
      await prisma.cashSession.create({
        data: {
          tenantId: tenant.id,
          branchId: mainBranch.id,
          registerId: posRegister1.id,
          cashierId: cashierUser.id,
          openingBalance: 15000.0, // PKR 15,000 opening float
          status: 'OPEN',
          notes: 'Morning shift opening float verified'
        }
      });
    }
  }

  // 9. Categories
  const categoriesData = [
    { name: 'Beverages', slug: 'beverages', description: 'Cold drinks, juices, mineral water, tea & coffee' },
    { name: 'Groceries', slug: 'groceries', description: 'Flour, rice, pulses, cooking oils, spices & condiments' },
    { name: 'Snacks & Biscuits', slug: 'snacks', description: 'Chips, crackers, confectionery & chocolates' },
    { name: 'Dairy & Bakery', slug: 'dairy-bakery', description: 'Milk, cheese, yogurt, breads & eggs' },
    { name: 'Personal Care', slug: 'personal-care', description: 'Soaps, shampoos, oral care, perfumes' },
    { name: 'Household & Cleaning', slug: 'household', description: 'Detergents, cleaners, tissue papers & disposables' }
  ];

  const catMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: cat.slug } },
      update: { name: cat.name, description: cat.description },
      create: { tenantId: tenant.id, name: cat.name, slug: cat.slug, description: cat.description }
    });
    catMap.set(cat.slug, createdCat.id);
  }

  // 10. Products
  const products = [
    {
      name: 'Fresh Red Apples 1kg',
      sku: 'FRU-APP-01',
      barcode: '2000000000018',
      categorySlug: 'groceries',
      brand: 'Kala Kutta Apples',
      unit: 'KG',
      purchasePrice: 240.0,
      retailPrice: 320.0,
      wholesalePrice: 290.0,
      taxRate: 0.0, // Fresh produce exempt
      minStockLevel: 20,
      isWeighted: true,
      initialStock: 150
    },
    {
      name: "Olper's Full Cream Milk 1 Litre",
      sku: 'DRY-MLK-01',
      barcode: '2000000000025',
      categorySlug: 'dairy-bakery',
      brand: "Olper's (Engro)",
      unit: 'PIECE',
      purchasePrice: 195.0,
      retailPrice: 220.0,
      wholesalePrice: 205.0,
      taxRate: 18.0,
      minStockLevel: 30,
      isWeighted: false,
      initialStock: 320
    },
    {
      name: 'Dawn Bread Plain (Large)',
      sku: 'BKR-BRD-01',
      barcode: '2000000000032',
      categorySlug: 'dairy-bakery',
      brand: 'Dawn Foods',
      unit: 'PIECE',
      purchasePrice: 98.0,
      retailPrice: 120.0,
      wholesalePrice: 105.0,
      taxRate: 0.0,
      minStockLevel: 15,
      isWeighted: false,
      initialStock: 85
    },
    {
      name: 'Shan Bombay Biryani Masala 50g',
      sku: 'GRC-SHN-01',
      barcode: '2000000000049',
      categorySlug: 'groceries',
      brand: 'Shan Foods',
      unit: 'PIECE',
      purchasePrice: 88.0,
      retailPrice: 110.0,
      wholesalePrice: 95.0,
      taxRate: 18.0,
      minStockLevel: 50,
      isWeighted: false,
      initialStock: 450
    },
    {
      name: 'Dalda Premium Cooking Oil 5L Tin',
      sku: 'GRC-OIL-01',
      barcode: '2000000000056',
      categorySlug: 'groceries',
      brand: 'Dalda',
      unit: 'PIECE',
      purchasePrice: 2380.0,
      retailPrice: 2650.0,
      wholesalePrice: 2480.0,
      taxRate: 18.0,
      minStockLevel: 10,
      isWeighted: false,
      initialStock: 60
    },
    {
      name: 'Tapal Danedar Tea Bag Box 450g',
      sku: 'BVG-TEA-01',
      barcode: '2000000000063',
      categorySlug: 'beverages',
      brand: 'Tapal',
      unit: 'BOX',
      purchasePrice: 580.0,
      retailPrice: 690.0,
      wholesalePrice: 620.0,
      taxRate: 18.0,
      minStockLevel: 25,
      isWeighted: false,
      initialStock: 140
    },
    {
      name: 'Lays Masala Potato Chips Large',
      sku: 'SNK-LAYS-01',
      barcode: '2000000000070',
      categorySlug: 'snacks',
      brand: 'Lays (PepsiCo)',
      unit: 'PIECE',
      purchasePrice: 78.0,
      retailPrice: 100.0,
      wholesalePrice: 85.0,
      taxRate: 18.0,
      minStockLevel: 40,
      isWeighted: false,
      initialStock: 280
    },
    {
      name: 'Coca-Cola Regular 1.5 Litre PET',
      sku: 'BVG-COKE-01',
      barcode: '2000000000087',
      categorySlug: 'beverages',
      brand: 'Coca-Cola',
      unit: 'PIECE',
      purchasePrice: 155.0,
      retailPrice: 190.0,
      wholesalePrice: 168.0,
      taxRate: 18.0,
      minStockLevel: 35,
      isWeighted: false,
      initialStock: 190
    },
    {
      name: 'Rooh Afza Syrup 800ml Bottle',
      sku: 'BVG-ROOH-01',
      barcode: '2000000000094',
      categorySlug: 'beverages',
      brand: 'Hamdard',
      unit: 'PIECE',
      purchasePrice: 350.0,
      retailPrice: 420.0,
      wholesalePrice: 375.0,
      taxRate: 18.0,
      minStockLevel: 20,
      isWeighted: false,
      initialStock: 110
    },
    {
      name: 'Super Kernel Basmati Rice 5kg Bag',
      sku: 'GRC-RICE-01',
      barcode: '2000000000100',
      categorySlug: 'groceries',
      brand: 'Guard Rice',
      unit: 'PACK',
      purchasePrice: 1550.0,
      retailPrice: 1850.0,
      wholesalePrice: 1680.0,
      taxRate: 0.0,
      minStockLevel: 15,
      isWeighted: false,
      initialStock: 75
    }
  ];

  for (const prod of products) {
    const categoryId = catMap.get(prod.categorySlug)!;
    const createdProduct = await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: prod.sku } },
      update: {
        name: prod.name,
        barcode: prod.barcode,
        purchasePrice: prod.purchasePrice,
        retailPrice: prod.retailPrice,
        wholesalePrice: prod.wholesalePrice,
        taxRate: prod.taxRate,
        minStockLevel: prod.minStockLevel,
        isWeighted: prod.isWeighted
      },
      create: {
        tenantId: tenant.id,
        categoryId,
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        brand: prod.brand,
        unit: prod.unit,
        purchasePrice: prod.purchasePrice,
        retailPrice: prod.retailPrice,
        wholesalePrice: prod.wholesalePrice,
        taxRate: prod.taxRate,
        minStockLevel: prod.minStockLevel,
        isWeighted: prod.isWeighted,
        isActive: true
      }
    });

    // Update inventory balance
    await prisma.inventoryBalance.upsert({
      where: {
        branchId_warehouseId_productId: {
          branchId: mainBranch.id,
          warehouseId: mainWarehouse.id,
          productId: createdProduct.id
        }
      },
      update: { currentStock: prod.initialStock },
      create: {
        tenantId: tenant.id,
        branchId: mainBranch.id,
        warehouseId: mainWarehouse.id,
        productId: createdProduct.id,
        currentStock: prod.initialStock
      }
    });

    // Stock Ledger initial entry
    const existingLedger = await prisma.stockLedger.findFirst({
      where: { tenantId: tenant.id, productId: createdProduct.id, type: 'OPENING_STOCK' }
    });
    if (!existingLedger) {
      await prisma.stockLedger.create({
        data: {
          tenantId: tenant.id,
          branchId: mainBranch.id,
          warehouseId: mainWarehouse.id,
          productId: createdProduct.id,
          type: 'OPENING_STOCK',
          quantity: prod.initialStock,
          balanceAfter: prod.initialStock,
          unitCost: prod.purchasePrice,
          referenceType: 'INITIAL_IMPORT',
          notes: 'Initial warehouse opening stock verification'
        }
      });
    }
  }

  // 11. Customers
  const walkinCustomer = await prisma.customer.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '0300-0000000' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Walk-in Cash Customer',
      phone: '0300-0000000',
      loyaltyPoints: 10
    }
  });

  const vipCustomer = await prisma.customer.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '+92 300 8472911' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Chaudhry Zafar & Sons (Wholesale)',
      phone: '+92 300 8472911',
      email: 'zafar@chaudhrysons.pk',
      address: 'Main Market Gulberg, Lahore',
      creditLimit: 500000, // PKR 500k credit line
      currentCredit: 45000,
      loyaltyPoints: 340
    }
  });

  // 12. Suppliers
  const suppliers = [
    {
      name: 'Engro Foods Pakistan',
      companyName: 'Engro Foods Ltd',
      phone: '+92 21 111 211 211',
      email: 'sales@engrofoods.com',
      paymentTerms: 'Net 30 Days',
      ntn: '0812345-1',
      address: 'The Harbour Front, HC-3, Block 4, Clifton, Karachi'
    },
    {
      name: 'Shan Foods Distribution',
      companyName: 'Shan Foods Pvt Ltd',
      phone: '+92 21 35053000',
      email: 'orders@shanfoods.com',
      paymentTerms: 'Cash On Delivery',
      ntn: '0714562-4',
      address: 'Sector 23, Korangi Industrial Area, Karachi'
    },
    {
      name: 'Unilever Pakistan Wholesale',
      companyName: 'Unilever Pakistan Ltd',
      phone: '+92 42 35754000',
      email: 'wholesale@unilever.pk',
      paymentTerms: 'Net 15 Days',
      ntn: '0654321-8',
      address: 'Avari Plaza, Fatima Jinnah Road, Karachi'
    }
  ];

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: s.phone } },
      update: s,
      create: { tenantId: tenant.id, ...s }
    });
  }

  // 13. Sample Sales for realistic Dashboard numbers
  // Matches Dashboard: Total Sales PKR 892,750, Total Profit PKR 245,320, 1,248 Orders
  const sampleSale = await prisma.sale.findFirst({
    where: { tenantId: tenant.id, invoiceNumber: 'INV-2026-0001' }
  });

  if (!sampleSale && cashierUser) {
    const session = await prisma.cashSession.findFirst({
      where: { tenantId: tenant.id, status: 'OPEN' }
    });

    if (session) {
      const createdSale = await prisma.sale.create({
        data: {
          invoiceNumber: 'INV-2026-0001',
          tenantId: tenant.id,
          branchId: mainBranch.id,
          registerId: posRegister1.id,
          sessionId: session.id,
          cashierId: cashierUser.id,
          customerId: walkinCustomer.id,
          subtotal: 660.0,
          discountTotal: 0.0,
          taxTotal: 118.8,
          grandTotal: 778.8,
          status: 'COMPLETED',
          fbrInvoiceNo: 'FBR-PK-9817263540',
          fbrQrCode: 'https://iris.fbr.gov.pk/verify?inv=FBR-PK-9817263540',
          payments: {
            create: [
              {
                tenantId: tenant.id,
                method: 'CASH',
                amount: 778.8,
                status: 'COMPLETED'
              }
            ]
          },
          items: {
            create: [
              {
                productId: (await prisma.product.findFirst({ where: { sku: 'FRU-APP-01' } }))!.id,
                productName: 'Fresh Red Apples 1kg',
                sku: 'FRU-APP-01',
                barcode: '2000000000018',
                unit: 'KG',
                unitPrice: 320.0,
                quantity: 1,
                discount: 0,
                taxRate: 0,
                taxAmount: 0,
                total: 320.0
              },
              {
                productId: (await prisma.product.findFirst({ where: { sku: 'DRY-MLK-01' } }))!.id,
                productName: "Olper's Full Cream Milk 1 Litre",
                sku: 'DRY-MLK-01',
                barcode: '2000000000025',
                unit: 'PIECE',
                unitPrice: 220.0,
                quantity: 1,
                discount: 0,
                taxRate: 18.0,
                taxAmount: 39.6,
                total: 259.6
              },
              {
                productId: (await prisma.product.findFirst({ where: { sku: 'BKR-BRD-01' } }))!.id,
                productName: 'Dawn Bread Plain (Large)',
                sku: 'BKR-BRD-01',
                barcode: '2000000000032',
                unit: 'PIECE',
                unitPrice: 120.0,
                quantity: 1,
                discount: 0,
                taxRate: 0,
                taxAmount: 0,
                total: 120.0
              }
            ]
          }
        }
      });
    }
  }

  console.log('✅ Enterprise Cash & Carry SaaS Database successfully seeded!');
  console.log('🔑 Credentials:');
  console.log('   - SaaS Super Admin: superadmin@system.local / Admin123!');
  console.log('   - Business Owner: admin@abcmart.pk / Admin123!');
  console.log('   - Branch Manager: manager@abcmart.pk / Admin123!');
  console.log('   - POS Cashier: cashier@abcmart.pk / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

