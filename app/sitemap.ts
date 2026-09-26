import type { MetadataRoute } from "next";
import { createNeoApi } from "@/lib/api";
import type { MediaItem, Paginated } from "@/lib/api/types";
import { getConfig } from "@/lib/constants/config";
import { getMetadataBase } from "@/lib/metadata";
import { languages, hreflangOf } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITEMAP_TTL_MS = 6 * 60 * 60 * 1000;
const LIST_PAGES = 5;
const PERSON_SOURCE_COUNT = 15;
const MAX_PERSONS = 600;

type SitemapEntry = MetadataRoute.Sitemap[number];

let cache: { at: number; entries: MetadataRoute.Sitemap } | null = null;

async function listPages<T extends MediaItem>(
  fetcher: (page: number) => Promise<Paginated<T>>,
): Promise<T[]> {
  const pages = await Promise.all(
    Array.from({ length: LIST_PAGES }, (_, i) =>
      fetcher(i + 1).catch(() => ({ items: [] as T[] }) as Paginated<T>),
    ),
  );
  const seen = new Map<number, T>();
  for (const page of pages) {
    for (const item of page.items) {
      if (!seen.has(item.tmdbId)) seen.set(item.tmdbId, item);
    }
  }
  return [...seen.values()];
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function generate(): Promise<MetadataRoute.Sitemap> {
  const base = await getMetadataBase();
  const site = base.toString().replace(/\/+$/, "");
  const api = createNeoApi({ baseUrl: getConfig().apiUrl, cache: false });
  const langs = (path: string): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const l of languages) out[hreflangOf(l.code)] = `${site}${path}?lang=${hreflangOf(l.code)}`;
    out["x-default"] = `${site}${path}`;
    return out;
  };

  const variants = (path: string, priority: number): SitemapEntry[] =>
    languages.map((l) => ({
      url: `${site}${path}?lang=${hreflangOf(l.code)}`,
      changeFrequency: "weekly",
      priority,
      alternates: { languages: langs(path) },
    }));

  const entries: MetadataRoute.Sitemap = [];

  for (const [path, priority] of [
    ["/", 1],
    ["/popular", 0.6],
    ["/top-rated", 0.6],
    ["/categories", 0.6],
    ["/terms", 0.3],
  ] as const) {
    entries.push(...variants(path, priority));
  }

  const [topMovies, popularMovies, upcomingMovies, topTv, popularTv] = await Promise.all([
    listPages((p) => api.media.movieList("top-rated", { page: p })),
    listPages((p) => api.media.movieList("popular", { page: p })),
    listPages((p) => api.media.movieList("upcoming", { page: p })),
    listPages((p) => api.media.tvList("top-rated", { page: p })),
    listPages((p) => api.media.tvList("popular", { page: p })),
  ]);

  const movieIds = new Map<number, MediaItem>();
  for (const m of [...topMovies, ...popularMovies, ...upcomingMovies]) {
    if (!movieIds.has(m.tmdbId)) movieIds.set(m.tmdbId, m);
  }
  const tvIds = new Map<number, MediaItem>();
  for (const t of [...topTv, ...popularTv]) {
    if (!tvIds.has(t.tmdbId)) tvIds.set(t.tmdbId, t);
  }
  const personIds = new Set<number>();
  const personSources: Array<{ item: MediaItem; type: "movie" | "tv" }> = [
    ...topMovies.slice(0, PERSON_SOURCE_COUNT).map((item) => ({ item, type: "movie" as const })),
    ...topTv.slice(0, PERSON_SOURCE_COUNT).map((item) => ({ item, type: "tv" as const })),
  ];
  await mapLimit(personSources, 8, async ({ item, type }) => {
    if (personIds.size >= MAX_PERSONS) return;
    try {
      const detail =
        type === "movie"
          ? await api.media.movieDetail(item.tmdbId, { language: "ru-RU" })
          : await api.media.tvDetail(item.tmdbId, { language: "ru-RU" });
      for (const c of detail.credits?.cast ?? []) {
        if (personIds.size >= MAX_PERSONS) break;
        personIds.add(c.id);
      }
    } catch { }
  });

  for (const m of movieIds.values()) entries.push(...variants(`/movie/${m.tmdbId}`, 0.7));
  for (const t of tvIds.values()) entries.push(...variants(`/tv/${t.tmdbId}`, 0.7));
  for (const pid of personIds) entries.push(...variants(`/person/${pid}`, 0.5));

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = Date.now();
  if (cache && now - cache.at < SITEMAP_TTL_MS) return cache.entries;

  try {
    const entries = await generate();
    cache = { at: now, entries };
    return entries;
  } catch {
    const base = await getMetadataBase();
    const site = base.toString().replace(/\/+$/, "");
    const entries: MetadataRoute.Sitemap = [
      { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
      { url: `${site}/popular`, changeFrequency: "weekly", priority: 0.6 },
      { url: `${site}/top-rated`, changeFrequency: "weekly", priority: 0.6 },
      { url: `${site}/categories`, changeFrequency: "weekly", priority: 0.6 },
    ];
    cache = { at: now, entries };
    return entries;
  }
}
