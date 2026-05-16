'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@/types';
import { MOCK_USER } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [isLoading] = useState(false);

  async function login(email: string, password: string) {
    void email;
    void password;
    setUser(MOCK_USER);
  }

  async function register(email: string, password: string) {
    void email;
    void password;
    setUser(MOCK_USER);
  }

  async function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
