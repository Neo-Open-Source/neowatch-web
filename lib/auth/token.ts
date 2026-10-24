import { getConfig } from "@/lib/constants/config";
import {
  clearSession,
  getStoredRefreshToken,
  persistSession,
} from "@/lib/state/auth-session";
import { clearFavoritesSnapshot } from "@/lib/state/favorites-cache";

interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn?: number;
}

class RefreshError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RefreshError";
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Browser sessions are issued to the public PKCE client. They must be
 * refreshed at Neo ID with that same client_id — the API's confidential
 * refresh endpoint rejects them.
 */
async function refreshNeoIdToken(refreshToken: string): Promise<RefreshedTokens> {
  const { neoIdIssuer, neoIdClientId } = getConfig();
  const res = await fetch(`${neoIdIssuer}/api/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: neoIdClientId,
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    data?: {
      access_token?: string;
      refresh_token?: string;
      id_token?: string;
      expires_in?: number;
    };
  } | null;

  const data = json?.data;
  if (!res.ok || !data?.access_token || !data.refresh_token) {
    throw new RefreshError(
      `Neo ID refresh failed: ${res.status}`,
      res.status,
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in,
  };
}

async function refreshViaApi(refreshToken: string): Promise<RefreshedTokens> {
  const res = await fetch(`${getConfig().apiUrl}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: RefreshedTokens;
  } | null;

  if (!res.ok || !json?.success || !json.data?.accessToken || !json.data.refreshToken) {
    throw new RefreshError(`Session refresh failed: ${res.status}`, res.status);
  }
  return json.data;
}

function refreshTokens(refreshToken: string): Promise<RefreshedTokens> {
  const { neoIdClientId } = getConfig();
  return neoIdClientId
    ? refreshNeoIdToken(refreshToken)
    : refreshViaApi(refreshToken);
}

async function refreshOnce(refreshToken: string): Promise<boolean> {
  try {
    const tokens = await refreshTokens(refreshToken);
    persistSession(tokens);
    accessToken = tokens.accessToken;
    return true;
  } catch (error) {
    const status = error instanceof RefreshError ? error.status : 0;
    const rejected = status === 400 || status === 401 || status === 403;

    if (!rejected) {
      // Network/5xx: keep the session so the next request can retry.
      return false;
    }

    // A concurrent tab may have rotated the token while this request was in
    // flight. Read storage again before treating the session as dead.
    const latest = getStoredRefreshToken();
    if (latest && latest !== refreshToken) {
      try {
        const tokens = await refreshTokens(latest);
        persistSession(tokens);
        accessToken = tokens.accessToken;
        return true;
      } catch {
        /* fall through to clearing the invalid session */
      }
    }

    clearSession();
    clearFavoritesSnapshot();
    accessToken = null;
    return false;
  }
}

export async function tryRefreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      clearSession();
      accessToken = null;
      return false;
    }
    return refreshOnce(refreshToken);
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
