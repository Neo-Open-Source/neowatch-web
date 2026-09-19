// Social-share (Open Graph / Twitter) metadata helpers. Server-only — used by
// generateMetadata in the root layout and the media/season detail pages so
// that shared links render rich previews (title, localized description,
// backdrop image, rating) in Telegram, WhatsApp, Twitter, etc.

import { headers } from "next/headers";
import type { Metadata } from "next";
import { SITE_NAME, hreflangOf, languages, type Locale } from "@/lib/i18n";
import type { MovieDetails, PersonDetails, Season, SeasonDetails, TVDetails } from "@/lib/api/types";
import { releaseYear } from "@/lib/utils/media-format";

export function ogLocaleOf(locale: Locale): string {
  return hreflangOf(locale).replace("-", "_");
}

/**
 * The other locales the page is available in, as og:locale values — rendered
 * as <meta property="og:locale:alternate"> so social crawlers know the same
 * content exists in those languages.
 */
export function ogLocaleAlternatesOf(locale: Locale): string[] {
  return languages
    .map((l) => l.code)
    .filter((code) => code !== locale)
    .map(ogLocaleOf);
}

/**
 * hreflang alternates for a page. Every language variant lives at its own URL
 * via the ?lang= query param (e.g. /movie/1?lang=ru-RU), so crawlers can index
 * each language separately. x-default points at the unprefixed URL.
 */
export function hreflangLanguages(path: string, base: URL): Record<string, string> {
  const variant = (code: string) => new URL(`${path}?lang=${code}`, base).toString();
  const entries = languages.map((l) => [hreflangOf(l.code), variant(hreflangOf(l.code))] as const);
  return Object.fromEntries([...entries, ["x-default", new URL(path, base).toString()]]);
}

/** The page URL carrying its locale in the canonical ?lang= form. */
export function langUrl(path: string, locale: Locale): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${hreflangOf(locale)}`;
}

/**
 * Absolute base URL for metadata (crawlers reject relative og:image/og:url).
 * Priority: NEXT_PUBLIC_SITE_URL → request headers (works on any host) →
 * localhost fallback.
 */
export async function getMetadataBase(): Promise<URL> {
  try {
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (envUrl) return new URL(envUrl.replace(/\/+$/, ""));
  } catch {
    /* malformed env URL — fall through to request headers */
  }
  try {
    const store = await headers();
    const proto = store.get("x-forwarded-proto") ?? "http";
    const host = store.get("x-forwarded-host") ?? store.get("host");
    if (host) return new URL(`${proto}://${host}`);
  } catch {
    /* headers() unavailable outside a request scope */
  }
  return new URL("http://localhost:3000");
}

/** Absolute URL, resolving relative media images against the site base. */
export async function toAbsoluteUrl(pathOrUrl: string): Promise<string> {
  const base = await getMetadataBase();
  return new URL(pathOrUrl, base).toString();
}

interface MediaMetaInput {
  type: "movie" | "tv";
  data: MovieDetails | TVDetails;
  locale: Locale;
  /** Canonical path of the page, e.g. "/movie/123". */
  path: string;
}

/** Rich share metadata for a movie/TV detail page. */
export async function mediaMetadata({ type, data, locale, path }: MediaMetaInput): Promise<Metadata> {
  const base = await getMetadataBase();
  const title = data.title;
  const year = releaseYear(data.releaseDate);
  const rating = data.voteAverage > 0 ? `${data.voteAverage.toFixed(1)}/10` : null;

  // Rating · year first so previews surface the score (OG has no dedicated
  // rating field). Genres are deliberately omitted — a long genre list would
  // crowd out the synopsis in the share card.
  const metaLine = [rating, year].filter(Boolean).join(" · ");
  const overview = data.overview?.trim();
  const description = overview
    ? metaLine
      ? `${metaLine} — ${overview}`
      : overview
    : metaLine || `${SITE_NAME}: ${title}`;

  // og:image — a SINGLE image: the generated share card (info panel + cover
  // art, rendered by /api/og). There must be no second image: Telegram and
  // other crawlers pick one of the og:image entries, and a textless fallback
  // was winning — making the shared preview look wrong. One image = no
  // ambiguity. ?lang= localizes the card's labels/genres.
  const images = [
    new URL(`/api/og/${type}/${data.tmdbId}?lang=${hreflangOf(locale)}`, base).toString(),
  ];
  const canonical = langUrl(path, locale);

  return {
    title,
    description,
    // hreflang links are emitted by <LocaleAlternates> (React 19 head hoisting),
    // not via alternates.languages — do not add it here or links render twice.
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: type === "movie" ? "video.movie" : "video.tv_show",
      url: new URL(canonical, base).toString(),
      siteName: SITE_NAME,
      locale: ogLocaleOf(locale),
      images: images.map((url) => ({ url, alt: title })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

interface PersonMetaInput {
  person: PersonDetails;
  locale: Locale;
  /** Canonical path of the page, e.g. "/person/123". */
  path: string;
}

/** Rich share metadata for a person page (name, photo, department). */
export async function personMetadata({ person, locale, path }: PersonMetaInput): Promise<Metadata> {
  const base = await getMetadataBase();
  const title = person.name;
  const description = person.department
    ? `${SITE_NAME}: ${person.name} — ${person.department}`
    : `${SITE_NAME}: ${person.name}`;
  const imageUrl = person.profile ? await toAbsoluteUrl(person.profile) : null;

  const canonical = langUrl(path, locale);

  return {
    title,
    description,
    // hreflang links are emitted by <LocaleAlternates> — see mediaMetadata.
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "profile",
      url: new URL(canonical, base).toString(),
      siteName: SITE_NAME,
      locale: ogLocaleOf(locale),
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined,
    },
    twitter: {
      // Profile photos are square-ish — the compact card fits better than the
      // 16:9 summary_large_image.
      card: "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

interface SeasonMetaInput {
  tv: TVDetails;
  season: SeasonDetails | Season;
  locale: Locale;
  /** Canonical path of the page, e.g. "/tv/123/season/1". */
  path: string;
}

/** Rich share metadata for a TV season page. */
export async function seasonMetadata({ tv, season, locale, path }: SeasonMetaInput): Promise<Metadata> {
  const base = await getMetadataBase();
  const title = `${tv.title} · ${season.name}`;
  const overview = season.overview?.trim() || tv.overview?.trim() || "";
  const year = releaseYear(season.airDate);
  const rating = tv.voteAverage > 0 ? `${tv.voteAverage.toFixed(1)}/10` : null;
  const metaLine = [rating, year].filter(Boolean).join(" · ");
  const description = [metaLine, overview].filter(Boolean).join(" — ") || `${SITE_NAME}: ${title}`;

  // og:image — a SINGLE image: the generated share card for the series (same
  // card as the show's detail page; the season title lives in og:title).
  // No plain-backdrop fallback: crawlers (Telegram especially) may pick any
  // og:image entry, and a textless one made previews look wrong.
  const images = [
    new URL(`/api/og/tv/${tv.tmdbId}?lang=${hreflangOf(locale)}`, base).toString(),
  ];
  const canonical = langUrl(path, locale);

  return {
    title,
    description,
    // hreflang links are emitted by <LocaleAlternates> — see mediaMetadata.
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "video.tv_show",
      url: new URL(canonical, base).toString(),
      siteName: SITE_NAME,
      locale: ogLocaleOf(locale),
      images: images.map((url) => ({ url, alt: title })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
