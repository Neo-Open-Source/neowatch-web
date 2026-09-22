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
import type { AuthApi } from "./auth";
import { getConfig } from "@/lib/constants/config";
import {
  clearSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  persistSession,
} from "@/lib/state/auth-session";
import { clearFavoritesSnapshot } from "@/lib/state/favorites-cache";

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

export interface NeoApi {
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
  return {
    media: mediaEndpoints(client),
    categories: categoriesEndpoints(client),
    genres: genresEndpoints(client),
    people: personEndpoints(client),
    players: playerEndpoints(client),
    user: userEndpoints(client),
    system: systemEndpoints(client),
    auth: authEndpoints(client),
  };
}

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      clearSession();
      accessToken = null;
      return false;
    }

    try {
      // Bare client — no onUnauthorized — avoids refresh recursion
      const bare = createNeoApi({
        baseUrl: getConfig().apiUrl,
        cache: false,
      });
      const tokens = await bare.auth.refresh(refreshToken);
      persistSession(tokens);
      accessToken = tokens.accessToken;
      return true;
    } catch {
      clearSession();
      clearFavoritesSnapshot();
      accessToken = null;
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const restApi = createNeoApi({
  baseUrl: getConfig().apiUrl,
  accessToken: () => accessToken ?? getStoredAccessToken(),
  onUnauthorized: tryRefreshSession,
});

// ── GraphQL API (drop-in replacement) ────────────────────────────────────────
export { gqlApi } from "@/lib/graphql/api";

// ── Default api export — now points to GraphQL ───────────────────────────────
// To switch back to REST:  export const api = restApi;
import { gqlApi } from "@/lib/graphql/api";
export const api: NeoApi = gqlApi as any;
