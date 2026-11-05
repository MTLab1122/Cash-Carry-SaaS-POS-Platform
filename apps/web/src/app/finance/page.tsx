'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Receipt, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function FinancePage() {
  const { currentBranch } = useAuth();
  const [summary, setSummary] = useState<any>({
    totalRevenue: 892750,
    costOfGoodsSold: 647430,
    grossProfit: 245320,
    totalExpenses: 48500,
    netProfit: 196820,
    totalReceivables: 45000,
    totalPayables: 215000,
    currency: 'PKR',
  });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'UTILITIES',
    amount: '',
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    loadFinanceData();
  }, [currentBranch]);

  async function loadFinanceData() {
    try {
      const branchParam = currentBranch?.id ? `?branchId=${currentBranch.id}` : '';
      const [sumRes, expRes] = await Promise.all([
        apiFetch(`/finance/summary${branchParam}`).catch(() => null),
        apiFetch(`/finance/expenses${branchParam}`).catch(() => []),
      ]);

      if (sumRes) setSummary(sumRes);
      if (expRes && expRes.length > 0) {
        setExpenses(expRes);
      } else {
        setExpenses([
          {
            id: 'e-1',
            title: 'Electricity Bill (LESCO Commercial)',
            category: 'UTILITIES',
            amount: 32000,
            date: new Date().toISOString(),
            paymentMethod: 'BANK_TRANSFER',
          },
          {
            id: 'e-2',
            title: 'Store Cleaning & Sanitization Supplies',
            category: 'MAINTENANCE',
            amount: 8500,
            date: new Date(Date.now() - 2 * 86400000).toISOString(),
            paymentMethod: 'CASH',
          },
          {
            id: 'e-3',
            title: 'Thermal Paper Roll Consumables (100 pack)',
            category: 'OPERATIONS',
            amount: 8000,
            date: new Date(Date.now() - 5 * 86400000).toISOString(),
            paymentMethod: 'CASH',
          },
        ]);
      }
    } catch (err) {
      console.warn('Finance load error:', err);
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...newExpense,
          branchId: currentBranch?.id,
          amount: Number(newExpense.amount),
        }),
      });

      setIsAddExpenseOpen(false);
      setNewExpense({
        title: '',
        category: 'UTILITIES',
        amount: '',
        paymentMethod: 'CASH',
        reference: '',
        notes: '',
      });
      loadFinanceData();
      alert('Expense recorded in financial accounts!');
    } catch (err: any) {
      alert(`Error recording expense: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Statements & Profit & Loss</h1>
          <p className="text-sm text-slate-500 font-medium">
            Gross margins, cost of goods sold (COGS), operating overheads, receivables and payables.
          </p>
        </div>

        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Store Expense</span>
        </button>
      </div>

      {/* Financial P&L Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Gross Sales Revenue</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.currency} {summary.totalRevenue?.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total customer receipts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Cost of Goods Sold (COGS)</div>
          <div className="text-2xl font-black text-slate-700 mt-2">
            {summary.currency} {summary.costOfGoodsSold?.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Weighted product purchase cost</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Gross Profit</div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {summary.currency} {summary.grossProfit?.toLocaleString()}
          </div>
          <div className="text-xs font-bold text-blue-600 mt-1">
            {summary.totalRevenue > 0
              ? `${Math.round((summary.grossProfit / summary.totalRevenue) * 100)}% Gross Margin`
              : '27.5% Margin'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Net Profit</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {summary.currency} {summary.netProfit?.toLocaleString()}
          </div>
          <div className="text-xs font-bold text-emerald-600 mt-1">After operating expenses</div>
        </div>
      </div>

      {/* Receivables & Payables Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-500">Accounts Receivable (Customer Credit)</div>
            <div className="text-xl font-black text-amber-600 mt-1">
              PKR {summary.totalReceivables?.toLocaleString()}
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Pending Collection
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-500">Accounts Payable (Supplier Dues)</div>
            <div className="text-xl font-black text-slate-900 mt-1">
              PKR {summary.totalPayables?.toLocaleString()}
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            Net 30 Days Due
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recorded Operating Expenses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Expense Description</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{e.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">{e.paymentMethod}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">PKR {e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Store Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Generator Fuel / LESCO Bill"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                  >
                    <option value="UTILITIES">Utilities (Electricity/Water)</option>
                    <option value="RENT">Store Rent</option>
                    <option value="SALARIES">Salaries & Wages</option>
                    <option value="MAINTENANCE">Maintenance & Repairs</option>
                    <option value="OPERATIONS">Store Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR) *</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 15000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                >
                  <option value="CASH">Cash Register Petty Cash</option>
                  <option value="BANK_TRANSFER">Bank Account Transfer</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

