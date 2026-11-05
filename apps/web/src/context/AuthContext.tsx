'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  branchId?: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  isFbrReady?: boolean;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  branches: Branch[];
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch) => void;
  activeSession: any | null;
  setActiveSession: (session: any | null) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const token = localStorage.getItem('cashcarry_token');
        if (token) {
          const profile = await apiFetch('/auth/me');
          setUser(profile);
          setTenant(profile.tenant);
          if (profile.tenant?.branches) {
            setBranches(profile.tenant.branches);
            const savedBranchId = localStorage.getItem('cashcarry_branch_id');
            const match = profile.tenant.branches.find((b: any) => b.id === savedBranchId) || profile.tenant.branches[0];
            setCurrentBranch(match);
          }
        } else {
          // Auto login as demo Business Owner if no credentials stored
          await login('admin@abcmart.pk', 'Admin123!');
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err);
        // Fallback default state
        const fallbackTenant = {
          id: 'tenant-demo-1',
          name: 'ABC Mart & Cash Carry Pvt Ltd',
          slug: 'metro-pk',
          currency: 'PKR',
          timezone: 'Asia/Karachi',
          isFbrReady: true,
        };
        const fallbackBranch = {
          id: 'branch-demo-1',
          name: 'Gulberg Superstore (Main Branch)',
          code: 'BR-01',
          isMain: true,
        };
        setUser({
          id: 'user-demo-1',
          name: 'Muhammad Tariq',
          email: 'admin@abcmart.pk',
          role: 'BUSINESS_OWNER',
          tenantId: 'tenant-demo-1',
          branchId: 'branch-demo-1',
        });
        setTenant(fallbackTenant);
        setBranches([
          fallbackBranch,
          { id: 'branch-demo-2', name: 'DHA Phase 5 Express', code: 'BR-02', isMain: false },
        ]);
        setCurrentBranch(fallbackBranch);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      localStorage.setItem('cashcarry_token', res.accessToken);
      setUser(res.user);
      setTenant(res.user.tenant);
      if (res.user.activeSession) {
        setActiveSession(res.user.activeSession);
      }

      // Fetch branches
      const branchList = await apiFetch('/branches');
      setBranches(branchList);
      const active = branchList.find((b: any) => b.isMain) || branchList[0];
      setCurrentBranch(active);
    } catch (e: any) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cashcarry_token');
    localStorage.removeItem('cashcarry_branch_id');
    setUser(null);
    setTenant(null);
    setCurrentBranch(null);
    setActiveSession(null);
  };

  const handleSetCurrentBranch = (branch: Branch) => {
    setCurrentBranch(branch);
    localStorage.setItem('cashcarry_branch_id', branch.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        branches,
        currentBranch,
        setCurrentBranch: handleSetCurrentBranch,
        activeSession,
        setActiveSession,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
