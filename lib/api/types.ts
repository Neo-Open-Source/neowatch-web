export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export type MediaType = "movie" | "tv";

export interface Genre {
  id: number;
  name: string;
}

export interface GenresResponse {
  movie: Genre[];
  tv: Genre[];
}

export const SUPPORTED_LANGUAGES = ["en-US", "uk-UA", "ru-RU", "ro-RO", "be-BY"] as const;
export type ApiLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: ApiLanguage = "ru-RU";

export function toApiLanguage(locale: string): ApiLanguage {
  const short = locale.slice(0, 2).toLowerCase();
  const map: Record<string, ApiLanguage> = {
    en: "en-US",
    uk: "uk-UA",
    ru: "ru-RU",
    ro: "ro-RO",
    be: "be-BY",
  };
  return map[short] ?? DEFAULT_LANGUAGE;
}

export interface MediaItem {
  certification: string | null;
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  posters: string[];
  backdrops: string[];
  releaseDate: string | null;
  genres: { id: number; name: string }[] | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  imdbRating?: number | null;
}

export interface TrendingItem extends MediaItem {
  mediaType: MediaType;
}

export interface PersonItem {
  mediaType: "person";
  tmdbId: number;
  name: string;
  profile: string | null;
  department: string | null;
}

export type SearchItem = TrendingItem | PersonItem;

export interface PersonDetails {
  tmdbId: number;
  name: string;
  profile: string | null;
  profiles: string[];
  department: string | null;
}

export interface PersonCreditItem extends MediaItem {
  mediaType: MediaType;
  role: string | null;
  creditType: "cast" | "crew";
}

export type PersonCredits = Paginated<PersonCreditItem>;

export interface Company {
  id: number;
  name: string;
  logo: string | null;
  logos: string[];
}

export interface Studio {
  id: string;
  name: string;
  logoUrl: string;
}

export interface Network {
  id: number;
  name: string;
  logo: string | null;
  logos: string[];
}

export interface CreditPerson {
  id: number;
  name: string;
  profile: string | null;
  profiles: string[];
}

export interface CastMember extends CreditPerson {
  character: string | null;
  order: number;
}

export interface CrewMember extends CreditPerson {
  job: string;
  department: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface MediaDetails {
  imdbId: string | null;
  kpId: number | null;
  imdbRating?: number | null;
  imdbVotes?: number | null;
  certification: string | null;
  logo: string | null;
  trailers: string[];
  credits: Credits;
}

export interface MovieDetails extends MediaItem, MediaDetails {
  runtime: number | null;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  productionCompanies: Company[];
  collection: { id: number; name: string; poster: string | null } | null;
}

export interface Season {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  overview: string;
  poster: string | null;
  posters: string[];
  airDate: string | null;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still: string | null;
  stills: string[];
  airDate: string | null;
  episodeNumber: number;
  seasonNumber: number;
  voteAverage: number;
  runtime: number | null;
}

export interface TVDetails extends MediaItem, MediaDetails {
  seasons: Season[];
  numberOfSeasons: number;
  numberOfEpisodes: number;
  status: string;
  tagline: string;
  networks: Network[];
  productionCompanies: Company[];
}

export interface SeasonDetails extends Season {
  episodes: Episode[];
}

export interface CollectionDetails {
  id: number;
  name: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  parts: MediaItem[];
}

export type MovieList = "popular" | "top-rated" | "upcoming";
export type TVList = "popular" | "top-rated";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  type?: MediaType;
  backdrop?: string | null;
}

export interface CategorySection {
  section: string;
  items: CategoryItem[];
}

export interface CollectionResponse extends Paginated<MediaItem> {
  category: { id: string; name: string; slug: string };
}

export interface PlayerResponse {
  provider: string;
  url: string;
  type: "iframe" | "hls" | "mp4";
}

export interface KodikEpisode {
  number: number;
  link: string;
}

export interface KodikSeason {
  number: number;
  link: string | null;
  episodes: KodikEpisode[];
}

export interface KodikTranslation {
  id: number;
  title: string;
  type: string;
  link: string | null;
  seasons: KodikSeason[];
}

export interface KodikSearchResult {
  id: string;
  title: string;
  year: number | null;
  lastSeason: number | null;
  quality: string | null;
  kinopoiskId: string | null;
  imdbId: string | null;
  translations: KodikTranslation[];
}

export interface PlayerAvailability {
  kodik: boolean;
  alloha: boolean;
  collaps: boolean;
}

export interface KodikPlaylist {
  provider: string;
  total: number;
  results: KodikSearchResult[];
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}

export interface Supporter {
  id: number;
  name: string;
  type: string[];
  description: string;
  contributions: string[];
  year: number;
  isActive: boolean;
}

export interface FavoriteItem extends MediaItem {
  mediaId: number;
  mediaType: MediaType;
  createdAt: string;
}

export interface WatchLaterItem {
  mediaId: number;
  createdAt: string;
}

export interface SyncProgressItem {
  mediaId: number;
  mediaType: MediaType;
  season: number | null;
  episode: number | null;
  progress: number;
  updatedAt: string;
}

export interface EnrichedSyncProgressItem extends SyncProgressItem {
  title: string | null;
  backdrop: string | null;
  poster: string | null;
  imdbId: string | null;
  kpId: number | null;
  episodeName: string | null;
  episodeStill: string | null;
}

export interface BatchSyncResult {
  items: SyncProgressItem[];
  count: number;
}
