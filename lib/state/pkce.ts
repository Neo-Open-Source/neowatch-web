// PKCE (RFC 7636) helpers for the browser-side OAuth code exchange with
// Neo ID. The verifier is generated in the browser, persisted for the
// duration of the redirect flow (sessionStorage survives the round-trip to
// the consent page and back), and consumed once the callback page exchanges
// the code. The OAuth `state` value is handled here too — it is bound to the
// login attempt at signIn time and verified in the callback (login CSRF).

const VERIFIER_KEY = "nw_pkce_verifier";
const STATE_KEY = "nw_oauth_state";

/** base64url (RFC 4648 §5, no padding). */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * True when the secure-context WebCrypto APIs are available. `crypto.subtle`
 * exists only on HTTPS (or http://localhost); on plain-http LAN origins
 * (e.g. a smart-TV dev box) it is undefined, so the login flow falls back to
 * the API's server-side exchange instead of throwing.
 */
export function pkceSupported(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function" &&
    !!crypto.subtle
  );
}

/** Random 64-byte verifier (well above the 43–128 char spec range). */
export function createCodeVerifier(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/** S256 challenge: base64url(SHA-256(verifier)). */
export async function codeChallengeFromVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export function savePkceVerifier(verifier: string): void {
  try {
    sessionStorage.setItem(VERIFIER_KEY, verifier);
  } catch {
    /* storage unavailable — exchange falls back to the server path */
  }
}

/** Reads and clears the stored verifier (single use). */
export function consumePkceVerifier(): string | null {
  try {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
    return verifier;
  } catch {
    return null;
  }
}

/** Random OAuth `state` bound to this login attempt (CSRF protection). */
export function createOAuthState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function saveOAuthState(state: string): void {
  try {
    sessionStorage.setItem(STATE_KEY, state);
  } catch {
    /* storage unavailable — state check is skipped */
  }
}

/** Reads and clears the stored state (single use). */
export function consumeOAuthState(): string | null {
  try {
    const state = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
    return state;
  } catch {
    return null;
  }
}
