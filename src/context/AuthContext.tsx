// context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { getUserFromToken } from '@/lib/auth';

type AuthContextType = {
  id: string | null;
  role: string | null;
  isAuthenticated: boolean;
  token: string | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [id, setId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const localToken = localStorage.getItem('token');
    if (!localToken) return;

    const user = getUserFromToken();
    if (user) {
      setId(user.id);
      setRole(user.role);
      setToken(localToken);
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setId(null);
    setRole(null);
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ id, role, isAuthenticated: !!id, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
