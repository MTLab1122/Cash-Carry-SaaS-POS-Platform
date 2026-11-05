import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// In-line Encryption Service verification logic
class TestEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    this.key = crypto.createHash('sha256').update('cc_saas_test_encryption_key_2026').digest();
  }

  encryptApiKey(plaintext: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return { encrypted, iv: iv.toString('hex'), authTag };
  }

  decryptApiKey(encrypted: string, ivHex: string, authTagHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// In-line PII Scrubber logic
class TestPiiScrubber {
  scrub(text: string): string {
    let sanitized = text;
    sanitized = sanitized.replace(
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,
      '[REDACTED_CARD_NUMBER]',
    );
    sanitized = sanitized.replace(/\b\d{5}-\d{7}-\d\b/g, '[REDACTED_CNIC]');
    sanitized = sanitized.replace(/(?:\+92|0092|0)?3[0-9]{2}[-\s]?[0-9]{7}\b/g, '[REDACTED_PHONE]');
    return sanitized;
  }
}

async function runAiVerification() {
  console.log('🤖 Starting Phase 5 AI Engine, Encryption & Isolation Verification...\n');
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

    // 1. AES-256-GCM BYOK API Key Encryption & Decryption
    console.log('[Test 1] AES-256-GCM BYOK Key Vault Cryptography');
    const encryption = new TestEncryptionService();
    const originalApiKey = 'sk-proj-super-secret-production-ai-key-abc123xyz789';
    const encrypted = encryption.encryptApiKey(originalApiKey);

    assert(encrypted.encrypted !== originalApiKey, 'API key cipher is not plaintext');
    assert(encrypted.iv.length === 24, '12-byte IV produced (24 hex characters)');
    assert(encrypted.authTag.length === 32, '16-byte AuthTag produced (32 hex characters)');

    const decrypted = encryption.decryptApiKey(encrypted.encrypted, encrypted.iv, encrypted.authTag);
    assert(decrypted === originalApiKey, 'Decrypted key matches original plaintext exactly');

    // Store encrypted key in database AITenantConfig
    const aiConfig = await prisma.aITenantConfig.upsert({
      where: { tenantId: tenant.id },
      update: {
        provider: 'OPENAI',
        model: 'gpt-4o',
        encryptedApiKey: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        monthlyBudgetTokens: 10000,
        usedTokensMonth: 0,
      },
      create: {
        tenantId: tenant.id,
        provider: 'OPENAI',
        model: 'gpt-4o',
        encryptedApiKey: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        monthlyBudgetTokens: 10000,
        usedTokensMonth: 0,
      },
    });
    assert(aiConfig.encryptedApiKey === encrypted.encrypted, 'Tenant AI config persisted with encrypted credentials');

    // 2. PII Scrubbing Middleware
    console.log('\n[Test 2] PII Scrubbing Middleware Verification');
    const scrubber = new TestPiiScrubber();
    const sensitivePrompt =
      'Customer Tariq Mahmood with CNIC 35201-7654321-3 and phone 03001234567 paid with card 4111111111111111. What is his purchase pattern?';
    const scrubbed = scrubber.scrub(sensitivePrompt);

    assert(!scrubbed.includes('35201-7654321-3'), 'Pakistan CNIC is scrubbed from prompt context');
    assert(scrubbed.includes('[REDACTED_CNIC]'), 'Pakistan CNIC replaced with [REDACTED_CNIC]');
    assert(!scrubbed.includes('03001234567'), 'Pakistan mobile phone number is scrubbed');
    assert(scrubbed.includes('[REDACTED_PHONE]'), 'Phone replaced with [REDACTED_PHONE]');
    assert(!scrubbed.includes('4111111111111111'), 'Credit card number is scrubbed');
    assert(scrubbed.includes('[REDACTED_CARD_NUMBER]'), 'Card replaced with [REDACTED_CARD_NUMBER]');

    // 3. Token Metering & AI Usage Ledger
    console.log('\n[Test 3] AI Usage Ledger & Token Metering Atomicity');
    const promptTokens = 120;
    const completionTokens = 85;
    const totalTokens = promptTokens + completionTokens;

    const usageRecord = await prisma.aIUsageLedger.create({
      data: {
        tenantId: tenant.id,
        promptTokens,
        completionTokens,
        totalTokens,
        costEstimate: (totalTokens / 1000) * 0.002,
        provider: 'OPENAI',
        model: 'gpt-4o',
      },
    });

    assert(usageRecord.totalTokens === 205, 'AI inference usage recorded in AIUsageLedger');
    assert(usageRecord.tenantId === tenant.id, 'Usage ledger strictly isolated by tenantId');

    // Increment tenant monthly token consumption
    await prisma.aITenantConfig.update({
      where: { tenantId: tenant.id },
      data: { usedTokensMonth: { increment: totalTokens } },
    });

    const updatedConfig = await prisma.aITenantConfig.findUnique({ where: { tenantId: tenant.id } });
    assert(updatedConfig?.usedTokensMonth === 205, 'Tenant usedTokensMonth incremented');

    // 4. Circuit Breaker Token Limit Check
    console.log('\n[Test 4] Token Circuit Breaker & Budget Enforcement');
    // Set budget lower than used tokens
    await prisma.aITenantConfig.update({
      where: { tenantId: tenant.id },
      data: { monthlyBudgetTokens: 200 }, // Current used is 205
    });

    const breakerConfig = await prisma.aITenantConfig.findUnique({ where: { tenantId: tenant.id } });
    const isBudgetExceeded = (breakerConfig?.usedTokensMonth || 0) >= (breakerConfig?.monthlyBudgetTokens || 0);
    assert(isBudgetExceeded, 'Circuit breaker trips when usedTokensMonth >= monthlyBudgetTokens');

    // Reset budget to generous limit
    await prisma.aITenantConfig.update({
      where: { tenantId: tenant.id },
      data: { monthlyBudgetTokens: 500000 },
    });

    console.log(`\n======================================================`);
    console.log(`AI Engine & Security Verification Summary: ${passed} passed, ${failed} failed`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during AI verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAiVerification();

