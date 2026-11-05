'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode,
  Printer,
  Download,
  Upload,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function ProductsPage() {
  const { currentBranch, tenant } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brand: '',
    unit: 'PIECE',
    purchasePrice: '',
    retailPrice: '',
    wholesalePrice: '',
    taxRate: '18',
    minStockLevel: '10',
    initialStock: '50',
    isWeighted: false,
  });

  // Label Print Modal
  const [labelProduct, setLabelProduct] = useState<any | null>(null);

  useEffect(() => {
    loadProducts();
  }, [currentBranch, selectedCategory, lowStockFilter]);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentBranch?.id) params.set('branchId', currentBranch.id);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (lowStockFilter) params.set('lowStockOnly', 'true');
      if (search) params.set('search', search);

      const res = await apiFetch(`/products?${params.toString()}`);
      setProducts(res.items || []);
    } catch (err) {
      console.warn('Failed loading products:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          ...newProduct,
          branchId: currentBranch?.id,
          categoryId: newProduct.categoryId || 'cat-groceries-1',
          purchasePrice: Number(newProduct.purchasePrice) || 0,
          retailPrice: Number(newProduct.retailPrice) || 0,
          wholesalePrice: Number(newProduct.wholesalePrice) || 0,
          taxRate: Number(newProduct.taxRate) || 0,
          minStockLevel: Number(newProduct.minStockLevel) || 5,
          initialStock: Number(newProduct.initialStock) || 0,
        }),
      });

      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        sku: '',
        barcode: '',
        categoryId: '',
        brand: '',
        unit: 'PIECE',
        purchasePrice: '',
        retailPrice: '',
        wholesalePrice: '',
        taxRate: '18',
        minStockLevel: '10',
        initialStock: '50',
        isWeighted: false,
      });
      loadProducts();
      alert('Product created successfully with initial stock ledger entry!');
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  const handleGenerateBarcode = async () => {
    try {
      const res = await apiFetch('/barcode/generate-ean13');
      setNewProduct((prev) => ({
        ...prev,
        barcode: res.barcode,
        sku: prev.sku || `SKU-${res.barcode.slice(-6)}`,
      }));
    } catch (err) {
      const randomEan = '200' + Math.floor(Math.random() * 899999999 + 100000000);
      setNewProduct((prev) => ({
        ...prev,
        barcode: randomEan,
        sku: prev.sku || `SKU-${randomEan.slice(-6)}`,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog & Barcodes</h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage SKUs, EAN-13 barcodes, multi-unit pricing and stock alert thresholds.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search by product name, barcode or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
              lowStockFilter
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Alert</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Product & SKU</th>
                <th className="px-6 py-3.5">Barcode (EAN-13)</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Cost Price</th>
                <th className="px-6 py-3.5 text-right">Retail Price</th>
                <th className="px-6 py-3.5 text-center">GST Rate</th>
                <th className="px-6 py-3.5 text-center">Current Stock</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 font-mono text-xs font-bold text-slate-700">
                      <Barcode className="w-4 h-4 text-blue-600" />
                      <span>{p.barcode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {p.category?.name || 'Groceries'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">PKR {p.purchasePrice?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">PKR {p.retailPrice?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-blue-600">{p.taxRate}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        p.currentStock <= p.minStockLevel
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.currentStock} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setLabelProduct(p)}
                      title="Print Barcode Label"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center space-x-1 text-xs font-bold"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Label</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Olper's Full Cream Milk 1 Litre"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. DRY-MLK-01"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Barcode (EAN-13)</label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Generate EAN
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="2000000000018"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost (PKR) *</label>
                  <input
                    required
                    type="number"
                    placeholder="195.00"
                    value={newProduct.purchasePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Retail Price (PKR) *</label>
                  <input
                    required
                    type="number"
                    placeholder="220.00"
                    value={newProduct.retailPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, retailPrice: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="PIECE">Piece</option>
                    <option value="KG">Kilogram (KG)</option>
                    <option value="LITRE">Litre</option>
                    <option value="BOX">Box</option>
                    <option value="PACK">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST Tax (%)</label>
                  <input
                    type="number"
                    value={newProduct.taxRate}
                    onChange={(e) => setNewProduct({ ...newProduct, taxRate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newProduct.initialStock}
                    onChange={(e) => setNewProduct({ ...newProduct, initialStock: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARCODE LABEL PREVIEW & THERMAL PRINT MODAL */}
      {labelProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Thermal Barcode Label Preview</h3>
              <button onClick={() => setLabelProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated 50mm x 30mm Barcode Sticker */}
            <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2">
              <div className="text-[11px] font-bold text-slate-900 uppercase">
                {tenant?.name || 'ABC Mart Cash & Carry'}
              </div>
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{labelProduct.name}</div>

              {/* Barcode Lines Graphic */}
              <div className="py-2 flex items-center justify-center">
                <div className="h-10 flex items-center gap-[2px]">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-full bg-black"
                      style={{ width: i % 3 === 0 ? '3px' : i % 2 === 0 ? '2px' : '1px' }}
                    ></span>
                  ))}
                </div>
              </div>

              <div className="font-mono text-xs tracking-widest text-slate-700 font-bold">{labelProduct.barcode}</div>
              <div className="text-base font-black text-slate-900">PKR {labelProduct.retailPrice?.toLocaleString()}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                  setLabelProduct(null);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Label</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
