"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import { api, setAccessToken } from "@/lib/api";
import type { AuthUser } from "@/lib/api";
import {
  clearSession,
  getAuthRedirectUri,
  getStoredAccessToken,
  getStoredUser,
  persistSession,
  persistUser,
} from "@/lib/state/auth-session";
import { clearFavoriteChecks, clearFavoritesSnapshot } from "@/lib/state/favorites-cache";
import { getConfig } from "@/lib/constants/config";
import {
  codeChallengeFromVerifier,
  consumeOAuthState,
  consumePkceVerifier,
  createCodeVerifier,
  createOAuthState,
  pkceSupported,
  saveOAuthState,
  savePkceVerifier,
} from "@/lib/state/pkce";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Apply tokens after OAuth callback (updates React state). */
  applySession: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      setAccessToken(null);
      return;
    }
    setAccessToken(token);
    try {
      const profile = await api.auth.profile();
      persistUser(profile);
      setUser(profile);
    } catch {
      setUser(getStoredUser());
    }
  }, []);

  useEffect(() => {
    const token = getStoredAccessToken();
    const cached = getStoredUser();
    if (!token) {
      startTransition(() => setLoading(false));
      return;
    }
    setAccessToken(token);
    if (cached) startTransition(() => setUser(cached));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProfile().finally(() => startTransition(() => setLoading(false)));
  }, [refreshProfile]);

  const signIn = useCallback(async () => {
    const redirectUri = getAuthRedirectUri();
    const { neoIdClientId } = getConfig();

    // Bind a fresh `state` to this login attempt so the callback can reject
    // forged redirects (login CSRF).
    const state = createOAuthState();
    saveOAuthState(state);

    // PKCE: keep the verifier for the callback, hand the S256 challenge to
    // Neo ID so the code can be exchanged from the browser (the session is
    // then recorded with the real device, not the API runtime). If the client
    // id is unset — or WebCrypto is unavailable (plain-http LAN, e.g. a
    // smart-TV) — fall back to the API's server-side exchange.
    if (neoIdClientId && pkceSupported()) {
      const verifier = createCodeVerifier();
      savePkceVerifier(verifier);
      const code_challenge = await codeChallengeFromVerifier(verifier);
      const { url } = await api.auth.getLoginUrl(redirectUri, {
        code_challenge,
        code_challenge_method: "S256",
        state,
      });
      window.location.assign(url);
      return;
    }

    const { url } = await api.auth.getLoginUrl(redirectUri, { state });
    window.location.assign(url);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore network errors on logout */
    }
    clearSession();
    clearFavoritesSnapshot();
    clearFavoriteChecks();
    setAccessToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((next: AuthUser) => {
    setUser(next);
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      signIn,
      signOut,
      refreshProfile,
      applySession,
    }),
    [user, loading, signIn, signOut, refreshProfile, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Complete OAuth: verify state, exchange code → persist session → return profile. */
export async function completeOAuthLogin(code: string, state?: string | null): Promise<AuthUser> {
  const redirectUri = getAuthRedirectUri();

  // Login CSRF guard: the `state` echoed by Neo ID must match the one we
  // generated when this login attempt started.
  const expectedState = consumeOAuthState();
  if (expectedState && state !== expectedState) {
    throw new Error("OAuth state mismatch");
  }

  const verifier = consumePkceVerifier();
  const tokens = await api.auth.exchangeCode(code, redirectUri, verifier ?? undefined);
  const normalized: AuthUser | null = tokens.user
    ? {
        id: tokens.user.id,
        email: tokens.user.email ?? null,
        displayName: tokens.user.displayName ?? null,
        avatar: tokens.user.avatar ?? null,
        role: tokens.user.role ?? null,
      }
    : null;

  persistSession(tokens, normalized);
  setAccessToken(tokens.accessToken);

  if (normalized) {
    persistUser(normalized);
    return normalized;
  }

  const profile = await api.auth.profile();
  persistUser(profile);
  return profile;
}
