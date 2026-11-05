'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, Wifi, User as UserIcon, LogOut, Store } from 'lucide-react';

export default function Header() {
  const { user, tenant, branches, currentBranch, setCurrentBranch, activeSession, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
      {/* Left: Branch Switcher */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
          <Store className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase">Branch:</span>
          <select
            value={currentBranch?.id || ''}
            onChange={(e) => {
              const selected = branches.find((b) => b.id === e.target.value);
              if (selected) setCurrentBranch(selected);
            }}
            className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online (Real-time)</span>
        </div>

        {/* Cashier Shift Status */}
        {activeSession ? (
          <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
            <span>Shift Active:</span>
            <span className="font-bold">{activeSession.register?.name || 'Counter 1'}</span>
          </div>
        ) : null}
      </div>

      {/* Right: Tenant Name & User Profile */}
      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-bold text-slate-800">{user?.name || 'Muhammad Tariq'}</div>
          <div className="text-xs font-medium text-slate-500">
            {user?.role === 'BUSINESS_OWNER'
              ? 'Business Owner (Admin)'
              : user?.role === 'CASHIER'
              ? 'POS Cashier'
              : user?.role || 'Staff'}
          </div>
        </div>

        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          {user?.name ? user.name[0].toUpperCase() : 'A'}
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
