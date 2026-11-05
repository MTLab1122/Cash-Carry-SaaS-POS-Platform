'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForbiddenPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10 border border-rose-100">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <span className="text-sm font-bold uppercase tracking-wider text-rose-600 mb-2">Error 403</span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
        Access Forbidden
      </h1>
      <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
        Your role ({user?.role || 'Guest'}) does not have authorization to view this module. If you believe this is a mistake, contact your business administrator.
      </p>
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <button
          onClick={logout}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-300 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Account</span>
        </button>
      </div>
    </div>
  );
}

