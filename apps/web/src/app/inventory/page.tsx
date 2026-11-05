'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function InventoryPage() {
  const { currentBranch, tenant, branches } = useAuth();
  const [activeTab, setActiveTab] = useState<'balances' | 'ledger' | 'valuation'>('balances');
  const [balances, setBalances] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUBTRACT' | 'DAMAGE' | 'EXPIRY'>('ADJUSTMENT_ADD');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Stock Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [currentBranch, activeTab]);

  async function loadData() {
    setIsLoading(true);
    try {
      const branchParam = currentBranch?.id ? `?branchId=${currentBranch.id}` : '';
      if (activeTab === 'balances') {
        const res = await apiFetch(`/inventory/balances${branchParam}`);
        setBalances(res || []);
      } else if (activeTab === 'ledger') {
        const res = await apiFetch(`/inventory/ledger${branchParam}`);
        setLedger(res.items || []);
      } else if (activeTab === 'valuation') {
        const res = await apiFetch(`/inventory/valuation${branchParam}`);
        setValuation(res);
      }
    } catch (err) {
      console.warn('Inventory fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustQty) return;

    try {
      await apiFetch('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          branchId: currentBranch?.id,
          warehouseId: selectedProduct.warehouseId,
          productId: selectedProduct.productId,
          type: adjustType,
          quantity: Number(adjustQty),
          notes: adjustNotes,
        }),
      });

      setIsAdjustModalOpen(false);
      setAdjustQty('');
      setAdjustNotes('');
      loadData();
      alert('Stock adjustment recorded and updated in traceable ledger!');
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    }
  };

  const handleTransferStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !targetBranchId || !transferQty) return;

    try {
      await apiFetch('/inventory/transfer', {
        method: 'POST',
        body: JSON.stringify({
          fromBranchId: currentBranch?.id,
          fromWarehouseId: selectedProduct.warehouseId,
          toBranchId: targetBranchId,
          toWarehouseId: selectedProduct.warehouseId, // auto handles in backend
          productId: selectedProduct.productId,
          quantity: Number(transferQty),
          notes: transferNotes,
        }),
      });

      setIsTransferModalOpen(false);
      setTransferQty('');
      setTransferNotes('');
      loadData();
      alert('Branch transfer completed successfully!');
    } catch (err: any) {
      alert(`Transfer error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centralized Inventory Ledger</h1>
          <p className="text-sm text-slate-500 font-medium">
            Track multi-warehouse balances, immutable ledger history, stock transfers and valuations.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'balances'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Real-time Balances</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('valuation')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'valuation'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Valuation & Metrics</span>
        </button>
      </div>

      {/* TAB 1: Real-time Balances */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Warehouse</th>
                  <th className="px-6 py-3.5 text-center">Safety Level</th>
                  <th className="px-6 py-3.5 text-center">Current Stock</th>
                  <th className="px-6 py-3.5 text-right">Cost Value</th>
                  <th className="px-6 py-3.5 text-right">Retail Value</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balances.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{b.product.name}</div>
                      <div className="text-xs font-mono text-slate-400">{b.product.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {b.warehouse?.name || 'Central Warehouse'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-500">
                      {b.product.minStockLevel} {b.product.unit}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          b.isLowStock
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {b.currentStock} {b.product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">PKR {b.stockValue?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      PKR {b.retailValue?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(b);
                          setIsAdjustModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(b);
                          setIsTransferModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                      >
                        Transfer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Traceable Stock Movement Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Movement Type</th>
                  <th className="px-6 py-3.5 text-center">Change Qty</th>
                  <th className="px-6 py-3.5 text-center">Balance After</th>
                  <th className="px-6 py-3.5">Reference & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{item.product?.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">
                        {item.type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-center font-black ${
                        item.quantity > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">{item.balanceAfter}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{item.notes || item.referenceType || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Valuation & Financial Summary */}
      {activeTab === 'valuation' && valuation && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">Total Stock Items</div>
            <div className="text-2xl font-black text-slate-900 mt-2">{valuation.totalItems?.toLocaleString()}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">Total Cost Value</div>
            <div className="text-2xl font-black text-blue-600 mt-2">
              PKR {valuation.totalCostValue?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">Total Retail Value</div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              PKR {valuation.totalRetailValue?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">Potential Gross Profit</div>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              PKR {valuation.potentialProfit?.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Stock Adjustment</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm font-bold text-slate-900">{selectedProduct.product.name}</div>
            <div className="text-xs text-slate-500">Current Stock: {selectedProduct.currentStock}</div>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Reason / Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="ADJUSTMENT_ADD">Manual Stock Add (Found Stock)</option>
                  <option value="ADJUSTMENT_SUBTRACT">Manual Stock Subtract (Audit Discrepancy)</option>
                  <option value="DAMAGE">Damaged Goods</option>
                  <option value="EXPIRY">Expired Product Write-off</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 5"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly shelf audit count"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {isTransferModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Inter-Branch Stock Transfer</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm font-bold text-slate-900">{selectedProduct.product.name}</div>
            <div className="text-xs text-slate-500">Available Source Stock: {selectedProduct.currentStock}</div>

            <form onSubmit={handleTransferStock} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination Branch</label>
                <select
                  required
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">Select Target Branch...</option>
                  {branches
                    .filter((b) => b.id !== currentBranch?.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Quantity</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 20"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Memo / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Stock replenishment for DHA branch"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
