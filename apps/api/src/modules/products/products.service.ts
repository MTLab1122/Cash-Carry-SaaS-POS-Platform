import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BarcodeService } from '../barcode/barcode.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private barcodeService: BarcodeService,
  ) {}

  async findAll(params: {
    tenantId: string;
    branchId?: string;
    categoryId?: string;
    search?: string;
    lowStockOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, branchId, categoryId, search, lowStockOnly, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { brand: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          inventoryBalances: branchId ? { where: { branchId } } : true,
          batches: true,
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Compute stock totals
    const formatted = items.map((product) => {
      const currentStock = product.inventoryBalances.reduce((sum, b) => sum + b.currentStock, 0);
      const isLowStock = currentStock <= product.minStockLevel;
      return {
        ...product,
        currentStock,
        isLowStock,
      };
    });

    if (lowStockOnly) {
      const filtered = formatted.filter((p) => p.isLowStock);
      return { items: filtered, total: filtered.length, page, limit };
    }

    return { items: formatted, total, page, limit };
  }

  async findByBarcodeOrSku(tenantId: string, query: string, branchId?: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        tenantId,
        isActive: true,
        OR: [{ barcode: query }, { sku: query }],
      },
      include: {
        category: true,
        inventoryBalances: branchId ? { where: { branchId } } : true,
        batches: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`No active product found with barcode or SKU: ${query}`);
    }

    const currentStock = product.inventoryBalances.reduce((sum, b) => sum + b.currentStock, 0);

    return {
      ...product,
      currentStock,
      isLowStock: currentStock <= product.minStockLevel,
    };
  }

  async findById(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        inventoryBalances: {
          include: { branch: true, warehouse: true },
        },
        batches: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const currentStock = product.inventoryBalances.reduce((sum, b) => sum + b.currentStock, 0);
    return { ...product, currentStock };
  }

  async create(tenantId: string, branchId: string, dto: any) {
    // Generate barcode if not provided
    let barcode = dto.barcode;
    if (!barcode) {
      const rand = Math.floor(Math.random() * 899999999) + 100000000;
      barcode = this.barcodeService.generateEan13(rand);
    }

    // Check SKU conflict
    const existingSku = await this.prisma.product.findUnique({
      where: { tenantId_sku: { tenantId, sku: dto.sku } },
    });
    if (existingSku) {
      throw new BadRequestException(`A product with SKU '${dto.sku}' already exists.`);
    }

    // Find default warehouse
    let warehouse = await this.prisma.warehouse.findFirst({
      where: { branchId, isDefault: true },
    });
    if (!warehouse) {
      warehouse = await this.prisma.warehouse.findFirst({ where: { branchId } });
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId,
          categoryId: dto.categoryId,
          name: dto.name,
          sku: dto.sku,
          barcode,
          description: dto.description,
          brand: dto.brand,
          unit: dto.unit || 'PIECE',
          purchasePrice: Number(dto.purchasePrice) || 0,
          retailPrice: Number(dto.retailPrice) || 0,
          wholesalePrice: dto.wholesalePrice ? Number(dto.wholesalePrice) : null,
          taxRate: dto.taxRate !== undefined ? Number(dto.taxRate) : 18.0,
          minStockLevel: Number(dto.minStockLevel) || 5,
          isWeighted: Boolean(dto.isWeighted),
          imageUrl: dto.imageUrl,
          isActive: true,
        },
      });

      const initialStock = Number(dto.initialStock) || 0;
      if (warehouse) {
        await tx.inventoryBalance.create({
          data: {
            tenantId,
            branchId,
            warehouseId: warehouse.id,
            productId: product.id,
            currentStock: initialStock,
          },
        });

        if (initialStock > 0) {
          await tx.stockLedger.create({
            data: {
              tenantId,
              branchId,
              warehouseId: warehouse.id,
              productId: product.id,
              type: 'OPENING_STOCK',
              quantity: initialStock,
              balanceAfter: initialStock,
              unitCost: Number(dto.purchasePrice) || 0,
              notes: 'Initial product creation opening stock',
            },
          });
        }
      }

      return product;
    });
  }

  async update(tenantId: string, id: string, dto: any) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? product.name,
        categoryId: dto.categoryId ?? product.categoryId,
        description: dto.description ?? product.description,
        brand: dto.brand ?? product.brand,
        unit: dto.unit ?? product.unit,
        purchasePrice: dto.purchasePrice !== undefined ? Number(dto.purchasePrice) : product.purchasePrice,
        retailPrice: dto.retailPrice !== undefined ? Number(dto.retailPrice) : product.retailPrice,
        wholesalePrice: dto.wholesalePrice !== undefined ? Number(dto.wholesalePrice) : product.wholesalePrice,
        taxRate: dto.taxRate !== undefined ? Number(dto.taxRate) : product.taxRate,
        minStockLevel: dto.minStockLevel !== undefined ? Number(dto.minStockLevel) : product.minStockLevel,
        isWeighted: dto.isWeighted !== undefined ? Boolean(dto.isWeighted) : product.isWeighted,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : product.isActive,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async bulkImport(tenantId: string, branchId: string, items: any[]) {
    let imported = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await this.create(tenantId, branchId, item);
        imported++;
      } catch (err: any) {
        errors.push(`Failed for '${item.name || item.sku}': ${err.message}`);
      }
    }

    return { imported, failed: errors.length, errors };
  }
}

