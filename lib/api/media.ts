import type { ApiClient, QueryParams } from "./client";
import { DEFAULT_LANGUAGE } from "./types";
import type {
  ApiLanguage,
  CollectionDetails,
  Credits,
  Episode,
  MediaItem,
  MediaType,
  MovieDetails,
  MovieList,
  Paginated,
  SeasonDetails,
  SearchItem,
  TrendingItem,
  TVDetails,
  TVList,
} from "./types";
import { getConfig } from "@/lib/constants/config";

export interface PageOptions {
  language?: ApiLanguage;
  page?: number;
}

function withDefaults(opts: PageOptions = {}): QueryParams {
  const params: QueryParams = { language: opts.language ?? DEFAULT_LANGUAGE };
  if (opts.page !== undefined) params.page = opts.page;
  return params;
}

export interface SearchOptions {
  q?: string;
  type?: "movie" | "tv" | "multi";
  genre?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  rating?: number;
  ratingFrom?: number;
  ratingTo?: number;
  keyword?: string;
  country?: string;
  sortBy?: string;
  language?: ApiLanguage;
  page?: number;
}

export interface RelatedStudioPage extends Paginated<MediaItem> {
  label: string | null;
}

/** Backdrop with text overlay (preferred for social share previews). */
export function backdropTextUrl(
  id: number,
  type: MediaType,
  lang?: ApiLanguage,
  size = "w1280",
): string {
  const params = new URLSearchParams({
    type,
    language: lang ?? DEFAULT_LANGUAGE,
    size,
  });
  return `${getConfig().apiUrl}/api/v1/images/backdrop/${id}/text?${params}`;
}

export function mediaEndpoints(client: ApiClient) {
  return {
    movieDetail: (id: number, opts?: PageOptions) =>
      client.get<MovieDetails>(`/api/v1/media/movie/${id}`, withDefaults(opts)),

    tvDetail: (id: number, opts?: PageOptions) =>
      client.get<TVDetails>(`/api/v1/media/tv/${id}`, withDefaults(opts)),

    movieCredits: (id: number, opts?: PageOptions) =>
      client.get<Credits>(`/api/v1/media/movie/${id}/credits`, withDefaults(opts)),

    tvCredits: (id: number, opts?: PageOptions) =>
      client.get<Credits>(`/api/v1/media/tv/${id}/credits`, withDefaults(opts)),

    similar: (type: MediaType, id: number, opts?: PageOptions) =>
      client.get<Paginated<MediaItem>>(`/api/v1/media/${type}/${id}/similar`, withDefaults(opts)),

    relatedByCast: (type: MediaType, id: number, opts?: PageOptions) =>
      client.get<Paginated<MediaItem>>(`/api/v1/media/${type}/${id}/related/cast`, withDefaults(opts)),

    relatedByStudio: (type: MediaType, id: number, opts?: PageOptions) =>
      client.get<RelatedStudioPage>(`/api/v1/media/${type}/${id}/related/studio`, withDefaults(opts)),

    logoUrl: (id: number, type: MediaType, lang?: ApiLanguage, size = "w500") => {
      const params = new URLSearchParams({
        type,
        language: lang ?? DEFAULT_LANGUAGE,
        size,
      });
      return `${getConfig().apiUrl}/api/v1/images/logo/${id}?${params}`;
    },

    backdropTextUrl,

    recommendations: (type: MediaType, id: number, opts?: PageOptions) =>
      client.get<Paginated<MediaItem>>(`/api/v1/media/${type}/${id}/recommendations`, withDefaults(opts)),

    collection: (id: number, opts?: PageOptions) =>
      client.get<CollectionDetails | null>(`/api/v1/media/movie/${id}/collection`, withDefaults(opts)),

    season: (tvId: number, seasonNumber: number, opts?: PageOptions) =>
      client.get<SeasonDetails>(`/api/v1/media/tv/${tvId}/season/${seasonNumber}`, withDefaults(opts)),

    episode: (tvId: number, seasonNumber: number, episodeNumber: number, opts?: PageOptions) =>
      client.get<Episode>(
        `/api/v1/media/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
        withDefaults(opts),
      ),

    movieList: (list: MovieList, opts?: PageOptions) =>
      client.get<Paginated<MediaItem>>(`/api/v1/movies/${list}`, withDefaults(opts)),

    tvList: (list: TVList, opts?: PageOptions) =>
      client.get<Paginated<MediaItem>>(`/api/v1/tv/${list}`, withDefaults(opts)),

    trending: (opts: PageOptions & { type?: MediaType } = {}) => {
      const params = withDefaults(opts);
      if (opts.type) params.type = opts.type;
      return client.get<Paginated<TrendingItem>>("/api/v1/trending", params);
    },

    search: (opts: SearchOptions = {}) => {
      const params: QueryParams = { language: opts.language ?? DEFAULT_LANGUAGE };
      for (const [key, value] of Object.entries(opts)) {
        if (value === undefined) continue;
        const paramKey = key === "sortBy" ? "sort_by" : key;
        params[paramKey] = value as QueryParams[typeof paramKey];
      }
      return client.get<Paginated<SearchItem>>("/api/v1/search", params);
    },
  };
}

export type MediaApi = ReturnType<typeof mediaEndpoints>;
