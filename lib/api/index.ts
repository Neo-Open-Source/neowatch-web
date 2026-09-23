import { createApiClient, ApiError } from "./client";
import type { ApiClientOptions } from "./client";
import { mediaEndpoints } from "./media";
import type { MediaApi } from "./media";
import { categoriesEndpoints } from "./categories";
import type { CategoriesApi } from "./categories";
import { genresEndpoints } from "./genres";
import type { GenresApi } from "./genres";
import { personEndpoints } from "./person";
import type { PersonApi } from "./person";
import { playerEndpoints } from "./players";
import type { PlayersApi } from "./players";
import { userEndpoints } from "./user";
import type { UserApi } from "./user";
import { systemEndpoints } from "./system";
import type { SystemApi } from "./system";
import { authEndpoints } from "./auth";
import type { AuthApi, AuthUser } from "./auth";
import { getConfig } from "@/lib/constants/config";
import { getStoredAccessToken } from "@/lib/state/auth-session";
import { getAccessToken, setAccessToken, tryRefreshSession } from "@/lib/auth/token";
import type {
  ApiLanguage,
  CategorySection,
  EnrichedSyncProgressItem,
  FavoriteItem,
  MediaItem,
  Paginated,
  TrendingItem,
} from "./types";
import { DEFAULT_LANGUAGE } from "./types";

export { ApiError };
export type { ApiClient, ApiClientOptions, QueryParams } from "./client";
export type {
  ApiLanguage,
  ApiResponse,
  MediaType,
  Genre,
  GenresResponse,
  MediaItem,
  TrendingItem,
  PersonItem,
  SearchItem,
  PersonDetails,
  PersonCreditItem,
  PersonCredits,
  MovieDetails,
  TVDetails,
  Season,
  SeasonDetails,
  Episode,
  Credits,
  CastMember,
  CrewMember,
  CollectionDetails,
  CollectionResponse,
  CategoryItem,
  CategorySection,
  PlayerResponse,
  Paginated,
  FavoriteItem,
  WatchLaterItem,
  SyncProgressItem,
  EnrichedSyncProgressItem,
} from "./types";
export type { AuthUser, AuthTokens, AuthApi } from "./auth";
export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, toApiLanguage } from "./types";

export interface HomeBootstrapData {
  trending: Paginated<TrendingItem>;
  topMovies: Paginated<MediaItem>;
  topSeries: Paginated<MediaItem>;
  categories: CategorySection[];
}

export interface HomePersonalData {
  me: AuthUser;
  syncProgress: EnrichedSyncProgressItem[];
  favorites: Paginated<FavoriteItem>;
}

export interface NeoApi {
  home: {
    bootstrap: (opts?: { language?: string }) => Promise<HomeBootstrapData>;
    personal: (opts?: { language?: string; page?: number }) => Promise<HomePersonalData>;
  };
  media: MediaApi;
  categories: CategoriesApi;
  genres: GenresApi;
  people: PersonApi;
  players: PlayersApi;
  user: UserApi;
  system: SystemApi;
  auth: AuthApi;
}

export function createNeoApi(options: ApiClientOptions = {}): NeoApi {
  const client = createApiClient(options);
  const media = mediaEndpoints(client);
  const categories = categoriesEndpoints(client);
  const user = userEndpoints(client);
  const auth = authEndpoints(client);
  return {
    home: {
      bootstrap: async (opts) => {
        const language = (opts?.language ?? DEFAULT_LANGUAGE) as ApiLanguage;
        const [trending, topMovies, topSeries, cats] = await Promise.all([
          media.trending({ language, page: 1 }),
          media.movieList("top-rated", { language, page: 1 }),
          media.tvList("top-rated", { language, page: 1 }),
          categories.list(language),
        ]);
        return { trending, topMovies, topSeries, categories: cats };
      },
      personal: async (opts) => {
        const language = (opts?.language ?? DEFAULT_LANGUAGE) as ApiLanguage;
        const [me, syncProgress, favorites] = await Promise.all([
          auth.profile(),
          user.getSyncProgress({ language }),
          user.listFavorites({ language, page: opts?.page ?? 1 }),
        ]);
        return { me, syncProgress, favorites };
      },
    },
    media,
    categories,
    genres: genresEndpoints(client),
    people: personEndpoints(client),
    players: playerEndpoints(client),
    user,
    system: systemEndpoints(client),
    auth,
  };
}

export { setAccessToken, tryRefreshSession };

const restApi = createNeoApi({
  baseUrl: getConfig().apiUrl,
  accessToken: () => getAccessToken() ?? getStoredAccessToken(),
  onUnauthorized: tryRefreshSession,
});

// ── GraphQL API (drop-in replacement) ────────────────────────────────────────
export { gqlApi } from "@/lib/graphql/api";

// ── Default api export — now points to GraphQL ───────────────────────────────
// To switch back to REST:  export const api = restApi;
import { gqlApi } from "@/lib/graphql/api";
export const api: NeoApi = gqlApi as any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** REST-based api — kept for fallback/debugging. */
export { restApi };
