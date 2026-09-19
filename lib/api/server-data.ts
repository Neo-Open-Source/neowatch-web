// Server-only cached data fetchers. React `cache()` dedupes the underlying
// promise within a single request render, so the data fetched for
// generateMetadata is reused by the page component and passed to the client —
// no duplicate API calls for the same media/person/season.

import { cache } from "react";
import { createNeoApi } from ".";
import { getConfig } from "@/lib/constants/config";
import { STUDIO_LOGOS } from "@/lib/constants/studios";
import type {
  ApiLanguage,
  MediaItem,
  MovieDetails,
  PersonDetails,
  SeasonDetails,
  Studio,
  TrendingItem,
  TVDetails,
} from "./types";

// Bound the server-side fetch so a hung/slow API cannot stall the page TTFB
// (the home page and detail pages block on these before streaming HTML).
const SERVER_FETCH_TIMEOUT_MS = 8000;

function timedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS) });
}

function serverApi() {
  return createNeoApi({ baseUrl: getConfig().apiUrl, cache: false, fetchImpl: timedFetch });
}

export const getMediaDetail = cache(
  async (type: "movie" | "tv", tmdbId: number, lang: ApiLanguage): Promise<MovieDetails | TVDetails> => {
    const api = serverApi();
    return type === "movie"
      ? await api.media.movieDetail(tmdbId, { language: lang })
      : await api.media.tvDetail(tmdbId, { language: lang });
  },
);

export const getPersonDetail = cache(
  async (personId: number, lang: ApiLanguage): Promise<PersonDetails> => {
    return await serverApi().people.detail(personId, { language: lang });
  },
);

export const getSeasonBundle = cache(
  async (
    tvId: number,
    seasonNumber: number,
    lang: ApiLanguage,
  ): Promise<{ tv: TVDetails; season: SeasonDetails }> => {
    const api = serverApi();
    const [tv, season] = await Promise.all([
      api.media.tvDetail(tvId, { language: lang }) as Promise<TVDetails>,
      api.media.season(tvId, seasonNumber, { language: lang }) as Promise<SeasonDetails>,
    ]);
    return { tv, season };
  },
);

/** Home page rows, fetched once on the server and passed to the client rows as
 *  initialData — removes the post-hydration API waterfall on first load. */
export const getHomeRows = cache(
  async (lang: ApiLanguage): Promise<{
    trending: TrendingItem[];
    topMovies: MediaItem[];
    topSeries: MediaItem[];
    studios: Studio[];
  }> => {
    const api = serverApi();
    const [trending, topMovies, topSeries, sections] = await Promise.all([
      api.media.trending({ language: lang }).then((r) => r.items),
      api.media.movieList("top-rated", { language: lang }).then((r) => r.items),
      api.media.tvList("top-rated", { language: lang }).then((r) => r.items),
      api.categories.list(lang),
    ]);

    const studios = sections
      .find((s) => s.section === "Studios")
      ?.items
      .map((c) => ({ id: c.id, name: c.name, logoUrl: STUDIO_LOGOS[c.id] }))
      .filter((s): s is Studio => Boolean(s.logoUrl)) ?? [];

    return { trending, topMovies, topSeries, studios };
  },
);
