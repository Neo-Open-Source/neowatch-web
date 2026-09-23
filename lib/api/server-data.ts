// Server-only cached data fetchers. React `cache()` dedupes the underlying
// promise within a single request render, so the data fetched for
// generateMetadata is reused by the page component and passed to the client —
// no duplicate API calls for the same media/person/season.

import { cache } from "react";
import { gqlApi } from "@/lib/graphql/api";
import type {
  ApiLanguage,
  CategorySection,
  MediaItem,
  MovieDetails,
  PersonDetails,
  SeasonDetails,
  Studio,
  TrendingItem,
  TVDetails,
} from "./types";

export const getMediaDetail = cache(
  async (type: "movie" | "tv", tmdbId: number, lang: ApiLanguage): Promise<MovieDetails | TVDetails> => {
    return type === "movie"
      ? await gqlApi.media.movieDetail(tmdbId, { language: lang })
      : await gqlApi.media.tvDetail(tmdbId, { language: lang });
  },
);

export const getPersonDetail = cache(
  async (personId: number, lang: ApiLanguage): Promise<PersonDetails> => {
    return await gqlApi.people.detail(personId, { language: lang });
  },
);

export const getSeasonBundle = cache(
  async (
    tvId: number,
    seasonNumber: number,
    lang: ApiLanguage,
  ): Promise<{ tv: TVDetails; season: SeasonDetails }> => {
    const [tv, season] = await Promise.all([
      gqlApi.media.tvDetail(tvId, { language: lang }) as Promise<TVDetails>,
      gqlApi.media.season(tvId, seasonNumber, { language: lang }) as Promise<SeasonDetails>,
    ]);
    return { tv, season };
  },
);

/** Home page rows, fetched once on the server and passed to the client rows as
 *  initialData — removes the post-hydration API waterfall on first load.
 *  Single GraphQL document with aliases (trending + topMovies + topSeries + categories). */
export const getHomeRows = cache(
  async (lang: ApiLanguage): Promise<{
    trending: TrendingItem[];
    topMovies: MediaItem[];
    topSeries: MediaItem[];
    studios: Studio[];
    categories: CategorySection[];
  }> => {
    const data = await gqlApi.home.bootstrap({ language: lang });
    const trending = (data?.trending?.items ?? []) as TrendingItem[];
    const topMovies = (data?.topMovies?.items ?? []) as MediaItem[];
    const topSeries = (data?.topSeries?.items ?? []) as MediaItem[];
    const categories = (data?.categories ?? []) as CategorySection[];

    const { STUDIO_LOGOS } = await import("@/lib/constants/studios");
    const studios = categories
      .find((s) => s.section === "Studios")
      ?.items
      .map((c) => ({ id: c.id, name: c.name, logoUrl: STUDIO_LOGOS[c.id] }))
      .filter((s): s is Studio => Boolean(s.logoUrl)) ?? [];

    return { trending, topMovies, topSeries, studios, categories };
  },
);
