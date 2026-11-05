'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Receipt,
  Truck,
  Users,
  Building2,
  DollarSign,
  BarChart3,
  Sparkles,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, tenant } = useAuth();

  const allNavigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: [
        'SUPER_ADMIN',
        'BUSINESS_OWNER',
        'GENERAL_MANAGER',
        'BRANCH_MANAGER',
        'INVENTORY_MANAGER',
        'PURCHASE_MANAGER',
        'ACCOUNTANT',
        'AUDITOR',
      ],
    },
    {
      name: 'POS Billing',
      href: '/pos',
      icon: ShoppingCart,
      highlight: true,
      roles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'GENERAL_MANAGER', 'BRANCH_MANAGER', 'CASHIER'],
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      roles: [
        'SUPER_ADMIN',
        'BUSINESS_OWNER',
        'GENERAL_MANAGER',
        'BRANCH_MANAGER',
        'INVENTORY_MANAGER',
        'PURCHASE_MANAGER',
      ],
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Boxes,
      roles: [
        'SUPER_ADMIN',
        'BUSINESS_OWNER',
        'GENERAL_MANAGER',
        'BRANCH_MANAGER',
        'INVENTORY_MANAGER',
      ],
    },
    {
      name: 'Sales & Returns',
      href: '/sales',
      icon: Receipt,
      roles: [
        'SUPER_ADMIN',
        'BUSINESS_OWNER',
        'GENERAL_MANAGER',
        'BRANCH_MANAGER',
        'CASHIER',
        'ACCOUNTANT',
        'AUDITOR',
      ],
    },
    {
      name: 'Purchases (GRN)',
      href: '/purchases',
      icon: Truck,
      roles: [
        'SUPER_ADMIN',
        'BUSINESS_OWNER',
        'GENERAL_MANAGER',
        'BRANCH_MANAGER',
        'PURCHASE_MANAGER',
        'ACCOUNTANT',
      ],
    },
    {
      name: 'Suppliers',
      href: '/suppliers',
      icon: Building2,
      roles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'GENERAL_MANAGER', 'PURCHASE_MANAGER'],
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      roles: [
        'SUPER_ADMIN',
        'BUSINESS_OWNER',
        'GENERAL_MANAGER',
        'BRANCH_MANAGER',
        'ACCOUNTANT',
      ],
    },
    {
      name: 'Finance & P&L',
      href: '/finance',
      icon: DollarSign,
      roles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'GENERAL_MANAGER', 'ACCOUNTANT', 'AUDITOR'],
    },
    {
      name: 'Reports & Analytics',
      href: '/reports',
      icon: BarChart3,
      roles: [
        'SUPER_ADMIN',
        'BUSINESS_OWNER',
        'GENERAL_MANAGER',
        'BRANCH_MANAGER',
        'INVENTORY_MANAGER',
        'PURCHASE_MANAGER',
        'ACCOUNTANT',
        'AUDITOR',
      ],
    },
    {
      name: 'AI Assistant',
      href: '/ai-assistant',
      icon: Sparkles,
      badge: 'AI',
      roles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'GENERAL_MANAGER', 'BRANCH_MANAGER'],
    },
    {
      name: 'SaaS Super Admin',
      href: '/admin',
      icon: ShieldAlert,
      badge: 'SAAS',
      roles: ['SUPER_ADMIN'],
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'GENERAL_MANAGER'],
    },
  ];

  // Filter based on logged-in user role (or allow all if still loading / not set)
  const navigation = allNavigation.filter((item) => {
    if (!user?.role) return true;
    return item.roles.includes(user.role);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <ShoppingCart className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-tight leading-tight">Cash & Carry</div>
          <div className="text-[11px] font-medium text-blue-400 tracking-wider">MANAGEMENT SAAS</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                  <span>{item.name}</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Quick POS
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                  : 'hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="text-xs font-semibold text-white truncate">{tenant?.name || 'ABC Mart Pvt. Ltd.'}</div>
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
          <span>PKR Currency</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
            FBR Ready
          </span>
        </div>
      </div>
    </aside>
  );
}
