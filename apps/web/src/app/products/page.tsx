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
  Sparkles,
  RefreshCw,
  Tag,
  DollarSign,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function ProductsPage() {
  const { currentBranch, tenant } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [aiApplied, setAiApplied] = useState(false);

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
    description: '',
    isWeighted: false,
  });

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Label Print Modal
  const [labelProduct, setLabelProduct] = useState<any | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [currentBranch, selectedCategory, lowStockFilter]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  async function loadCategories() {
    try {
      const res = await apiFetch('/products/categories');
      if (Array.isArray(res)) {
        setCategories(res);
      }
    } catch (err) {
      console.warn('Failed loading categories:', err);
    }
  }

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

  const handleAiAutoFill = async (customPrompt?: string) => {
    const promptText = customPrompt || newProduct.name;
    if (!promptText || !promptText.trim()) {
      setFormError('Please enter a product title or select an example chip first for AI suggestions.');
      return;
    }

    setIsAiLoading(true);
    setFormError(null);

    try {
      const res = await apiFetch('/products/ai-suggest', {
        method: 'POST',
        body: JSON.stringify({ prompt: promptText }),
      });

      setNewProduct((prev) => ({
        ...prev,
        name: res.name || promptText,
        sku: res.sku || prev.sku,
        barcode: res.barcode || prev.barcode,
        categoryId: res.categoryId || prev.categoryId,
        brand: res.brand || prev.brand,
        unit: res.unit || prev.unit,
        purchasePrice: String(res.purchasePrice ?? prev.purchasePrice),
        retailPrice: String(res.retailPrice ?? prev.retailPrice),
        wholesalePrice: String(res.wholesalePrice ?? prev.wholesalePrice),
        taxRate: String(res.taxRate ?? prev.taxRate),
        minStockLevel: String(res.minStockLevel ?? prev.minStockLevel),
        initialStock: String(res.initialStock ?? prev.initialStock),
        description: res.description || prev.description,
        isWeighted: Boolean(res.isWeighted),
      }));

      setAiApplied(true);
    } catch (err: any) {
      setFormError(`AI Suggestion error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProduct.name.trim(),
          sku: newProduct.sku.trim(),
          barcode: newProduct.barcode.trim(),
          categoryId: newProduct.categoryId || (categories[0]?.id ?? undefined),
          brand: newProduct.brand.trim() || undefined,
          unit: newProduct.unit,
          purchasePrice: Number(newProduct.purchasePrice) || 0,
          retailPrice: Number(newProduct.retailPrice) || 0,
          wholesalePrice: newProduct.wholesalePrice ? Number(newProduct.wholesalePrice) : null,
          taxRate: Number(newProduct.taxRate) || 0,
          minStockLevel: Number(newProduct.minStockLevel) || 5,
          initialStock: Number(newProduct.initialStock) || 0,
          description: newProduct.description || undefined,
          branchId: currentBranch?.id,
          isWeighted: Boolean(newProduct.isWeighted),
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
        description: '',
        isWeighted: false,
      });
      setAiApplied(false);
      showToast('success', 'Product created successfully and recorded in inventory ledger!');
      loadProducts();
    } catch (err: any) {
      setFormError(`Error creating product: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await apiFetch(`/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingProduct.name,
          categoryId: editingProduct.categoryId,
          brand: editingProduct.brand,
          unit: editingProduct.unit,
          purchasePrice: Number(editingProduct.purchasePrice),
          retailPrice: Number(editingProduct.retailPrice),
          wholesalePrice: editingProduct.wholesalePrice ? Number(editingProduct.wholesalePrice) : null,
          taxRate: Number(editingProduct.taxRate),
          minStockLevel: Number(editingProduct.minStockLevel),
          isWeighted: Boolean(editingProduct.isWeighted),
        }),
      });

      setEditingProduct(null);
      showToast('success', 'Product updated successfully!');
      loadProducts();
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate product '${name}'?`)) return;

    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      showToast('success', `Product '${name}' deactivated successfully.`);
      loadProducts();
    } catch (err: any) {
      showToast('error', `Deactivation failed: ${err.message}`);
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

  const exampleProducts = [
    "Olper's Full Cream Milk 1 Litre",
    'Tapal Danedar Tea 400g',
    'National Chicken Biryani Masala',
    'Dalda Canola Cooking Oil 5L',
    'Surf Excel Detergent Powder 1kg',
    'Dettol Original Bar Soap 100g',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog & Barcodes</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
              {products.length} Items
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Manage multi-unit wholesale pricing, GST 18%, barcode generation and real-time inventory balances.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setFormError(null);
              setAiApplied(false);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
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
            placeholder="Search by product name, barcode, brand or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Low Stock Alert Toggle Button */}
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

          <button
            onClick={loadProducts}
            title="Refresh List"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                <th className="px-6 py-3.5 text-right">Cost (PKR)</th>
                <th className="px-6 py-3.5 text-right">Retail (PKR)</th>
                <th className="px-6 py-3.5 text-center">Margin</th>
                <th className="px-6 py-3.5 text-center">GST Rate</th>
                <th className="px-6 py-3.5 text-center">Current Stock</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base text-slate-600">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || selectedCategory || lowStockFilter
                        ? 'Try clearing the search filters'
                        : 'Click "Add New Product" to populate your catalog.'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const marginPct =
                    p.purchasePrice > 0
                      ? (((p.retailPrice - p.purchasePrice) / p.purchasePrice) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 mt-0.5">
                          <span>{p.sku}</span>
                          {p.brand && (
                            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] text-slate-600 font-sans font-bold">
                              {p.brand}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-slate-700">
                          <Barcode className="w-4 h-4 text-blue-600" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {p.category?.name || 'Groceries'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">PKR {p.purchasePrice?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        PKR {p.retailPrice?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            Number(marginPct) >= 15
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          +{marginPct}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-blue-600">{p.taxRate}%</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.currentStock <= p.minStockLevel
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setLabelProduct(p)}
                            title="Print Barcode Label"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingProduct(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Deactivate Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL WITH AI ASSISTANT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Add New Product</h3>
                  <p className="text-xs text-slate-500">Create SKU and register opening inventory balance</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* AI Assistant Quick Auto-Fill Bar */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 rounded-xl border border-indigo-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-black text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span>AI Smart Product Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAiAutoFill()}
                  disabled={isAiLoading || !newProduct.name}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center space-x-1"
                >
                  {isAiLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Complete Form</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Preset Example Chips */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-slate-500 font-medium py-0.5">Quick Examples:</span>
                {exampleProducts.slice(0, 4).map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAiAutoFill(ex)}
                    className="px-2 py-0.5 bg-white border border-indigo-200/80 hover:border-indigo-400 text-indigo-800 font-bold rounded-md hover:bg-indigo-50/50 transition-colors shadow-2xs"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {aiApplied && (
                <div className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI successfully filled product details, SKU code, category & pricing!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Name * <span className="text-slate-400 font-normal">(e.g. Brand + Item + Pack Size)</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Olper's Full Cream Milk 1 Litre"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Olper's / Nestlé / Dalda"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. DAI-OLP-1L"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold uppercase"
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
                      Generate EAN-13
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="2000000000018"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost (PKR) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
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
                    step="0.01"
                    placeholder="220.00"
                    value={newProduct.retailPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, retailPrice: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-black text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wholesale Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="205.00"
                    value={newProduct.wholesalePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, wholesalePrice: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="PIECE">Piece (Item)</option>
                    <option value="PACK">Pack</option>
                    <option value="BOX">Box / Carton</option>
                    <option value="KG">Kilogram (KG)</option>
                    <option value="LITRE">Litre</option>
                    <option value="DOZEN">Dozen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newProduct.taxRate}
                    onChange={(e) => setNewProduct({ ...newProduct, taxRate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Opening Stock</label>
                  <input
                    type="number"
                    value={newProduct.initialStock}
                    onChange={(e) => setNewProduct({ ...newProduct, initialStock: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Description / Shelf Tag</label>
                <textarea
                  rows={2}
                  placeholder="Shelf label info, storage conditions, or vendor details..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isWeighted"
                  checked={newProduct.isWeighted}
                  onChange={(e) => setNewProduct({ ...newProduct, isWeighted: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="isWeighted" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Weighted item (requires digital scale barcode integration)
                </label>
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
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Product...</span>
                    </>
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.purchasePrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, purchasePrice: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Retail Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.retailPrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, retailPrice: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    value={editingProduct.minStockLevel}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, minStockLevel: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARCODE THERMAL LABEL PREVIEW & PRINT MODAL */}
      {labelProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Thermal Barcode Label (50mm x 30mm)</h3>
              <button onClick={() => setLabelProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated 50mm x 30mm Barcode Sticker */}
            <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2">
              <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                {tenant?.name || 'ABC Mart Cash & Carry'}
              </div>
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{labelProduct.name}</div>

              {/* Barcode Graphic Lines */}
              <div className="py-2 flex items-center justify-center">
                <div className="h-10 flex items-center gap-[2px]">
                  {Array.from({ length: 34 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-full bg-black"
                      style={{ width: i % 4 === 0 ? '3px' : i % 2 === 0 ? '2px' : '1px' }}
                    ></span>
                  ))}
                </div>
              </div>

              <div className="font-mono text-xs tracking-widest text-slate-700 font-black">
                {labelProduct.barcode}
              </div>
              <div className="text-base font-black text-slate-900">
                PKR {labelProduct.retailPrice?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Incl. 18% GST • SKU: {labelProduct.sku}</div>
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
