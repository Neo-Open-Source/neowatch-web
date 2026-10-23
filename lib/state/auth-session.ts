import type { AuthTokens, AuthUser } from "@/lib/api/auth";

const ACCESS_KEY = "nw_access_token";
const REFRESH_KEY = "nw_refresh_token";
const USER_KEY = "nw_auth_user";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getStoredAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistSession(tokens: AuthTokens, user?: AuthUser | null) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  const nextUser = user ?? tokens.user ?? getStoredUser();
  if (nextUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }
}

export function persistUser(user: AuthUser) {
  if (!canUseStorage()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Canonical OAuth redirect URI for this origin (must match Neo ID app config). */
export function getAuthRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/auth/callback`;
}
