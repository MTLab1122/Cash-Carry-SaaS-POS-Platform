'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, Mail, FileText, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    ntn: '',
    strn: '',
    address: '',
    paymentTerms: 'Net 30 Days',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      const res = await apiFetch('/purchases/suppliers');
      setSuppliers(res || []);
    } catch (err) {
      console.warn('Suppliers load error:', err);
    }
  }

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/purchases/suppliers', {
        method: 'POST',
        body: JSON.stringify(newSupplier),
      });
      setIsAddModalOpen(false);
      setNewSupplier({
        name: '',
        companyName: '',
        phone: '',
        email: '',
        ntn: '',
        strn: '',
        address: '',
        paymentTerms: 'Net 30 Days',
      });
      loadSuppliers();
      alert('Supplier registered successfully!');
    } catch (err: any) {
      alert(`Error creating supplier: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers & Vendor Management</h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage authorized brand distributors, NTN tax profiles, payment terms and accounts payable.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Company / Distributor</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">NTN & STRN</th>
                <th className="px-6 py-3.5">Payment Terms</th>
                <th className="px-6 py-3.5 text-right">Payables Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{s.companyName || s.name}</div>
                    <div className="text-xs text-slate-400">{s.address || 'Karachi / Lahore, Pakistan'}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">
                    <div>{s.phone}</div>
                    <div className="text-slate-400">{s.email || 'orders@distributor.pk'}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    <div>NTN: {s.ntn || '—'}</div>
                    <div className="text-slate-400">STRN: {s.strn || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {s.paymentTerms || 'Net 30 Days'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    PKR {s.currentBalance?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Supplier / Distributor</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Brand Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. National Foods Ltd"
                  value={newSupplier.companyName}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, companyName: e.target.value, name: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    required
                    type="text"
                    placeholder="021-111-222-333"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="orders@national.pk"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NTN Number</label>
                  <input
                    type="text"
                    placeholder="1234567-8"
                    value={newSupplier.ntn}
                    onChange={(e) => setNewSupplier({ ...newSupplier, ntn: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={newSupplier.paymentTerms}
                    onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                  >
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

