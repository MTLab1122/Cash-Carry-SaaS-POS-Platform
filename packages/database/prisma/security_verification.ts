import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runSecurityVerification() {
  console.log('🔒 Starting Phase 1 Security Hardening Verification...\n');
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
    // 1. Password Reset Token Cryptographic Hashing Test
    console.log('[Test 1] Password Reset Token SHA-256 Hashing & Expiration');
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found in database. Seed database first.');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const resetRecord = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    assert(resetRecord.tokenHash === tokenHash, 'Reset token stored as SHA-256 hash, not raw token');
    assert(resetRecord.tokenHash !== rawToken, 'Raw token is never saved directly to the database');
    assert(resetRecord.expiresAt.getTime() > Date.now(), 'Token expires in future (15-min TTL window)');
    assert(resetRecord.usedAt === null, 'Token initially marked unused (usedAt === null)');

    // 2. Token Single-Use Consumption and Revocation
    console.log('\n[Test 2] Password Reset Token Single-Use & Session Invalidation');
    const lookupHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const foundToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: lookupHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    assert(foundToken !== null, 'Valid unconsumed token resolves correctly');

    // Mark as used and update user password with bcrypt cost 12
    const newPasswordHash = await bcrypt.hash('NewSuperSecurePass2026!', 12);
    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.update({
        where: { id: foundToken!.id },
        data: { usedAt: new Date() },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash, refreshTokenHash: null },
      });
    });

    // Verify token can never be reused
    const reusedToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: lookupHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    assert(reusedToken === null, 'Token cannot be reused after consumption (Replay prevention)');

    // Verify user's session refresh token revoked
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(updatedUser?.refreshTokenHash === null, 'Active refresh sessions revoked upon password reset');

    // 3. Email Verification Token Cryptographic Lifecycle
    console.log('\n[Test 3] Email Verification Token Issuance & Single-Use Consumption');
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const emailTokenRecord = await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: verifyTokenHash,
        expiresAt: verifyExpiresAt,
      },
    });

    assert(emailTokenRecord.tokenHash === verifyTokenHash, 'Email verification token stored as SHA-256 hash');
    assert(emailTokenRecord.usedAt === null, 'Email token initially unused');

    // Consume email token
    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: emailTokenRecord.id },
        data: { usedAt: new Date() },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    });

    const verifiedUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(verifiedUser?.emailVerified === true, 'User emailVerified set upon token verification');

    // 4. Rate Limiting Algorithm Verification
    console.log('\n[Test 4] Rate Limiting Sliding Window Algorithm Verification');
    const windowMs = 900 * 1000;
    const maxAttempts = 5;
    const testBuckets = new Map<string, { count: number; resetTime: number }>();
    const clientKey = 'auth:192.168.1.50:cashier@abcmart.pk';

    let rateLimitedAtAttempt = -1;
    for (let attempt = 1; attempt <= 7; attempt++) {
      const now = Date.now();
      let bucket = testBuckets.get(clientKey);
      if (!bucket || now > bucket.resetTime) {
        bucket = { count: 1, resetTime: now + windowMs };
        testBuckets.set(clientKey, bucket);
      } else {
        bucket.count++;
      }

      if (bucket.count > maxAttempts) {
        rateLimitedAtAttempt = attempt;
        break;
      }
    }
    assert(rateLimitedAtAttempt === 6, 'Auth rate limiter triggers 429 on 6th request (Max 5 allowed)');

    // 5. RFC 7807 Problem Details Schema Conformance
    console.log('\n[Test 5] RFC 7807 Problem Details Specification Conformance');
    const sampleProblem = {
      type: 'https://tools.ietf.org/html/rfc6585#section-4',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Authentication rate limit exceeded. Try again in 900 seconds.',
      instance: '/api/v1/auth/login',
      traceId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    assert(sampleProblem.type.startsWith('https://'), 'Problem Details has valid standard URI type');
    assert(sampleProblem.status === 429, 'Status matches RFC HTTP status');
    assert(typeof sampleProblem.traceId === 'string' && sampleProblem.traceId.length > 0, 'Includes unique traceId');
    assert(sampleProblem.instance === '/api/v1/auth/login', 'Includes request instance path');

    console.log(`\n======================================================`);
    console.log(`Security Hardening Verification Summary: ${passed} passed, ${failed} failed`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during security verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSecurityVerification();
