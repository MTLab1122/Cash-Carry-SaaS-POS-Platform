'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/10 border border-amber-100">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <span className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-2">Error 500</span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
        Unexpected System Exception
      </h1>
      <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
        An unexpected error occurred during processing. The incident has been recorded with our telemetry monitor.
      </p>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-300 transition"
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

