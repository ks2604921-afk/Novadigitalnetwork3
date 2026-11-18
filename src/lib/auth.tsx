import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, AuthUser } from "./supabase";
import { authAction } from "./auth.functions";

const SESSION_KEY = "nova_session_token";

type Action = "request-otp" | "verify-otp" | "set-pin" | "login-pin" | "me" | "logout";

type AuthData = {
  session?: unknown;
  error?: unknown;
  is_new?: unknown;
  otp?: unknown;
  needs_pin?: unknown;
  user_id?: unknown;
};

async function callAuth(action: Action, payload: Record<string, unknown>): Promise<{
  ok: boolean;
  status: number;
  data: AuthData;
}> {
  try {
    const res = await authAction({ data: { action, payload } });
    return { ...res, data: res.data as AuthData };
  } catch {
    return { ok: false, status: 500, data: { error: "Network error. Try again." } };
  }
}

type AuthState = {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  requestOtp: (phone: string) => Promise<{ isNew: boolean; otp?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  setPin: (phone: string, pin: string) => Promise<void>;
  loginPin: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Keep one context instance across hot reloads so the provider and consumers always match.
const g = globalThis as { __novaAuthContext?: React.Context<AuthState | null> };
const AuthContext = (g.__novaAuthContext ??= createContext<AuthState | null>(null));

import { createContext, useContext } from "react";
import type React from "react";

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem(SESSION_KEY);
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { ok, data } = await callAuth("me", { token });
      if (cancelled) return;
      if (ok && data.session) {
        setSession(data.session as Session);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((sess: Session) => {
    localStorage.setItem(SESSION_KEY, sess.token);
    setSession(sess);
  }, []);

  const requestOtp = useCallback(async (phone: string): Promise<{ isNew: boolean; otp?: string }> => {
    const { ok, data } = await callAuth("request-otp", { phone });
    if (!ok) throw new Error((data.error as string) || "Could not send OTP");
    return data.otp ? { isNew: Boolean(data.is_new), otp: String(data.otp) } : { isNew: Boolean(data.is_new) };
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, code: string): Promise<void> => {
      const { ok, data } = await callAuth("verify-otp", { phone, code });
      if (!ok || !data.session) throw new Error((data.error as string) || "Invalid code");
      persist(data.session as Session);
    },
    [persist],
  );

  const setPin = useCallback(
    async (phone: string, pin: string): Promise<void> => {
      const { ok, data } = await callAuth("set-pin", { phone, pin });
      if (!ok || !data.session) {
        throw new Error((data.error as string) || "Could not set PIN");
      }
      persist(data.session as Session);
    },
    [persist],
  );

  const loginPin = useCallback(
    async (phone: string, pin: string): Promise<void> => {
      const { ok, data } = await callAuth("login-pin", { phone, pin });
      if (!ok || !data.session) {
        throw new Error((data.error as string) || "Login failed");
      }
      persist(data.session as Session);
    },
    [persist],
  );

  const logout = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) {
      await callAuth("logout", { token });
      localStorage.removeItem(SESSION_KEY);
    }
    setSession(null);
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    loading,
    requestOtp,
    verifyOtp,
    setPin,
    loginPin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
