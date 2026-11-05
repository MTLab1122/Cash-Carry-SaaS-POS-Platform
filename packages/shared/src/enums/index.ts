export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  CASHIER = 'CASHIER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  PURCHASE_MANAGER = 'PURCHASE_MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  AUDITOR = 'AUDITOR'
}

export enum SubscriptionPlanType {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL'
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CREDIT = 'CREDIT'
}

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum StockMovementType {
  OPENING_STOCK = 'OPENING_STOCK',
  SALE = 'SALE',
  SALE_RETURN = 'SALE_RETURN',
  PURCHASE = 'PURCHASE',
  PURCHASE_RETURN = 'PURCHASE_RETURN',
  ADJUSTMENT_ADD = 'ADJUSTMENT_ADD',
  ADJUSTMENT_SUBTRACT = 'ADJUSTMENT_SUBTRACT',
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT'
}

export enum BarcodeType {
  EAN13 = 'EAN13',
  CODE128 = 'CODE128',
  QR = 'QR',
  CUSTOM_SKU = 'CUSTOM_SKU'
}

export enum UnitOfMeasure {
  PIECE = 'PIECE',
  KG = 'KG',
  GRAM = 'GRAM',
  LITRE = 'LITRE',
  ML = 'ML',
  CARTON = 'CARTON',
  BOX = 'BOX',
  PACK = 'PACK',
  DOZEN = 'DOZEN'
}

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum PurchaseStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT'
}

export enum PermissionScope {
  POS_OPERATE = 'pos:operate',
  POS_REFUND = 'pos:refund',
  SHIFT_RECONCILE = 'shift:reconcile',
  LEDGER_WRITE = 'ledger:write',
  AI_CONFIGURE = 'ai:configure',
  ADMIN_MANAGE = 'admin:manage',
  PRODUCTS_MANAGE = 'products:manage',
  INVENTORY_MANAGE = 'inventory:manage',
  PURCHASES_MANAGE = 'purchases:manage',
  REPORTS_VIEW = 'reports:view',
  FINANCE_MANAGE = 'finance:manage',
}

export const ROLE_PERMISSIONS: Record<UserRole, PermissionScope[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PermissionScope),
  [UserRole.BUSINESS_OWNER]: Object.values(PermissionScope),
  [UserRole.GENERAL_MANAGER]: [
    PermissionScope.POS_OPERATE,
    PermissionScope.POS_REFUND,
    PermissionScope.SHIFT_RECONCILE,
    PermissionScope.LEDGER_WRITE,
    PermissionScope.AI_CONFIGURE,
    PermissionScope.PRODUCTS_MANAGE,
    PermissionScope.INVENTORY_MANAGE,
    PermissionScope.PURCHASES_MANAGE,
    PermissionScope.REPORTS_VIEW,
    PermissionScope.FINANCE_MANAGE,
  ],
  [UserRole.BRANCH_MANAGER]: [
    PermissionScope.POS_OPERATE,
    PermissionScope.POS_REFUND,
    PermissionScope.SHIFT_RECONCILE,
    PermissionScope.PRODUCTS_MANAGE,
    PermissionScope.INVENTORY_MANAGE,
    PermissionScope.PURCHASES_MANAGE,
    PermissionScope.REPORTS_VIEW,
  ],
  [UserRole.CASHIER]: [
    PermissionScope.POS_OPERATE,
  ],
  [UserRole.INVENTORY_MANAGER]: [
    PermissionScope.PRODUCTS_MANAGE,
    PermissionScope.INVENTORY_MANAGE,
    PermissionScope.REPORTS_VIEW,
  ],
  [UserRole.PURCHASE_MANAGER]: [
    PermissionScope.PURCHASES_MANAGE,
    PermissionScope.PRODUCTS_MANAGE,
    PermissionScope.REPORTS_VIEW,
  ],
  [UserRole.ACCOUNTANT]: [
    PermissionScope.LEDGER_WRITE,
    PermissionScope.FINANCE_MANAGE,
    PermissionScope.REPORTS_VIEW,
  ],
  [UserRole.AUDITOR]: [
    PermissionScope.REPORTS_VIEW,
  ],
};

export function hasPermission(role: string, scope: PermissionScope): boolean {
  const permissions = ROLE_PERMISSIONS[role as UserRole] || [];
  return permissions.includes(scope);
}


