'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building,
  CreditCard,
  TrendingUp,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    totalTenants: 14,
    activeTenants: 13,
    suspendedTenants: 1,
    activeSubscriptions: 13,
    mrr: 295000,
    arr: 3540000,
    totalPlatformTransactions: 84920,
    currency: 'PKR',
  });
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        apiFetch('/tenants/platform/overview').catch(() => null),
        apiFetch('/tenants/platform/all').catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (tenantsRes && tenantsRes.length > 0) {
        setTenants(tenantsRes);
      } else {
        setTenants([
          {
            id: 't-1',
            name: 'ABC Mart & Cash Carry Pvt Ltd',
            slug: 'metro-pk',
            city: 'Lahore',
            phone: '+92 42 35789000',
            status: 'ACTIVE',
            subscriptions: [{ plan: { name: 'Business Enterprise' }, billingCycle: 'ANNUAL' }],
            branches: [{ id: 'b-1' }, { id: 'b-2' }],
            createdAt: new Date().toISOString(),
          },
          {
            id: 't-2',
            name: 'Imtiaz Mega Store Express',
            slug: 'imtiaz-exp',
            city: 'Karachi',
            phone: '+92 21 111 222 333',
            status: 'ACTIVE',
            subscriptions: [{ plan: { name: 'Enterprise Unlimited' }, billingCycle: 'ANNUAL' }],
            branches: [{ id: 'b-3' }, { id: 'b-4' }, { id: 'b-5' }],
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 't-3',
            name: 'Save Mart Wholesale & Retail',
            slug: 'savemart-isb',
            city: 'Islamabad',
            phone: '+92 51 2890111',
            status: 'ACTIVE',
            subscriptions: [{ plan: { name: 'Professional Plan' }, billingCycle: 'MONTHLY' }],
            branches: [{ id: 'b-6' }],
            createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          },
          {
            id: 't-4',
            name: 'Al-Fatah Gourmet Express',
            slug: 'alfatah-dha',
            city: 'Lahore',
            phone: '+92 42 35712345',
            status: 'SUSPENDED',
            subscriptions: [{ plan: { name: 'Starter Plan' }, billingCycle: 'MONTHLY' }],
            branches: [{ id: 'b-7' }],
            createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Super admin error:', err);
    }
  }

  const toggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiFetch(`/tenants/platform/${tenantId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      loadAdminData();
      alert(`Business status updated to ${newStatus}`);
    } catch (err: any) {
      alert(`Status update error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SaaS Super Admin Platform</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Global tenant governance, subscription recurring revenue (MRR/ARR), and platform health telemetry.
          </p>
        </div>
      </div>

      {/* Platform KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Total Registered Tenants</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalTenants} Businesses</div>
          <div className="text-xs text-emerald-600 font-bold mt-1">{stats.activeTenants} Active & Running</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Monthly Recurring Revenue (MRR)</div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            PKR {stats.mrr?.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">SaaS subscription income</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Annual Run Rate (ARR)</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            PKR {stats.arr?.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 font-bold mt-1">+24% Projected Growth</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500">Platform POS Transactions</div>
          <div className="text-2xl font-black text-indigo-600 mt-2">
            {stats.totalPlatformTransactions?.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Processed across all terminals</div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Tenant Enterprise Accounts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Business Name & Slug</th>
                <th className="px-6 py-3.5">Location & Contact</th>
                <th className="px-6 py-3.5">Subscription Plan</th>
                <th className="px-6 py-3.5 text-center">Branches</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs font-mono text-slate-400">slug: {t.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div className="font-semibold text-slate-800">{t.city}, Pakistan</div>
                    <div className="text-slate-400">{t.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      {t.subscriptions?.[0]?.plan?.name || 'Business Plan'} ({t.subscriptions?.[0]?.billingCycle})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">{t.branches?.length || 1} Branches</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleTenantStatus(t.id, t.status)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        t.status === 'ACTIVE'
                          ? 'text-red-600 border-red-200 hover:bg-red-50'
                          : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {t.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
