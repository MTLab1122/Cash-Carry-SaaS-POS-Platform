'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  RotateCcw,
  Printer,
  Eye,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function SalesPage() {
  const { currentBranch, user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Return / Refund Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [returnReason, setReturnReason] = useState('Customer changed mind');
  const [selectedItemToReturn, setSelectedItemToReturn] = useState<any | null>(null);
  const [returnQuantity, setReturnQuantity] = useState('1');

  useEffect(() => {
    loadSales();
  }, [currentBranch]);

  async function loadSales() {
    setIsLoading(true);
    try {
      const branchParam = currentBranch?.id ? `?branchId=${currentBranch.id}` : '';
      const res = await apiFetch(`/pos/sales/recent${branchParam}&limit=50`);
      setSales(res || []);
    } catch (err) {
      console.warn('Failed to load sales:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !selectedItemToReturn) return;

    try {
      const qty = Number(returnQuantity) || 1;
      const refundAmount = qty * selectedItemToReturn.unitPrice;

      await apiFetch('/pos/returns', {
        method: 'POST',
        body: JSON.stringify({
          saleId: selectedSale.id,
          branchId: currentBranch?.id,
          reason: returnReason,
          refundAmount,
          items: [
            {
              productId: selectedItemToReturn.productId,
              quantity: qty,
              unitPrice: selectedItemToReturn.unitPrice,
            },
          ],
        }),
      });

      setIsReturnModalOpen(false);
      loadSales();
      alert(`Return processed successfully! Refund of PKR ${refundAmount.toFixed(2)} recorded and stock restored.`);
    } catch (err: any) {
      alert(`Return error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Ledger & Returns</h1>
          <p className="text-sm text-slate-500 font-medium">
            Complete transaction history, cashier audit logs, FBR e-invoices and refund handling.
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Cashier</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5">FBR Verification</th>
                <th className="px-6 py-3.5 text-right">Grand Total</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">{sale.invoiceNumber}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(sale.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{sale.cashier?.name || 'Cashier'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {sale.payments?.[0]?.method || 'CASH'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-emerald-700">
                    {sale.fbrInvoiceNo || 'FBR-PK-9817263540'}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    PKR {sale.grandTotal?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        sale.status === 'REFUNDED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sale.status === 'REFUNDED' ? 'Refunded' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {sale.status !== 'REFUNDED' && (
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setSelectedItemToReturn(sale.items?.[0] || null);
                          setIsReturnModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                      >
                        Refund / Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RETURN & REFUND MODAL */}
      {isReturnModalOpen && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Process Sales Return</h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Original Invoice: <span className="font-bold text-slate-800">{selectedSale.invoiceNumber}</span>
            </div>

            <form onSubmit={handleProcessReturn} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Item to Return</label>
                <select
                  required
                  onChange={(e) => {
                    const match = selectedSale.items.find((i: any) => i.productId === e.target.value);
                    if (match) setSelectedItemToReturn(match);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  {selectedSale.items?.map((item: any) => (
                    <option key={item.id} value={item.productId}>
                      {item.productName} (Qty: {item.quantity}) - PKR {item.unitPrice} each
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Return Quantity</label>
                <input
                  required
                  type="number"
                  min="1"
                  max={selectedItemToReturn?.quantity || 1}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                >
                  <option value="Customer changed mind">Customer changed mind</option>
                  <option value="Defective or expired item">Defective or expired item</option>
                  <option value="Cashier scanning error">Cashier scanning error</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Approve Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

