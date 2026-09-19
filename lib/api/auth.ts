import type { ApiClient, QueryParams } from "./client";
import { getConfig } from "@/lib/constants/config";

export interface AuthUser {
  id: string;
  email: string | null;
  displayName?: string | null;
  avatar?: string | null;
  role?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn?: number;
  user?: AuthUser;
}

/** Neo ID token endpoint returns snake_case inside { ok, data }. */
interface NeoIdTokenData {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token: string;
  id_token?: string;
}

function toAuthTokens(json: unknown): AuthTokens {
  const data = (json as { data?: NeoIdTokenData })?.data ?? (json as NeoIdTokenData);
  if (!data || typeof data.access_token !== "string" || typeof data.refresh_token !== "string") {
    throw new Error("Malformed Neo ID token response");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Calls the Neo ID token endpoint directly from the browser (PKCE public
 * client). Doing the exchange client-side makes Neo ID record the session
 * with the real browser User-Agent instead of the API runtime's.
 */
async function neoIdTokenRequest(body: Record<string, string>): Promise<AuthTokens> {
  const { neoIdIssuer } = getConfig();
  const res = await fetch(`${neoIdIssuer}/api/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) {
    const message =
      (json && typeof json.message === "string" && json.message) ||
      (json && typeof json.error === "string" && json.error) ||
      `Token exchange failed with status ${res.status}`;
    throw new Error(message);
  }
  return toAuthTokens(json);
}

export function authEndpoints(client: ApiClient) {
  return {
    /**
     * Returns the Neo ID authorize URL. With PKCE the client passes the
     * S256 code challenge so the browser can exchange the code later.
     */
    getLoginUrl: (
      redirectUri: string,
      pkce?: { code_challenge?: string; code_challenge_method?: string; state?: string },
    ) =>
      client.get<{ url: string }>("/api/v1/auth/login", {
        redirect_uri: redirectUri,
        ...(pkce?.code_challenge ? { code_challenge: pkce.code_challenge } : {}),
        ...(pkce?.code_challenge_method ? { code_challenge_method: pkce.code_challenge_method } : {}),
        ...(pkce?.state ? { state: pkce.state } : {}),
      }),

    /**
     * Exchange the OAuth code for tokens. When PKCE is configured this runs
     * in the browser (direct Neo ID call); otherwise it falls back to the
     * API's server-side /mobile-callback exchange.
     */
    exchangeCode: async (code: string, redirectUri: string, codeVerifier?: string): Promise<AuthTokens> => {
      const { neoIdClientId } = getConfig();
      if (neoIdClientId && codeVerifier) {
        return neoIdTokenRequest({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: neoIdClientId,
          code_verifier: codeVerifier,
        });
      }
      return client.get<AuthTokens>("/api/v1/auth/mobile-callback", {
        code,
        redirect_uri: redirectUri,
      } satisfies QueryParams);
    },

    /** Rotate the refresh token. PKCE: direct Neo ID call (keeps the device info). */
    refresh: (refreshToken: string): Promise<AuthTokens> => {
      const { neoIdClientId } = getConfig();
      if (neoIdClientId) {
        return neoIdTokenRequest({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: neoIdClientId,
        });
      }
      return client.post<AuthTokens>("/api/v1/auth/refresh", { refreshToken });
    },

    profile: () => client.get<AuthUser>("/api/v1/auth/profile"),

    logout: () => client.post<{ ok: boolean }>("/api/v1/auth/logout"),
  };
}

export type AuthApi = ReturnType<typeof authEndpoints>;
