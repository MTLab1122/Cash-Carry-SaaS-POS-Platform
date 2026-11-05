import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CommandPalette } from '../components/CommandPalette';

export const metadata = {
  title: 'Enterprise Cash & Carry Management & POS SaaS',
  description: 'Production-grade Multi-Tenant POS & Management System for Supermarkets and Retailers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <AuthProvider>
          <div className="flex flex-1 min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-6 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
          <CommandPalette />
        </AuthProvider>
      </body>
    </html>
  );
}
