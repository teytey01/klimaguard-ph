"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { IAuthMeResponse, IAuthSession } from "@/types";

export interface IAuthProviderProps {
  children: React.ReactNode;
}

interface IAuthContextValue {
  session: IAuthSession | null;
  /** Adopt a session returned by a server auth route (cookie already set). */
  signIn: (session: IAuthSession) => void;
  /** End the server session (clears the HTTP-only cookie). */
  signOut: () => Promise<void>;
  /** Re-read the session from GET /api/auth/me. */
  refresh: () => Promise<void>;
  /** True once the initial /api/auth/me check has resolved. */
  ready: boolean;
}

// Legacy client-only session key from before the DB integration. Cleared on
// load so stale localStorage sessions can't masquerade as signed in.
const LEGACY_SESSION_KEY = "klimaguard-session";

const AuthContext = createContext<IAuthContextValue | undefined>(undefined);

async function fetchSession(): Promise<IAuthSession | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as IAuthMeResponse;
    return body.session;
  } catch {
    return null;
  }
}

/**
 * Server-backed auth context. The HTTP-only `kg_session` cookie is the source
 * of truth; this provider only mirrors GET /api/auth/me for the UI.
 */
export default function AuthProvider({ children }: IAuthProviderProps) {
  const [session, setSession] = useState<IAuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
      // ignore storage failures
    }
    let active = true;
    void fetchSession().then((s) => {
      if (active) {
        setSession(s);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((next: IAuthSession) => {
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the network call fails, drop the local view of the session.
    }
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    setSession(await fetchSession());
  }, []);

  return (
    <AuthContext.Provider value={{ session, signIn, signOut, refresh, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Read the auth context. Throws (in Filipino) if used outside the provider. */
export function useAuth(): IAuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("Kailangang gamitin ang useAuth sa loob ng AuthProvider.");
  }
  return context;
}
