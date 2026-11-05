import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api/v1';

async function main() {
  console.log('================================================================');
  console.log('  PRODUCT WORKFLOW, AI AUTO-FILL & CRUD AUDIT SUITE             ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. Authenticate as Business Owner (admin@abcmart.pk)
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@abcmart.pk', password: 'Admin123!' }),
  });
  const loginData: any = await loginRes.json();
  const token = loginData.accessToken;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  assert(loginRes.status === 201 && !!token, 'Business Owner authentication succeeds with valid JWT');

  // 2. Test Category Listing
  const catRes = await fetch(`${API_BASE}/products/categories`, { headers: authHeaders });
  const categories: any = await catRes.json();
  assert(catRes.status === 200 && Array.isArray(categories) && categories.length > 0, 'Categories retrieved', `Found ${categories.length} categories`);

  // 3. Test Category Creation
  const newCatName = `Bakery & Pastries ${Date.now().toString().slice(-4)}`;
  const createCatRes = await fetch(`${API_BASE}/products/categories`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: newCatName, description: 'Freshly baked artisanal breads and snacks' }),
  });
  const createdCat: any = await createCatRes.json();
  assert(createCatRes.status === 201 && createdCat.name === newCatName, 'New category created successfully', createdCat.name);

  // 4. Test AI Product Suggestion Engine
  const aiSuggestRes = await fetch(`${API_BASE}/products/ai-suggest`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ prompt: "Olper's Full Cream Milk 1L" }),
  });
  const aiData: any = await aiSuggestRes.json();
  assert(
    aiSuggestRes.status === 201 &&
      aiData.brand === "Olper's" &&
      aiData.categoryName === 'Dairy & Bakery' &&
      aiData.unit === 'LITRE' &&
      aiData.retailPrice > aiData.purchasePrice,
    'AI auto-suggest produces accurate retail FMCG specifications',
    `SKU: ${aiData.sku}, Retail: PKR ${aiData.retailPrice}`,
  );

  // 5. Test Product Creation with ALL fields and initial stock
  const testSku1 = `TEST-PROD-${Date.now().toString().slice(-6)}`;
  const createProdRes1 = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: "Olper's Full Cream Milk 1 Litre",
      sku: testSku1,
      barcode: aiData.barcode,
      categoryId: aiData.categoryId || categories[0].id,
      brand: "Olper's",
      unit: 'LITRE',
      purchasePrice: 245.0,
      retailPrice: 275.0,
      wholesalePrice: 260.0,
      taxRate: 18.0,
      minStockLevel: 20,
      initialStock: 100,
      description: 'Premium homogenized whole milk Tetra Pak carton',
      isWeighted: false,
    }),
  });
  const prod1: any = await createProdRes1.json();
  assert(
    createProdRes1.status === 201 && prod1.sku === testSku1 && prod1.currentStock === 100,
    'Product created with 100 units initial stock',
    `ID: ${prod1.id}, Status: ${createProdRes1.status}`,
  );

  // 6. Verify Opening Stock Ledger in Database
  const ledgerEntry = await prisma.stockLedger.findFirst({
    where: { productId: prod1.id, type: 'OPENING_STOCK' },
  });
  assert(
    ledgerEntry !== null && ledgerEntry.quantity === 100 && ledgerEntry.balanceAfter === 100,
    'Opening stock ledger entry persisted atomically in database',
    `Quantity: ${ledgerEntry?.quantity}`,
  );

  // 7. Test Product Creation with DEFENSIVE DEFAULTS (omitted branchId, omitted categoryId, omitted barcode)
  const testSku2 = `AUTO-BAR-${Date.now().toString().slice(-6)}`;
  const createProdRes2 = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'National Salt Iodized 800g',
      sku: testSku2,
      purchasePrice: 65,
      retailPrice: 80,
      initialStock: 40,
    }),
  });
  const prod2: any = await createProdRes2.json();
  assert(
    createProdRes2.status === 201 &&
      !!prod2.barcode &&
      prod2.barcode.length === 13 &&
      !!prod2.categoryId,
    'Product created without category/branch/barcode resolves defaults automatically',
    `Auto Barcode: ${prod2.barcode}, Category: ${prod2.category?.name}`,
  );

  // 8. Test Duplicate SKU Rejection (HTTP 400 with meaningful error)
  const dupSkuRes = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Duplicate SKU Test Item',
      sku: testSku1, // Existing SKU
      purchasePrice: 100,
      retailPrice: 120,
    }),
  });
  const dupSkuData: any = await dupSkuRes.json();
  const skuMsg = dupSkuData.detail || dupSkuData.message || JSON.stringify(dupSkuData);
  assert(
    dupSkuRes.status === 400 && skuMsg.includes(`SKU '${testSku1}' already exists`),
    'Duplicate SKU rejected with clean HTTP 400 validation error',
    skuMsg,
  );

  // 9. Test Duplicate Barcode Rejection (HTTP 400 with meaningful error)
  const dupBarcodeRes = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Duplicate Barcode Test Item',
      sku: `UNIQUE-SKU-${Date.now().toString().slice(-5)}`,
      barcode: aiData.barcode, // Existing Barcode
      purchasePrice: 100,
      retailPrice: 120,
    }),
  });
  const dupBarcodeData: any = await dupBarcodeRes.json();
  const barcodeMsg = dupBarcodeData.detail || dupBarcodeData.message || JSON.stringify(dupBarcodeData);
  assert(
    dupBarcodeRes.status === 400 && barcodeMsg.includes(`Barcode '${aiData.barcode}' already exists`),
    'Duplicate Barcode rejected with clean HTTP 400 validation error',
    barcodeMsg,
  );

  // 10. Test Product Updating (PUT /products/:id)
  const updateRes = await fetch(`${API_BASE}/products/${prod1.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      retailPrice: 280.0,
      minStockLevel: 25,
      name: "Olper's Full Cream Milk 1L (Updated)",
    }),
  });
  const updatedProd: any = await updateRes.json();
  assert(
    updateRes.status === 200 && updatedProd.retailPrice === 280 && updatedProd.minStockLevel === 25,
    'Product updated with new retail price PKR 280.00 and minStock 25',
    `Price: PKR ${updatedProd.retailPrice}`,
  );

  // 11. Test Barcode Lookup Endpoint
  const scanRes = await fetch(`${API_BASE}/products/scan/${aiData.barcode}`, {
    headers: authHeaders,
  });
  const scannedProd: any = await scanRes.json();
  assert(
    scanRes.status === 200 && scannedProd.id === prod1.id,
    'Instant barcode lookup resolves correct product record',
    `Scanned: ${scannedProd.name}`,
  );

  // 12. Test Soft Deactivation (DELETE /products/:id)
  const deleteRes = await fetch(`${API_BASE}/products/${prod2.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deletedProd: any = await deleteRes.json();
  assert(
    deleteRes.status === 200 && deletedProd.isActive === false,
    'Product soft deactivation succeeds (isActive set to false)',
    `ID: ${prod2.id}`,
  );

  // 13. Test Deactivated Product excluded from active listing
  const listRes = await fetch(`${API_BASE}/products?search=${testSku2}`, {
    headers: authHeaders,
  });
  const listData: any = await listRes.json();
  assert(
    listRes.status === 200 && listData.items.length === 0,
    'Deactivated product is correctly excluded from active inventory listing',
  );

  console.log('\n================================================================');
  console.log(`  PRODUCT AUDIT RESULT: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error('Fatal audit failure:', e);
  await prisma.$disconnect();
  process.exit(1);
});
