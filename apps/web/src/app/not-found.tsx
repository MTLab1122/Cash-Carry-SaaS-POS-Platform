'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 border border-blue-100">
        <HelpCircle className="w-10 h-10" />
      </div>
      <span className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-2">Error 404</span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
        Page Not Found
      </h1>
      <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
        The requested resource, terminal view, or page cannot be found or may have been moved.
      </p>
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <Link
          href="/pos"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-300 transition"
        >
          <span>Open POS</span>
        </Link>
      </div>
    </div>
  );
}
