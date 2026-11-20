import type { AstroCookies } from "astro";
import type { Api } from "../api";
import type { Session, User } from "../api/account-types";
import { ApiError } from "../api/client";

const ACCESS_COOKIE = "nw_access";
const REFRESH_COOKIE = "nw_refresh";
const USER_COOKIE = "nw_user";

const REFRESH_MAX_AGE = 30 * 24 * 3600;
const REFRESH_MARGIN_MS = 30_000;

export interface SessionInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User | null;
}

export function readSession(cookies: AstroCookies): SessionInfo | null {
  const accessToken = cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookies.get(REFRESH_COOKIE)?.value;
  if (!accessToken || !refreshToken) return null;
  const stored = decodeUser(cookies);
  return { accessToken, refreshToken, expiresAt: stored.expiresAt, user: stored.user };
}

export function writeSession(cookies: AstroCookies, session: Session): SessionInfo {
  const expiresAt = Date.now() + session.expiresIn * 1000;
  const base = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: !import.meta.env.DEV };
  cookies.set(ACCESS_COOKIE, session.accessToken, { ...base, maxAge: session.expiresIn });
  cookies.set(REFRESH_COOKIE, session.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
  cookies.set(USER_COOKIE, btoa(JSON.stringify({ user: session.user, expiresAt })), {
    ...base,
    maxAge: REFRESH_MAX_AGE,
  });
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt,
    user: session.user,
  };
}

export function clearSession(cookies: AstroCookies): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE]) cookies.delete(name, { path: "/" });
}

export async function resolveSession(cookies: AstroCookies, api: Api): Promise<SessionInfo | null> {
  const stored = readSession(cookies);
  if (!stored) return null;
  if (stored.expiresAt - Date.now() > REFRESH_MARGIN_MS) return stored;
  try {
    return writeSession(cookies, await api.account.refresh(stored.refreshToken));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
      clearSession(cookies);
      return null;
    }
    return stored;
  }
}

function decodeUser(cookies: AstroCookies): { user: User | null; expiresAt: number } {
  const raw = cookies.get(USER_COOKIE)?.value;
  if (!raw) return { user: null, expiresAt: 0 };
  try {
    const parsed = JSON.parse(atob(raw)) as { user?: User; expiresAt?: number };
    return { user: parsed.user ?? null, expiresAt: parsed.expiresAt ?? 0 };
  } catch {
    return { user: null, expiresAt: 0 };
  }
}
