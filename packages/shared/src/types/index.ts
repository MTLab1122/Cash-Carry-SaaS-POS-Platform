import { 
  UserRole, 
  SubscriptionPlanType, 
  SubscriptionStatus, 
  PaymentMethod, 
  SaleStatus, 
  StockMovementType, 
  UnitOfMeasure, 
  ShiftStatus, 
  PurchaseStatus, 
  SyncStatus 
} from '../enums';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  ntn?: string;
  strn?: string;
  currency: string;
  timezone: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  country: string;
  logoUrl?: string;
  isFbrReady?: boolean;
}

export interface UserSession {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface ProductItem {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  barcode: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  brand?: string;
  unit: UnitOfMeasure;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  taxRate: number; // e.g. 18.0 for 18% standard GST
  minStockLevel: number;
  currentStock: number;
  imageUrl?: string;
  isActive: boolean;
  isWeighted?: boolean;
  expiryDate?: string;
  batchNumber?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  unit: UnitOfMeasure;
  unitPrice: number;
  quantity: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  batchNumber?: string;
}

export interface POSSalePayload {
  localId?: string; // Client offline transaction id (UUID)
  tenantId: string;
  branchId: string;
  registerId: string;
  sessionId: string;
  cashierId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  payments: {
    method: PaymentMethod;
    amount: number;
    reference?: string;
  }[];
  notes?: string;
  createdAt: string;
}

export interface CashRegisterShift {
  id: string;
  branchId: string;
  cashierId: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  closingBalance?: number;
  expectedCash?: number;
  cashDifference?: number;
  status: ShiftStatus;
  notes?: string;
}

export interface StockMovementPayload {
  tenantId: string;
  branchId: string;
  warehouseId?: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitCost: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export interface OfflineSyncItem {
  id: string;
  type: 'SALE' | 'REGISTER_EVENT' | 'CUSTOMER_PAYMENT' | 'STOCK_ADJUSTMENT';
  payload: any;
  createdAt: string;
  retryCount: number;
  status: SyncStatus;
  errorMessage?: string;
}

export interface AIAnalysisRequest {
  query: string;
  tenantId: string;
  branchId?: string;
  timeframe?: 'today' | 'this_week' | 'this_month' | 'last_month' | 'year_to_date';
}

export interface AIAnalysisResponse {
  answer: string;
  dataPoints?: Record<string, any>;
  suggestions?: string[];
  generatedAt: string;
}

