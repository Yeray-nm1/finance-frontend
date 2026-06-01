'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthContextType } from '@/types/auth-context';
import type { User } from '@/types/auth';
import { api } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.auth.me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await api.auth.register(email, password);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading,
  }), [user, login, register, logout, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
