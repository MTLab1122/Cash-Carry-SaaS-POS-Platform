import { z } from 'zod';
import { PaymentMethod, UnitOfMeasure, UserRole } from '../enums';

export const registerTenantSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric lowercase with hyphens'),
  ownerName: z.string().min(2, 'Owner name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Valid contact phone number is required'),
  ntn: z.string().optional(),
  strn: z.string().optional(),
  city: z.string().default('Lahore'),
  country: z.string().default('Pakistan'),
  currency: z.string().default('PKR'),
  timezone: z.string().default('Asia/Karachi')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const createProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  barcode: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string(),
  brand: z.string().optional(),
  unit: z.nativeEnum(UnitOfMeasure).default(UnitOfMeasure.PIECE),
  purchasePrice: z.number().min(0),
  retailPrice: z.number().min(0),
  wholesalePrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).default(18.0), // Standard Pakistan GST default
  minStockLevel: z.number().min(0).default(5),
  initialStock: z.number().min(0).default(0),
  imageUrl: z.string().optional(),
  isWeighted: z.boolean().default(false),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional()
});

export const createSaleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  sku: z.string(),
  barcode: z.string(),
  unit: z.nativeEnum(UnitOfMeasure),
  unitPrice: z.number().min(0),
  quantity: z.number().positive(),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  total: z.number().min(0),
  batchNumber: z.string().optional()
});

export const createSaleSchema = z.object({
  localId: z.string().optional(),
  branchId: z.string(),
  registerId: z.string(),
  sessionId: z.string(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(createSaleItemSchema).min(1, 'Sale must contain at least 1 item'),
  subtotal: z.number().min(0),
  discountTotal: z.number().min(0).default(0),
  taxTotal: z.number().min(0).default(0),
  grandTotal: z.number().min(0),
  payments: z.array(z.object({
    method: z.nativeEnum(PaymentMethod),
    amount: z.number().positive(),
    reference: z.string().optional()
  })).min(1, 'At least one payment method is required'),
  notes: z.string().optional(),
  createdAt: z.string().optional()
});

export const openShiftSchema = z.object({
  branchId: z.string(),
  registerId: z.string(),
  openingBalance: z.number().min(0),
  notes: z.string().optional()
});

export const closeShiftSchema = z.object({
  closingBalance: z.number().min(0),
  notes: z.string().optional()
});
