export type CatalogKind = "movie" | "tv" | "anime" | "dorama" | "eastern";

type MediaSourceType = "movie" | "tv";

export interface Card {
  key: string;
  kind: CatalogKind;
  tmdbId: number | null;
  kpId: number | null;
  imdbId: string | null;
  shikimoriId: number | null;
  title: string;
  titleOriginal: string | null;
  titleEnglish: string | null;
  year: number | null;
  releaseDate: string | null;
  poster: string | null;
  description: string | null;
  rating: number;
  votes: number;
  genres: string[];
  genresRu: string[];
  tags: string[];
  tagsRu: string[];
  countries: string[];
  studios: string[];
  status: string | null;
  seasons: number | null;
  episodes: number | null;
  lastSeason: number | null;
  lastEpisode: number | null;
  ageRating: string | null;
  available: boolean;
}

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface BrowsePage {
  items: Card[];
  hasMore: boolean;
  nextCursor: string | null;
}

export type BrowseSort = "views_count" | "imdb_rating" | "created_at";

export type BrowseParams = {
  kind?: CatalogKind | undefined;
  cursor?: string | undefined;
  sort?: BrowseSort | undefined;
  genre?: readonly string[] | undefined;
  tag?: readonly string[] | undefined;
  studio?: readonly string[] | undefined;
};

interface PlaybackProvider {
  provider: string;
  url: string;
  type: string;
}

interface PlaybackTranslation {
  name: string | null;
  type: string | null;
  providers: PlaybackProvider[];
}

interface PlaybackEpisode {
  episode: number | null;
  translations: PlaybackTranslation[];
}

interface PlaybackSeason {
  season: number | null;
  episodes: PlaybackEpisode[];
}

interface PlaybackIds {
  kpId: number | null;
  imdbId: string | null;
  tmdbId: number | null;
  shikimoriId: number | null;
}

export interface Playback {
  kind: string | null;
  ids: PlaybackIds;
  seasons: PlaybackSeason[];
}

export type PlaybackParams = {
  kp?: number | undefined;
  tmdb?: number | undefined;
  imdb?: string | undefined;
  shikimori?: number | undefined;
  type?: MediaSourceType | undefined;
};
