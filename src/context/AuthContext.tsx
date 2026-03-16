"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { getUserFromToken } from "@/lib/auth";
import api from "@/lib/api";

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

  const [isPartner, setIsPartner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);

  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadFlagsFromServer = useCallback(async () => {
    if (!token) {
      if (mounted.current) {
        setIsPartner(false);
        setIsAdmin(false);
        setIsModerator(false);
        setHasStripeAccount(false);
        setStripeAccountId(null);
        setFlagsLoaded(true);
      }
      return;
    }

    if (mounted.current) setFlagsLoaded(false);

    try {
      const res = await api.get("/users/auth/me");
      const {
        is_partner,
        is_admin,
        is_moderator,
        stripe_account_id,
        has_stripe_account,
      } = res.data || {};

      if (!mounted.current) return;

      setIsPartner(!!is_partner);
      setIsAdmin(!!is_admin);
      setIsModerator(!!is_moderator);
      setHasStripeAccount(!!has_stripe_account);
      setStripeAccountId(stripe_account_id ?? null);
    } catch (e) {
      console.warn("Failed to load auth flags", e);

      if (!mounted.current) return;

      setIsPartner(false);
      setIsAdmin(false);
      setIsModerator(false);
      setHasStripeAccount(false);
      setStripeAccountId(null);
    } finally {
      if (mounted.current) setFlagsLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    const localToken = localStorage.getItem("token");

    if (!localToken) {
      setId(null);
      setToken(null);
      setFlagsLoaded(true);
      return;
    }

    const user = getUserFromToken();

    if (user) {
      setId(user.id);
      setToken(localToken);
    } else {
      setId(null);
      setToken(localToken);
    }
  }, []);

  useEffect(() => {
    loadFlagsFromServer();
  }, [loadFlagsFromServer]);

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

    setFlagsLoaded(false);

    if (extras) {
      setIsPartner(!!extras.isPartner);
      setIsAdmin(!!extras.isAdmin);
      setIsModerator(!!extras.isModerator);
      setHasStripeAccount(!!extras.hasStripeAccount);
      setStripeAccountId(extras.stripeAccountId ?? null);
    } else {
      setIsPartner(false);
      setIsAdmin(false);
      setIsModerator(false);
      setHasStripeAccount(false);
      setStripeAccountId(null);
    }
  };

  const logout = () => {
    const KEEP = ["rememberMe", "rememberEmail", "rememberPassword"] as const;
    const backup: Record<string, string | null> = {};

    KEEP.forEach((k) => {
      backup[k] = localStorage.getItem(k);
    });

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
    setHasStripeAccount(false);
    setStripeAccountId(null);
    setFlagsLoaded(true);

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
        flagsLoaded,
        hasStripeAccount,
        stripeAccountId,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};