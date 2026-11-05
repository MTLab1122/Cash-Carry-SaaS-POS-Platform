'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PermissionScope, hasPermission } from '@cash-carry/shared';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredScopes?: PermissionScope[];
  fallback?: React.ReactNode;
  showForbiddenPage?: boolean;
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredScopes,
  fallback = null,
  showForbiddenPage = false,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Super Admin bypasses all checks
  if (user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // Check roles
  let roleAllowed = true;
  if (allowedRoles && allowedRoles.length > 0) {
    roleAllowed = allowedRoles.includes(user.role);
  }

  // Check scopes
  let scopesAllowed = true;
  if (requiredScopes && requiredScopes.length > 0) {
    scopesAllowed = requiredScopes.every((scope) => hasPermission(user.role, scope));
  }

  if (roleAllowed && scopesAllowed) {
    return <>{children}</>;
  }

  if (showForbiddenPage) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10 border border-rose-100">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Access Restricted (403 Forbidden)
        </h1>
        <p className="text-slate-500 max-w-md mb-8 text-sm">
          Your current account role (<span className="font-semibold text-slate-800">{user.role}</span>) does not possess the required permissions to access this administrative module.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return <>{fallback}</>;
}
