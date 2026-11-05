'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, DollarSign, Award, Phone, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    cnic: '',
    address: '',
    creditLimit: '50000',
  });

  useEffect(() => {
    loadCustomers();
  }, [search]);

  async function loadCustomers() {
    try {
      const query = search ? `?search=${search}` : '';
      const res = await apiFetch(`/customers${query}`);
      setCustomers(res || []);
    } catch (err) {
      console.warn('Customer load error:', err);
    }
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(newCustomer),
      });
      setIsAddModalOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', cnic: '', address: '', creditLimit: '50000' });
      loadCustomers();
      alert('Customer profile created successfully!');
    } catch (err: any) {
      alert(`Error creating customer: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) return;

    try {
      await apiFetch(`/customers/${selectedCustomer.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(paymentAmount) }),
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      loadCustomers();
      alert('Customer credit payment recorded successfully!');
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Ledger & Credit Accounts</h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage wholesale credit limits, receivables, loyalty rewards and purchase history.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Contact Phone</th>
                <th className="px-6 py-3.5">CNIC</th>
                <th className="px-6 py-3.5 text-right">Credit Limit</th>
                <th className="px-6 py-3.5 text-right">Outstanding Credit</th>
                <th className="px-6 py-3.5 text-center">Loyalty Points</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{c.phone}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{c.cnic || '—'}</td>
                  <td className="px-6 py-4 text-right font-medium">PKR {c.creditLimit?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-black text-amber-600">
                    PKR {c.currentCredit?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      <Award className="w-3 h-3 text-blue-600" />
                      <span>{c.loyaltyPoints} pts</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.currentCredit > 0 && (
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsPaymentModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                      >
                        Receive Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Customer Profile</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Company Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Chaudhry Zafar & Sons"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    required
                    type="text"
                    placeholder="0300-1234567"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNIC (Optional)</label>
                  <input
                    type="text"
                    placeholder="35201-1234567-1"
                    value={newCustomer.cnic}
                    onChange={(e) => setNewCustomer({ ...newCustomer, cnic: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Credit Limit (PKR)</label>
                <input
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-blue-600"
                />
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Credit Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{selectedCustomer.name}</div>
              <div className="text-amber-700 font-bold mt-1">
                Outstanding Balance: PKR {selectedCustomer.currentCredit?.toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Received (PKR) *</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 25000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
