// Next 16 proxy (middleware). Makes ?lang=ru-RU / ?lang=en-US / ?lang=uk-UA
// (also accepts bare codes) drive the whole request: the locale cookie is set
// for the current SSR (layout, metadata, content fetches) and persisted for
// subsequent requests, so shared links and bots get fully localized pages per
// URL without any page code changes.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, normalizeLangParam } from "@/lib/i18n";

/** Replace/add one cookie inside a raw Cookie header, preserving the rest. */
function mergeCookie(header: string | null, name: string, value: string): string {
  const parts = (header ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !p.toLowerCase().startsWith(`${name.toLowerCase()}=`));
  parts.push(`${name}=${value}`);
  return parts.join("; ");
}

export function proxy(request: NextRequest) {
  const locale = normalizeLangParam(request.nextUrl.searchParams.get("lang"));
  if (!locale) return NextResponse.next();

  // Forward the locale to the current request so cookies()/getLocale() on the
  // server already see it (Set-Cookie alone only applies from the next request).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("cookie", mergeCookie(requestHeaders.get("cookie"), LOCALE_COOKIE, locale));

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // Persist the preference for future (param-less) visits.
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: "/((?!api|_next|favicon|.*\\..*).*)",
};
