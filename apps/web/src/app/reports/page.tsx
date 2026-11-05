'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Filter, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function ReportsPage() {
  const { currentBranch } = useAuth();
  const [cashierPerformance, setCashierPerformance] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    loadReports();
  }, [currentBranch]);

  async function loadReports() {
    try {
      const branchParam = currentBranch?.id ? `?branchId=${currentBranch.id}` : '';
      const res = await apiFetch(`/reports/cashier-performance${branchParam}`);
      setCashierPerformance(res || []);
    } catch (err) {
      console.warn('Reports error:', err);
    }
  }

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Cashier Name,Email,Orders Processed,Total Sales (PKR)\n';
    cashierPerformance.forEach((c) => {
      csvContent += `${c.name},${c.email},${c.salesCount},${c.totalSales}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cash_carry_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Intelligence & Analytics</h1>
          <p className="text-sm text-slate-500 font-medium">
            Cashier checkout productivity, branch comparison, category contribution and custom date filters.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-slate-500">Reporting Window:</span>
          {['today', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                dateRange === range
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Cashier Productivity Ranking */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Cashier Performance & Shift Reconciliation</h2>
            <p className="text-xs text-slate-500">Track order processing speed and total revenue collected per counter</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Cashier Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5 text-center">Orders Processed</th>
                <th className="px-6 py-3.5 text-right">Total Revenue (PKR)</th>
                <th className="px-6 py-3.5 text-center">Average Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashierPerformance.map((c) => {
                const avgTicket = c.salesCount > 0 ? Math.round(c.totalSales / c.salesCount) : 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{c.email}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">{c.salesCount}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      PKR {c.totalSales?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600">
                      PKR {avgTicket.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

