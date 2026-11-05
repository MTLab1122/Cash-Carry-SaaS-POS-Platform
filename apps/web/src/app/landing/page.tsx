'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Monitor,
  Smartphone,
  Sparkles,
  BarChart3,
  Boxes,
  ShieldCheck,
  Receipt,
  Truck,
  Users,
  Bell,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Layers,
  ChevronDown,
  Calculator,
} from 'lucide-react';

export default function LandingPage() {
  // ROI Calculator State
  const [monthlyRevenue, setMonthlyRevenue] = useState(3000000); // 3M PKR
  const [terminals, setTerminals] = useState(3);
  const [shrinkageRate, setShrinkageRate] = useState(2.5); // 2.5% leakage

  const monthlyShrinkageSavings = Math.round(monthlyRevenue * (shrinkageRate / 100) * 0.65);
  const annualProfitBoost = monthlyShrinkageSavings * 12 + terminals * 45000 * 12;

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Enterprise Cash & Carry Management & POS SaaS',
        operatingSystem: 'Web, Windows, Android, iOS',
        applicationCategory: 'BusinessApplication',
        description:
          'Complete enterprise POS, inventory ledger, and multi-tenant management platform for supermarkets, cash & carry, and wholesale businesses in Pakistan.',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'PKR',
          lowPrice: '7500',
          highPrice: '35000',
        },
      },
      {
        '@type': 'Organization',
        name: 'Cash & Carry SaaS Technologies',
        url: 'https://cashcarry.pk',
        logo: 'https://cashcarry.pk/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+92-42-111-222-333',
          contactType: 'sales',
          areaServed: 'PK',
          availableLanguage: ['English', 'Urdu'],
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Does this POS support offline checkout when the internet disconnects?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. The Windows desktop POS runs locally with durable transactional queues and automatically synchronizes sales with zero data loss once connectivity is restored.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is the platform compliant with Pakistan FBR Tier-1 e-invoicing and 18% GST?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. The system natively calculates 18% GST, outputs NTN/STRN customer receipts, and is structured for direct FBR Tier-1 POS integration.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can we manage multiple branches and central warehouses simultaneously?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. The system provides real-time multi-branch stock visibility, inter-warehouse transfers, centralized purchasing, and consolidated financial reports.',
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <ShoppingCart className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">Cash & Carry</span>
              <span className="ml-1 text-[11px] font-bold text-blue-400 uppercase tracking-widest block leading-none">
                Enterprise SaaS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#roi-calculator" className="hover:text-white transition">ROI Calculator</a>
            <a href="#pakistan-ready" className="hover:text-white transition">FBR Compliance</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/pos"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/25 flex items-center space-x-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/25"
            >
              Management Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Complete Business Solution for Supermarkets, Wholesalers & Retail Stores</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Cash & Carry Management SaaS
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 mt-2">
              Sell Smarter. Grow Faster.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            The mission-critical retail platform powering high-speed checkout counters, multi-warehouse inventory ledgers, and automated business intelligence.
          </p>

          {/* 4 Pillars Badge Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: CheckCircle2, text: 'Web Dashboard' },
              { icon: CheckCircle2, text: 'Windows Desktop POS' },
              { icon: CheckCircle2, text: 'Mobile App' },
              { icon: Sparkles, text: 'AI-Powered Insights' },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={i}
                  className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs sm:text-sm font-semibold shadow-sm"
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{pillar.text}</span>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pos"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Launch Desktop POS</span>
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-base transition flex items-center justify-center space-x-2"
            >
              <span>Explore Web Management</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Pakistan Retail Badge */}
          <div className="mt-12 inline-flex items-center space-x-4 px-5 py-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm">
            <span className="font-bold">🇵🇰 Built For Pakistan:</span>
            <span>PKR Currency</span>
            <span className="text-emerald-500">•</span>
            <span>18% GST Natively Calculated</span>
            <span className="text-emerald-500">•</span>
            <span>FBR Tier-1 Invoicing Architecture</span>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="roi-calculator" className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Value Estimation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Interactive Retail ROI & Leakage Calculator
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Estimate your monthly shrinkage savings and operational boost with automated inventory & cashier audits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-semibold text-slate-300 mb-2">
                  <span>Monthly Store Revenue:</span>
                  <span className="text-emerald-400 font-mono">
                    PKR {monthlyRevenue.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="20000000"
                  step="250000"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold text-slate-300 mb-2">
                  <span>Active Checkout Lanes:</span>
                  <span className="text-blue-400 font-mono">{terminals} Registers</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={terminals}
                  onChange={(e) => setTerminals(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold text-slate-300 mb-2">
                  <span>Estimated Inventory Shrinkage:</span>
                  <span className="text-amber-400 font-mono">{shrinkageRate}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={shrinkageRate}
                  onChange={(e) => setShrinkageRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Estimated Financial Impact
                </span>
                <div className="mt-4">
                  <div className="text-xs text-slate-400">Monthly Shrinkage Recovered:</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-0.5">
                    PKR {monthlyShrinkageSavings.toLocaleString()}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400">Projected Annual Profit Boost:</div>
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 font-mono mt-0.5">
                    PKR {annualProfitBoost.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-[11px] text-slate-500">
                * Based on double-entry FIFO stock ledger, blind cashier shift balancing, and barcode checkout throughput.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Feature Grid */}
      <section id="features" className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              An End-to-End Cash & Carry Ecosystem
            </h2>
            <p className="mt-3 text-base text-slate-400">
              Engineered specifically for supermarkets, grocery stores, and high-volume wholesale cash & carry operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[
              {
                icon: ShoppingCart,
                title: 'POS Billing & Returns',
                desc: 'Sub-500ms barcode scanning, multi-tender payments (Cash, Card, Credit), receipt thermal printing, and shrinkage-classified returns.',
              },
              {
                icon: Boxes,
                title: 'Inventory & Warehouse',
                desc: 'Multi-branch stock balances, batch expiry tracking, FIFO valuation, inter-branch transfers, and real-time low-stock thresholds.',
              },
              {
                icon: Receipt,
                title: 'Barcode Generation & Labels',
                desc: 'EAN-13 automatic check-digit computation, Code 128, and printable sticky shelf labels for unbarcoded bulk items.',
              },
              {
                icon: Truck,
                title: 'Purchases & GRN Receiving',
                desc: 'Complete supplier purchase orders, goods receipt notes (GRN), landed cost calculations, and supplier credit tracking.',
              },
              {
                icon: Users,
                title: 'Customer Accounts & Credit',
                desc: 'Customer credit ledger, loyalty points accrual, credit limits, account aging statements, and SMS receipt readiness.',
              },
              {
                icon: DollarSign,
                title: 'Financial Statements & P&L',
                desc: 'Automatic COGS calculation, gross margins, expense tracking, net profit & loss, receivables, and payables ledger.',
              },
              {
                icon: Monitor,
                title: 'Offline POS & Auto-Sync',
                desc: 'High-reliability Windows desktop POS with local transactional database and zero-failure background mutation synchronization.',
              },
              {
                icon: Sparkles,
                title: 'AI Business Intelligence',
                desc: 'Plug-and-play LLM connector for sales forecasting, dead-stock identification, automated reorder triggers, and natural-language queries.',
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-950 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* End-to-End Business Flow Diagram */}
      <section className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            End-to-End Retail Workflow
          </h2>
          <p className="text-sm text-slate-400 mb-10">
            Streamlined from checkout counter to financial audit.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { step: '1', title: 'Scan Products', desc: 'EAN-13 Barcode' },
              { step: '2', title: 'Process Payment', desc: 'Cash / Card / Khata' },
              { step: '3', title: 'Print Receipt', desc: '80mm Thermal' },
              { step: '4', title: 'Auto Stock Update', desc: 'Real-time FIFO' },
              { step: '5', title: 'Ledger Audit', desc: 'P&L / Tax Report' },
              { step: '6', title: 'AI Insights', desc: 'Predict & Grow' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center relative"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2 shadow-md shadow-blue-600/30">
                  {item.step}
                </div>
                <div className="font-bold text-sm text-white">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400 mt-1">Everything you need to know about implementation and compliance.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What hardware is required for the checkout counter?',
                a: 'Any standard Windows PC or POS terminal with a USB or Bluetooth 1D/2D barcode scanner, 80mm ESC/POS thermal printer, and standard RJ11 cash drawer.',
              },
              {
                q: 'How does offline synchronization protect against power outages?',
                a: 'Sales are committed immediately to the local transactional SQLite engine. When power or internet recovers, our outbox sync daemon pushes records with idempotent keys to prevent double-charging.',
              },
              {
                q: 'Can custom roles be created for cashiers vs auditors?',
                a: 'Yes. Granular RBAC enforces that Cashiers can only perform checkouts, Branch Managers can approve returns, and Accountants/Auditors have access to financial ledgers.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <div className="font-semibold text-white text-sm sm:text-base mb-1">{item.q}</div>
                <div className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 text-slate-500 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 Enterprise Cash & Carry Management SaaS. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <a href="/llms.txt" className="hover:text-slate-300 transition">llms.txt</a>
            <a href="/llms-full.txt" className="hover:text-slate-300 transition">llms-full.txt</a>
            <a href="/sitemap.xml" className="hover:text-slate-300 transition">Sitemap</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
