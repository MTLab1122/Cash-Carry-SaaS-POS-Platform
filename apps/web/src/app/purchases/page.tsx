'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Package,
  X,
  Building,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function PurchasesPage() {
  const { currentBranch } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);

  // New GRN state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [grnItems, setGrnItems] = useState<
    { productId: string; orderedQuantity: number; receivedQuantity: number; unitCost: number }[]
  >([]);

  useEffect(() => {
    loadPurchasesData();
  }, [currentBranch]);

  async function loadPurchasesData() {
    try {
      const branchParam = currentBranch?.id ? `?branchId=${currentBranch.id}` : '';
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        apiFetch(`/purchases/orders${branchParam}`).catch(() => []),
        apiFetch(`/purchases/suppliers`).catch(() => []),
        apiFetch(`/products${branchParam}`).catch(() => ({ items: [] })),
      ]);

      setOrders(ordersRes || []);
      setSuppliers(suppliersRes || []);
      setProducts(productsRes.items || []);
    } catch (err) {
      console.warn('Purchases load error:', err);
    }
  }

  const handleAddItemToGRN = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    setGrnItems((prev) => [
      ...prev,
      {
        productId,
        orderedQuantity: 50,
        receivedQuantity: 50,
        unitCost: p.purchasePrice,
      },
    ]);
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || grnItems.length === 0) {
      alert('Please select a supplier and add at least one item');
      return;
    }

    try {
      await apiFetch('/purchases/receive-goods', {
        method: 'POST',
        body: JSON.stringify({
          branchId: currentBranch?.id,
          supplierId: selectedSupplierId,
          items: grnItems,
          notes: 'Standard supplier delivery receiving',
        }),
      });

      setIsGRNModalOpen(false);
      setGrnItems([]);
      loadPurchasesData();
      alert('Goods received successfully! Stock ledger automatically updated.');
    } catch (err: any) {
      alert(`Receiving error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Orders & Goods Receiving (GRN)</h1>
          <p className="text-sm text-slate-500 font-medium">
            Procurement workflow, verified deliveries, supplier statements and automated ledger replenishment.
          </p>
        </div>

        <button
          onClick={() => setIsGRNModalOpen(true)}
          className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Receive Goods (GRN)</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">PO / GRN Number</th>
                <th className="px-6 py-3.5">Supplier</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-center">Items Count</th>
                <th className="px-6 py-3.5 text-right">Total Amount</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                    No purchase orders recorded yet. Click "Receive Goods (GRN)" to log a supplier delivery.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">{po.poNumber}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{po.supplier?.companyName}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{po.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      PKR {po.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{po.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIVE GOODS (GRN) MODAL */}
      {isGRNModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Receive Goods (GRN)</h3>
              <button onClick={() => setIsGRNModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveGoods} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName || s.name} ({s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Add Product to Goods Receipt</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleAddItemToGRN(e.target.value);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                >
                  <option value="">+ Choose product to add...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - SKU: {p.sku} (Cost: PKR {p.purchasePrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items in GRN */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="text-xs font-bold uppercase text-slate-500">Delivery Items to Verify:</div>
                {grnItems.map((item, idx) => {
                  const p = products.find((prod) => prod.id === item.productId);
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-900">{p?.name}</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">Qty:</span>
                        <input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setGrnItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, receivedQuantity: val } : it)),
                            );
                          }}
                          className="w-16 p-1 border border-slate-300 rounded font-bold text-center"
                        />
                        <span className="font-bold">PKR {(item.receivedQuantity * item.unitCost).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGRNModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Verify Delivery & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

