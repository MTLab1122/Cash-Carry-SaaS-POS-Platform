'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Building, Store, ShieldCheck, Printer, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function SettingsPage() {
  const { tenant, currentBranch } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    ntn: '',
    strn: '',
    address: '',
    city: 'Lahore',
    isFbrReady: true,
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || 'ABC Mart & Cash Carry Pvt Ltd',
        phone: '+92 42 35789000',
        email: 'info@abcmart.pk',
        ntn: '7654321-9',
        strn: '17009876543',
        address: 'Main Boulevard Gulberg, Lahore, Punjab',
        city: 'Lahore',
        isFbrReady: true,
      });
    }
  }, [tenant]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/tenants/current', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      alert('Business and FBR fiscal settings saved successfully!');
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Configuration & Settings</h1>
        <p className="text-sm text-slate-500 font-medium">
          Pakistan market fiscal profiles, FBR POS e-invoicing parameters, cash drawer and printer configurations.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">Registered Business Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company / Store Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Head Office Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Pakistan Market Tax & FBR POS Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base text-slate-900">Pakistan Market & FBR POS Fiscal Configuration</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">National Tax Number (NTN)</label>
              <input
                type="text"
                value={formData.ntn}
                onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sales Tax Reg. Number (STRN)</label>
              <input
                type="text"
                value={formData.strn}
                onChange={(e) => setFormData({ ...formData, strn: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-emerald-900">FBR POS Tier-1 Real-time Invoicing</div>
              <div className="text-xs text-emerald-700 mt-0.5">
                Automatically generate verifiable FBR QR code and Fiscal Invoice Number on receipts.
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.isFbrReady}
              onChange={(e) => setFormData({ ...formData, isFbrReady: e.target.checked })}
              className="w-5 h-5 accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 pt-2">
            <div>
              <span className="text-slate-400">Default Currency:</span> PKR (Pakistani Rupee)
            </div>
            <div>
              <span className="text-slate-400">Timezone:</span> Asia/Karachi (PKT +05:00)
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
