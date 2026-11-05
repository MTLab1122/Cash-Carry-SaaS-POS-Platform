import * as fs from 'fs';
import * as path from 'path';

async function runSeoVerification() {
  console.log('🌐 Starting Phase 3 Landing Page, SEO & AEO Verification...\n');
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

  const rootDir = path.resolve(__dirname, '../../..');

  // 1. Verify llms.txt and llms-full.txt
  console.log('[Test 1] AI Answer Engine Optimization (llms.txt)');
  const llmsPath = path.join(rootDir, 'apps/web/public/llms.txt');
  const llmsExists = fs.existsSync(llmsPath);
  assert(llmsExists, 'apps/web/public/llms.txt exists');
  if (llmsExists) {
    const content = fs.readFileSync(llmsPath, 'utf-8');
    assert(content.includes('Enterprise Cash & Carry Management'), 'llms.txt has platform branding');
    assert(content.includes('Multi-Tenant SaaS'), 'llms.txt documents multi-tenant capabilities');
    assert(content.includes('FBR Tier-1'), 'llms.txt documents Pakistan tax compliance');
  }

  const llmsFullPath = path.join(rootDir, 'apps/web/public/llms-full.txt');
  const llmsFullExists = fs.existsSync(llmsFullPath);
  assert(llmsFullExists, 'apps/web/public/llms-full.txt exists');
  if (llmsFullExists) {
    const content = fs.readFileSync(llmsFullPath, 'utf-8');
    assert(content.includes('Financial & Inventory Invariants'), 'llms-full.txt details financial invariants');
    assert(content.includes('Hardware & Offline POS Invariants'), 'llms-full.txt details hardware invariants');
  }

  // 2. Verify Dynamic Sitemap & Robots.txt
  console.log('\n[Test 2] Dynamic Sitemap & Robots Metadata Route');
  const sitemapPath = path.join(rootDir, 'apps/web/src/app/sitemap.ts');
  const robotsPath = path.join(rootDir, 'apps/web/src/app/robots.ts');
  assert(fs.existsSync(sitemapPath), 'apps/web/src/app/sitemap.ts exists');
  assert(fs.existsSync(robotsPath), 'apps/web/src/app/robots.ts exists');

  // 3. Verify Landing Page Implementation & Schema.org JSON-LD
  console.log('\n[Test 3] Landing Page & Schema.org JSON-LD Graph');
  const landingPath = path.join(rootDir, 'apps/web/src/app/landing/page.tsx');
  const landingExists = fs.existsSync(landingPath);
  assert(landingExists, 'apps/web/src/app/landing/page.tsx exists');
  if (landingExists) {
    const landingContent = fs.readFileSync(landingPath, 'utf-8');
    assert(landingContent.includes('application/ld+json'), 'Schema.org JSON-LD script injected');
    assert(landingContent.includes('SoftwareApplication'), 'Schema.org SoftwareApplication graph entity present');
    assert(landingContent.includes('Organization'), 'Schema.org Organization graph entity present');
    assert(landingContent.includes('FAQPage'), 'Schema.org FAQPage graph entity present');
    assert(landingContent.includes('monthlyShrinkageSavings'), 'Interactive Retail ROI Calculator present');
    assert(landingContent.includes('Built For Pakistan'), 'Pakistan localized badges present');
  }

  console.log(`\n======================================================`);
  console.log(`SEO, AEO & Landing Page Verification Summary: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSeoVerification();
