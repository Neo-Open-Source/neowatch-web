// Env-флаги. NEXT_PUBLIC_* доступны и на сервере и на клиенте после сборки.
// Читаем напрямую из process.env — не кешируем в константу модуля,
// чтобы значение не замораживалось при tree-shaking в клиентских бандлах.

// Fallback for fresh Vercel deployments: without NEXT_PUBLIC_API_URL the app
// would build but every API/image call would go to a relative /api path and
// 404. Override via the env var once the real host is known.
const DEFAULT_API_URL = "https://neowatch-api-ts.vercel.app";

// Neo ID (identity provider). When NEXT_PUBLIC_NEOID_CLIENT_ID is set, the
// OAuth code is exchanged from the browser via PKCE (so the Neo ID session is
// recorded with the real device); otherwise the app falls back to the API's
// server-side exchange.
const DEFAULT_NEOID_ISSUER = "https://id.neome.uk";

export function getConfig() {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
  return {
    showHitboxes: process.env.NEXT_PUBLIC_SHOW_HITBOXES === "true",
    apiUrl,
    neoIdIssuer: (process.env.NEXT_PUBLIC_NEOID_ISSUER ?? DEFAULT_NEOID_ISSUER).replace(/\/$/, ""),
    neoIdClientId: process.env.NEXT_PUBLIC_NEOID_CLIENT_ID ?? "",
  };
}
