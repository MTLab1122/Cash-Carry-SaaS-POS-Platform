import { UserRole, PermissionScope, ROLE_PERMISSIONS, hasPermission } from '@cash-carry/shared';

async function runRoutingVerification() {
  console.log('🧭 Starting Phase 2 Navigation, RBAC & Routing Verification...\n');
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

  // 1. Verify Granular Scopes Dictionary Exists and is Comprehensive
  console.log('[Test 1] Granular Scopes Dictionary Completeness');
  const requiredScopes = [
    'pos:operate',
    'pos:refund',
    'shift:reconcile',
    'ledger:write',
    'ai:configure',
    'admin:manage',
  ];
  for (const scope of requiredScopes) {
    assert(
      Object.values(PermissionScope).includes(scope as PermissionScope),
      `Scope "${scope}" defined in PermissionScope enum`,
    );
  }

  // 2. Verify Super Admin Full System Authority
  console.log('\n[Test 2] SaaS Super Admin Authority');
  assert(
    hasPermission(UserRole.SUPER_ADMIN, PermissionScope.ADMIN_MANAGE),
    'Super Admin has admin:manage scope',
  );
  assert(
    hasPermission(UserRole.SUPER_ADMIN, PermissionScope.AI_CONFIGURE),
    'Super Admin has ai:configure scope',
  );
  assert(
    hasPermission(UserRole.SUPER_ADMIN, PermissionScope.POS_OPERATE),
    'Super Admin has pos:operate scope',
  );

  // 3. Verify Cashier Scope Isolation
  console.log('\n[Test 3] Cashier Role Isolation (Least Privilege)');
  assert(
    hasPermission(UserRole.CASHIER, PermissionScope.POS_OPERATE),
    'Cashier has pos:operate permission',
  );
  assert(
    !hasPermission(UserRole.CASHIER, PermissionScope.ADMIN_MANAGE),
    'Cashier BLOCKED from admin:manage',
  );
  assert(
    !hasPermission(UserRole.CASHIER, PermissionScope.LEDGER_WRITE),
    'Cashier BLOCKED from ledger:write',
  );
  assert(
    !hasPermission(UserRole.CASHIER, PermissionScope.AI_CONFIGURE),
    'Cashier BLOCKED from ai:configure',
  );
  assert(
    !hasPermission(UserRole.CASHIER, PermissionScope.FINANCE_MANAGE),
    'Cashier BLOCKED from finance:manage',
  );

  // 4. Verify Auditor Read-Only Reporting Access
  console.log('\n[Test 4] Auditor Role Permissions');
  assert(
    hasPermission(UserRole.AUDITOR, PermissionScope.REPORTS_VIEW),
    'Auditor has reports:view permission',
  );
  assert(
    !hasPermission(UserRole.AUDITOR, PermissionScope.POS_OPERATE),
    'Auditor BLOCKED from pos:operate',
  );
  assert(
    !hasPermission(UserRole.AUDITOR, PermissionScope.LEDGER_WRITE),
    'Auditor BLOCKED from ledger:write (Read-only auditor integrity)',
  );

  // 5. Verify Branch Manager Operational Capabilities
  console.log('\n[Test 5] Branch Manager Scopes');
  assert(
    hasPermission(UserRole.BRANCH_MANAGER, PermissionScope.POS_OPERATE),
    'Branch Manager can operate POS',
  );
  assert(
    hasPermission(UserRole.BRANCH_MANAGER, PermissionScope.POS_REFUND),
    'Branch Manager can process refunds',
  );
  assert(
    hasPermission(UserRole.BRANCH_MANAGER, PermissionScope.SHIFT_RECONCILE),
    'Branch Manager can reconcile shifts',
  );
  assert(
    !hasPermission(UserRole.BRANCH_MANAGER, PermissionScope.ADMIN_MANAGE),
    'Branch Manager BLOCKED from SaaS super-admin management',
  );

  // 6. Navigation Matrix Verification Across All 9 Enterprise Roles
  console.log('\n[Test 6] Full Role-Based Navigation Matrix Verification');
  const roles = Object.values(UserRole);
  assert(roles.length === 9, 'All 9 enterprise roles defined and mapped');
  for (const role of roles) {
    const scopes = ROLE_PERMISSIONS[role];
    assert(Array.isArray(scopes), `Role ${role} has registered permission scope array`);
  }

  console.log(`\n======================================================`);
  console.log(`Routing & RBAC Verification Summary: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRoutingVerification();

