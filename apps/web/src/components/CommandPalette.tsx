'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  Truck,
  Users,
  DollarSign,
  BarChart3,
  Sparkles,
  Settings,
  ShieldAlert,
  ArrowRight,
  Plus,
  Command,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions';
  icon: any;
  href?: string;
  action?: () => void;
  roles?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'nav-pos',
      title: 'Open POS Terminal',
      category: 'Navigation',
      icon: ShoppingCart,
      href: '/pos',
    },
    {
      id: 'action-new-product',
      title: 'New Product Registration',
      category: 'Actions',
      icon: Plus,
      href: '/products',
      roles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER'],
    },
    {
      id: 'nav-products',
      title: 'Products & Barcode Catalog',
      category: 'Navigation',
      icon: Package,
      href: '/products',
    },
    {
      id: 'nav-inventory',
      title: 'Stock Ledger & Adjustments',
      category: 'Navigation',
      icon: Boxes,
      href: '/inventory',
    },
    {
      id: 'nav-sales',
      title: 'Sales History & Returns',
      category: 'Navigation',
      icon: Receipt,
      href: '/sales',
    },
    {
      id: 'nav-purchases',
      title: 'Purchase Orders & GRN Receiving',
      category: 'Navigation',
      icon: Truck,
      href: '/purchases',
    },
    {
      id: 'nav-customers',
      title: 'Customer Accounts & Credit Ledger',
      category: 'Navigation',
      icon: Users,
      href: '/customers',
    },
    {
      id: 'nav-finance',
      title: 'Financial Statements & P&L',
      category: 'Navigation',
      icon: DollarSign,
      href: '/finance',
    },
    {
      id: 'nav-reports',
      title: 'Reports & Business Analytics',
      category: 'Navigation',
      icon: BarChart3,
      href: '/reports',
    },
    {
      id: 'nav-ai',
      title: 'AI Business Insights & Advisor',
      category: 'Navigation',
      icon: Sparkles,
      href: '/ai-assistant',
    },
    {
      id: 'nav-admin',
      title: 'SaaS Platform Admin Panel',
      category: 'Navigation',
      icon: ShieldAlert,
      href: '/admin',
      roles: ['SUPER_ADMIN'],
    },
    {
      id: 'nav-settings',
      title: 'Tenant & Branch Settings',
      category: 'Navigation',
      icon: Settings,
      href: '/settings',
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    // Role check
    if (cmd.roles && user && !cmd.roles.includes(user.role)) {
      return false;
    }
    if (!query) return true;
    return cmd.title.toLowerCase().includes(query.toLowerCase());
  });

  const handleSelect = (cmd: CommandItem) => {
    setOpen(false);
    setQuery('');
    if (cmd.action) {
      cmd.action();
    } else if (cmd.href) {
      router.push(cmd.href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search modules... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-slate-800 placeholder-slate-400 bg-transparent text-sm focus:outline-none font-medium"
          />
          <div className="flex items-center space-x-1">
            <kbd className="px-2 py-0.5 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
              ESC
            </kbd>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No matching modules or actions found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center text-slate-500 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{cmd.title}</div>
                      <div className="text-[11px] text-slate-400 group-hover:text-blue-500">
                        {cmd.category}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition text-blue-600" />
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Navigation Quick-Switch</span>
          </div>
          <div className="flex items-center space-x-1">
            <Command className="w-3 h-3" />
            <span>+ K to toggle anywhere</span>
          </div>
        </div>
      </div>
    </div>
  );
}
