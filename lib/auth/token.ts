import { getConfig } from "@/lib/constants/config";
import {
  clearSession,
  getStoredRefreshToken,
  persistSession,
} from "@/lib/state/auth-session";
import { clearFavoritesSnapshot } from "@/lib/state/favorites-cache";

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
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

    try {
      // Direct REST call — no NeoApi client — avoids refresh recursion and
      // circular imports with lib/api.
      const res = await fetch(`${getConfig().apiUrl}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error(`refresh failed: ${res.status}`);

      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          accessToken: string;
          refreshToken: string;
          idToken?: string;
          expiresIn?: number;
        };
      };
      const tokens = json.data;
      if (!json.success || !tokens?.accessToken) throw new Error("invalid refresh response");

      persistSession(tokens);
      accessToken = tokens.accessToken;
      return true;
    } catch {
      clearSession();
      clearFavoritesSnapshot();
      accessToken = null;
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
