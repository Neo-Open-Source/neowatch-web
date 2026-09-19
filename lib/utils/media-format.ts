// Shared media display formatting (runtime, dates).

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatAirDate(date: string | null | undefined, locale: string): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** 4-digit release year from an ISO date, e.g. "2023-05-12" -> "2023". */
export function releaseYear(date: string | null | undefined): string | null {
  if (!date) return null;
  const year = date.slice(0, 4);
  return year.length === 4 ? year : null;
}

// Wrapper for the NeoWatch image proxy (/api/v1/image/{size}/file.jpg). The API
// returns a low-res variant by default, so re-request the same file at a
// sharper size. URLs that are not from the proxy pass through unchanged.
const NEOWATCH_IMAGE_SIZE_RE = /\/api\/v1\/image\/[A-Za-z0-9]+\//;

export function imageAtSize(url: string | null | undefined, size: string): string | null {
  if (!url) return null;
  if (NEOWATCH_IMAGE_SIZE_RE.test(url)) {
    return url.replace(NEOWATCH_IMAGE_SIZE_RE, `/api/v1/image/${size}/`);
  }
  return url;
}