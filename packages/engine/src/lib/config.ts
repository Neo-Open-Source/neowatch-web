import { env } from "cloudflare:workers";

const FALLBACK_API_ORIGIN = "https://api.neome.uk";

// Captured once at module init so every prerendered page and the version
// endpoint share one id within a build, and the id changes between builds.
const BUILD_TIME = String(Date.now());

function trim(value: string): string {
  return value.replace(/\/+$/, "");
}

export function apiOrigin(): string {
  return trim(import.meta.env.API_ORIGIN || env.API_ORIGIN || FALLBACK_API_ORIGIN);
}

export function siteOrigin(request: Request): string {
  return trim(import.meta.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || new URL(request.url).origin);
}

export function buildId(): string {
  return import.meta.env.BUILD_ID || env.BUILD_ID || BUILD_TIME;
}
