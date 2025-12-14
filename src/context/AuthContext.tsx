/* eslint-disable react-hooks/exhaustive-deps */
// AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api"; // <- important: folosește clientul tău care adaugă Authorization

type AuthExtras = {
  isPartner?: boolean;
  isAdmin?: boolean;
  isModerator?: boolean;
    hasStripeAccount?: boolean;
  stripeAccountId?: string | null;
};

type AuthContextType = {
  id: string | null;
  token: string | null;
  isAuthenticated: boolean;

  isPartner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
   flagsLoaded: boolean;
   hasStripeAccount: boolean;
  stripeAccountId: string | null;

  login: (token: string, extras?: AuthExtras) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [id, setId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // flags doar în memorie
  const [isPartner, setIsPartner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);


  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // 1) mic helper care aduce rolurile din backend pe baza tokenului curent
 const loadFlagsFromServer = async () => {
  if (!token) { setFlagsLoaded(true); return; }
  try {
    const res = await api.get("/users/auth/me");
    const { is_partner, is_admin, is_moderator, stripe_account_id, has_stripe_account } = res.data || {};
    if (!mounted.current) return;
    setIsPartner(!!is_partner);
    setIsAdmin(!!is_admin);
    setIsModerator(!!is_moderator);
     setHasStripeAccount(has_stripe_account);
    setStripeAccountId(stripe_account_id);
  } catch (e) {
    console.warn("Failed to load auth flags", e);
    if (!mounted.current) return;
    setIsPartner(false);
    setIsAdmin(false);
    setIsModerator(false);
  } finally {
    if (mounted.current) setFlagsLoaded(true);
  }
};

  // 2) bootstrap din token + fetch de roluri
  useEffect(() => {
    const localToken = localStorage.getItem("token");
     if (!localToken) { setFlagsLoaded(true); return; }
    const user = getUserFromToken();
    if (user) {
      setId(user.id);
      setToken(localToken);
    } else {
      setId(null);
      setToken(localToken);
    }
  }, []);

  // când avem token (după bootstrap sau login), adu rolurile
  useEffect(() => {
    if (!token) return;
    loadFlagsFromServer();
  }, [loadFlagsFromServer, token]);

  // 3) login: persistă token, setează id, apoi încarcă rolurile
  const login = (newToken: string, extras?: AuthExtras) => {
    localStorage.setItem("token", newToken);

    const user = getUserFromToken();
    if (user) {
      setId(user.id);
      setToken(newToken);
    } else {
      setId(null);
      setToken(newToken);
    }

    // opțional: dacă primești și extras la login, le aplici imediat (UI mai rapid),
    // dar oricum loadFlagsFromServer va rula după ce se setează token-ul.
    if (extras) {
      setIsPartner(!!extras.isPartner);
      setIsAdmin(!!extras.isAdmin);
      setIsModerator(!!extras.isModerator);
       setHasStripeAccount(!!extras.hasStripeAccount);
    setStripeAccountId(extras.stripeAccountId ?? null);
    }
  };

  const logout = () => {
    const KEEP = ["rememberMe", "rememberEmail", "rememberPassword"] as const;
    const backup: Record<string, string | null> = {};
    KEEP.forEach((k) => (backup[k] = localStorage.getItem(k)));

    localStorage.clear();
    KEEP.forEach((k) => {
      const v = backup[k];
      if (v !== null) localStorage.setItem(k, v);
    });

    setId(null);
    setToken(null);
    setIsPartner(false);
    setIsAdmin(false);
    setIsModerator(false);

    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        id,
        token,
        isAuthenticated: !!id,
        isPartner,
        isAdmin,
        isModerator,
        hasStripeAccount,
        stripeAccountId,
        login,
        logout,
         flagsLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
