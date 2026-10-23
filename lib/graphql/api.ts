/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApolloClient } from "./client";
import { CombinedGraphQLErrors, ServerError, ServerParseError } from "@apollo/client/errors";
import { tryRefreshSession } from "@/lib/auth/token";
import { authEndpoints } from "@/lib/api/auth";
import { createApiClient } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/token";
import { getStoredAccessToken } from "@/lib/state/auth-session";
import { getConfig } from "@/lib/constants/config";
import type { PlayerOptions } from "@/lib/api/players";
import {
  GET_MEDIA,
  GET_MEDIA_CREDITS,
  GET_SEASON,
  GET_TRENDING,
  GET_MOVIE_LIST,
  GET_TV_LIST,
  GET_SIMILAR,
  GET_RECOMMENDATIONS,
  GET_RELATED_BY_CAST,
  GET_RELATED_BY_STUDIO,
  SEARCH,
  GET_GENRES,
  GET_PERSON,
  GET_PERSON_CREDITS,
  GET_CATEGORIES,
  GET_CATEGORY_COLLECTION,
  GET_PLAYER,
  GET_KODIK,
  GET_PLAYER_AVAILABILITY,
  GET_CDN_PLAYER,
  GET_COLLECTION,
  GET_ME,
  GET_FAVORITES,
  HOME_BOOTSTRAP,
  HOME_PERSONAL,
  GET_WATCH_LATER,
  GET_SYNC_PROGRESS,
  GET_SUPPORTERS,
  ADD_FAVORITE,
  REMOVE_FAVORITE,
  ADD_WATCH_LATER,
  REMOVE_WATCH_LATER,
  UPSERT_PROGRESS,
  DELETE_PROGRESS,
  BATCH_SYNC_PROGRESS,
  REFRESH_TOKENS,
  LOGOUT,
} from "./queries";

// ── REST auth helper (OAuth code exchange / login URL) ───────────────────────
// exchangeCode must hit Neo ID or the API's REST /mobile-callback — not GraphQL.
const restAuth = authEndpoints(
  createApiClient({
    baseUrl: getConfig().apiUrl,
    accessToken: () => getAccessToken() ?? getStoredAccessToken(),
    onUnauthorized: tryRefreshSession,
    cache: false,
  }),
);

// ── Client singleton ────────────────────────────────────────────────────────

let apolloClient: ReturnType<typeof createApolloClient> | null = null;

function getClient() {
  if (!apolloClient) apolloClient = createApolloClient();
  return apolloClient;
}

/** True when the JWT `exp` claim is within `skewSec` of now (or already past). */
function accessTokenExpired(token: string, skewSec = 30): boolean {
  try {
    const part = token.split(".")[1];
    if (!part) return false;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    return Date.now() / 1000 >= payload.exp - skewSec;
  } catch {
    return false;
  }
}

function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  // Apollo 4: non-200 HTTP → ServerError / ServerParseError (statusCode on the error itself).
  if (ServerError.is(error) || ServerParseError.is(error)) {
    return error.statusCode === 401;
  }

  // Apollo 4: GraphQL errors → CombinedGraphQLErrors.errors (not Apollo 3 graphQLErrors).
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(
      (e) =>
        e.extensions?.code === "UNAUTHORIZED" ||
        e.extensions?.code === "UNAUTHENTICATED",
    );
  }

  // Apollo 3 legacy shape (kept if the client is ever downgraded).
  const err = error as {
    graphQLErrors?: { extensions?: { code?: string } }[];
    networkError?: { statusCode?: number; status?: number } | null;
  };
  if (
    err.graphQLErrors?.some(
      (e) =>
        e.extensions?.code === "UNAUTHORIZED" ||
        e.extensions?.code === "UNAUTHENTICATED",
    )
  ) {
    return true;
  }
  const status = err.networkError?.statusCode ?? err.networkError?.status;
  return status === 401;
}

async function runWithAuthRetry<T>(operation: () => Promise<T>): Promise<T> {
  // Proactive: Neo ID access tokens live ~15 min; refresh before the server 401s.
  const token = getStoredAccessToken();
  if (token && accessTokenExpired(token)) {
    await tryRefreshSession();
  }

  try {
    return await operation();
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    const refreshed = await tryRefreshSession();
    if (!refreshed) throw error;
    return operation();
  }
}

async function gqlQuery<T = any>(doc: any, variables?: Record<string, any>): Promise<T> {
  return runWithAuthRetry(async () => {
    const client = getClient();
    const result = await client.query({ query: doc, variables, fetchPolicy: "network-only" });
    if (result.error) throw result.error;
    return result.data as T;
  });
}

async function gqlMutate<T = any>(doc: any, variables?: Record<string, any>): Promise<T> {
  return runWithAuthRetry(async () => {
    const client = getClient();
    const result = await client.mutate({ mutation: doc, variables });
    if (result.error) throw result.error;
    return result.data as T;
  });
}

// ── Exact REST-compatible API shape ──────────────────────────────────────────

function withDefaults(opts?: { language?: string; page?: number }) {
  return {
    language: opts?.language ?? "ru-RU",
    ...(opts?.page !== undefined ? { page: opts.page } : {}),
  };
}

function toGraphQLList(list: string): string {
  return list.replace(/-/g, "_");
}

export const gqlApi = {
  home: {
    bootstrap: (opts?: { language?: string }) =>
      gqlQuery(HOME_BOOTSTRAP, { language: opts?.language ?? "ru-RU" }),

    personal: (opts?: { language?: string; page?: number }) =>
      gqlQuery(HOME_PERSONAL, withDefaults(opts)),
  },

  media: {
    movieDetail: (id: number, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_MEDIA, { type: "movie", id, ...withDefaults(opts) }).then((d: any) => d.media),

    tvDetail: (id: number, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_MEDIA, { type: "tv", id, ...withDefaults(opts) }).then((d: any) => d.media),

    movieCredits: (id: number, opts?: { language?: string }) =>
      gqlQuery(GET_MEDIA_CREDITS, { type: "movie", id, ...withDefaults(opts) }).then((d: any) => d.mediaCredits),

    tvCredits: (id: number, opts?: { language?: string }) =>
      gqlQuery(GET_MEDIA_CREDITS, { type: "tv", id, ...withDefaults(opts) }).then((d: any) => d.mediaCredits),

    similar: (type: string, id: number, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_SIMILAR, { type, id, ...withDefaults(opts) }).then((d: any) => d.similar),

    relatedByCast: (type: string, id: number, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_RELATED_BY_CAST, { type, id, ...withDefaults(opts) }).then((d: any) => d.relatedByCast),

    relatedByStudio: (type: string, id: number, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_RELATED_BY_STUDIO, { type, id, ...withDefaults(opts) }).then((d: any) => d.relatedByStudio),

    recommendations: (type: string, id: number, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_RECOMMENDATIONS, { type, id, ...withDefaults(opts) }).then((d: any) => d.recommendations),

    collection: (id: number, opts?: { language?: string }) =>
      gqlQuery(GET_COLLECTION, { id, ...withDefaults(opts) }).then((d: any) => d.mediaCollection),

    season: (tvId: number, seasonNumber: number, opts?: { language?: string }) =>
      gqlQuery(GET_SEASON, { tvId, season: seasonNumber, ...withDefaults(opts) }).then((d: any) => d.season),

    movieList: (list: string, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_MOVIE_LIST, { list: toGraphQLList(list), ...withDefaults(opts) }).then((d: any) => d.movieList),

    tvList: (list: string, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_TV_LIST, { list: toGraphQLList(list), ...withDefaults(opts) }).then((d: any) => d.tvList),

    trending: (opts: { language?: string; page?: number; type?: string } = {}) =>
      gqlQuery(GET_TRENDING, { type: opts.type, ...withDefaults(opts) }).then((d: any) => d.trending),

    search: (opts: Record<string, any> = {}) => {
      const variables: Record<string, any> = {};
      for (const [key, value] of Object.entries(opts)) {
        if (value === undefined) continue;
        const paramKey = key === "sortBy" ? "sortBy" : key;
        variables[paramKey] = value;
      }
      if (!variables.language) variables.language = "ru-RU";
      return gqlQuery(SEARCH, variables).then((d: any) => {
        const res = d.search;
        const items = res.items.map((it: any) =>
          it.mediaType == null && (it.__typename === "PersonSearchItem" || (it.name && !it.title))
            ? { ...it, mediaType: "person" }
            : it,
        );
        return { ...res, items };
      });
    },

    logoUrl: () => "",
    backdropTextUrl: () => "",
  },

  categories: {
    list: (language: string = "ru-RU") =>
      gqlQuery(GET_CATEGORIES, { language }).then((d: any) => d.categories),

    collection: (id: string, opts: { language?: string; page?: number } = {}) =>
      gqlQuery(GET_CATEGORY_COLLECTION, { slug: id, ...withDefaults(opts) }).then((d: any) => d.categoryCollection),
  },

  genres: {
    list: (language: string = "ru-RU") =>
      gqlQuery(GET_GENRES, { language }).then((d: any) => d.genres),
  },

  people: {
    detail: (id: number, opts?: { language?: string }) =>
      gqlQuery(GET_PERSON, { id, ...withDefaults(opts) }).then((d: any) => d.person),

    credits: (id: number, opts?: { language?: string; page?: number }) =>
      gqlQuery(GET_PERSON_CREDITS, { id, ...withDefaults(opts) }).then((d: any) => d.personCredits),
  },

  players: {
    availability: (ids: { kpId?: number; tmdbId?: number; imdbId?: string }) =>
      gqlQuery(GET_PLAYER_AVAILABILITY, ids).then((d: any) => d.playerAvailability),

    allohaByTmdb: (tmdbId: number, opts?: PlayerOptions) =>
      gqlQuery(GET_PLAYER, { provider: "alloha", tmdbId, ...opts }).then((d: any) => d.player),

    allohaByKp: (kpId: number, opts?: PlayerOptions) =>
      gqlQuery(GET_PLAYER, { provider: "alloha", kpId, ...opts }).then((d: any) => d.player),

    allohaByImdb: (imdbId: string, opts?: PlayerOptions) =>
      gqlQuery(GET_PLAYER, { provider: "alloha", imdbId, ...opts }).then((d: any) => d.player),

    collapsByKp: (kpId: number, opts?: PlayerOptions) =>
      gqlQuery(GET_PLAYER, { provider: "collaps", kpId, ...opts }).then((d: any) => d.player),

    collapsByImdb: (imdbId: string, opts?: PlayerOptions) =>
      gqlQuery(GET_PLAYER, { provider: "collaps", imdbId, ...opts }).then((d: any) => d.player),

    kodik: (ids: { kpId?: number; imdbId?: string; shikimoriId?: number }) =>
      gqlQuery(GET_KODIK, ids).then((d: any) => d.kodik),

    kodikByKp: (kpId: number, opts?: PlayerOptions) =>
      gqlQuery(GET_PLAYER, { provider: "kodik", kpId, ...opts }).then((d: any) => d.player),

    kodikByImdb: (imdbId: string, opts?: PlayerOptions) =>
      gqlQuery(GET_PLAYER, { provider: "kodik", imdbId, ...opts }).then((d: any) => d.player),

    cdn: (cdnId: number, opts?: PlayerOptions) =>
      gqlQuery(GET_CDN_PLAYER, { cdnId, ...opts }).then((d: any) => d.cdnPlayer),

    cdnByImdb: (imdbId: string, opts?: PlayerOptions) =>
      gqlQuery(GET_CDN_PLAYER, { imdbId, ...opts }).then((d: any) => d.cdnPlayer),

    cdnByKp: (kpId: number, opts?: PlayerOptions) =>
      gqlQuery(GET_CDN_PLAYER, { kpId, ...opts }).then((d: any) => d.cdnPlayer),
  },

  user: {
    listFavorites: (opts: { page?: number; language?: string } = {}) =>
      gqlQuery(GET_FAVORITES, withDefaults(opts)).then((d: any) => d.favorites),

    addFavorite: (mediaId: number, mediaType: string = "movie") =>
      gqlMutate(ADD_FAVORITE, { mediaId, mediaType }).then((d: any) => d.addFavorite),

    removeFavorite: (mediaId: number, mediaType: string = "movie") =>
      gqlMutate(REMOVE_FAVORITE, { mediaId, mediaType }).then((d: any) => ({ deleted: d.removeFavorite })),

    checkFavorite: async (mediaId: number, mediaType: string = "movie") => {
      try {
        const data = await gqlQuery(GET_FAVORITES, { page: 1, language: "ru-RU" }) as any;
        // Check all pages would be expensive — check first page and rely on local cache
        const items: any[] = data?.favorites?.items ?? [];
        return { isFavorite: items.some((i: any) => i.mediaId === mediaId && i.mediaType === mediaType) };
      } catch {
        return { isFavorite: false };
      }
    },

    listWatchLater: () =>
      gqlQuery(GET_WATCH_LATER, {}).then((d: any) => d.watchLater),

    addWatchLater: (mediaId: number) =>
      gqlMutate(ADD_WATCH_LATER, { mediaId }).then((d: any) => d.addToWatchLater),

    removeWatchLater: (mediaId: number) =>
      gqlMutate(REMOVE_WATCH_LATER, { mediaId }).then((d: any) => ({ deleted: d.removeFromWatchLater })),

    checkWatchLater: async (mediaId: number) => {
      try {
        const data = await gqlQuery(GET_WATCH_LATER, {}) as any;
        const items: any[] = data?.watchLater ?? [];
        return { isSaved: items.some((i: any) => i.mediaId === mediaId) };
      } catch {
        return { isSaved: false };
      }
    },

    getSyncProgress: (opts: { language?: string } = {}) =>
      gqlQuery(GET_SYNC_PROGRESS, withDefaults(opts)).then((d: any) => d.syncProgress),

    upsertProgress: (body: { mediaId: number; mediaType?: string; season?: number; episode?: number; progress: number }) =>
      gqlMutate(UPSERT_PROGRESS, body).then((d: any) => d.upsertProgress),

    deleteProgress: (body: { mediaId: number; mediaType?: string; season?: number; episode?: number }) =>
      gqlMutate(DELETE_PROGRESS, body).then((d: any) => ({ deleted: d.deleteProgress })),

    batchSyncProgress: (items: { mediaId: number; mediaType?: string; season?: number; episode?: number; progress: number }[]) =>
      gqlMutate(BATCH_SYNC_PROGRESS, { items }).then((d: any) => d.batchSyncProgress),
  },

  system: {
    health: () => Promise.resolve({ ok: true }),
    supporters: () =>
      gqlQuery(GET_SUPPORTERS, {}).then((d: any) => d.supporters),
  },

  auth: {
    // OAuth start + code exchange stay on REST: Neo ID PKCE params
    // (state, code_challenge_method) and the token endpoint are not GraphQL.
    getLoginUrl: (redirectUri: string, pkce?: { code_challenge?: string; code_challenge_method?: string; state?: string }) =>
      restAuth.getLoginUrl(redirectUri, pkce),

    exchangeCode: (code: string, redirectUri: string, codeVerifier?: string) =>
      restAuth.exchangeCode(code, redirectUri, codeVerifier),

    refresh: (refreshToken: string) =>
      gqlMutate(REFRESH_TOKENS, { refreshToken }).then((d: any) => d.refreshTokens),

    profile: () =>
      gqlQuery(GET_ME).then((d: any) => d.me),

    logout: () =>
      gqlMutate(LOGOUT, {}).then(() => ({ ok: true })),
  },
};
