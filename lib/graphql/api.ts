/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { gql } from "@apollo/client";
import { createApolloClient } from "./client";
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
  GET_CDN_PLAYER,
  GET_COLLECTION,
  GET_LOGIN_URL,
  GET_FAVORITES,
  GET_WATCH_LATER,
  GET_SYNC_PROGRESS,
  GET_SUPPORTERS,
  ADD_FAVORITE,
  REMOVE_FAVORITE,
  ADD_WATCH_LATER,
  REMOVE_WATCH_LATER,
  UPSERT_PROGRESS,
  BATCH_SYNC_PROGRESS,
  REFRESH_TOKENS,
  LOGOUT,
} from "./queries";

// ── Client singleton ────────────────────────────────────────────────────────

let apolloClient: ReturnType<typeof createApolloClient> | null = null;

function getClient() {
  if (!apolloClient) apolloClient = createApolloClient();
  return apolloClient;
}

async function gqlQuery<T = any>(doc: any, variables?: Record<string, any>): Promise<T> {
  const client = getClient();
  const result = await client.query({ query: doc, variables, fetchPolicy: "network-only" });
  if (result.error) throw result.error;
  return result.data as T;
}

async function gqlMutate<T = any>(doc: any, variables?: Record<string, any>): Promise<T> {
  const client = getClient();
  const result = await client.mutate({ mutation: doc, variables });
  if (result.error) throw result.error;
  return result.data as T;
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
      return gqlQuery(SEARCH, variables).then((d: any) => d.search);
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
    allohaByTmdb: (tmdbId: number, opts?: { season?: number; episode?: number }) =>
      gqlQuery(GET_PLAYER, { provider: "alloha", tmdbId, ...opts }).then((d: any) => d.player),

    allohaByKp: (kpId: number, opts?: { season?: number; episode?: number }) =>
      gqlQuery(GET_PLAYER, { provider: "alloha", kpId, ...opts }).then((d: any) => d.player),

    cdn: (cdnId: number, opts?: { season?: number; episode?: number }) =>
      gqlQuery(GET_CDN_PLAYER, { cdnId, ...opts }).then((d: any) => d.cdnPlayer),

    cdnByImdb: (imdbId: string, opts?: { season?: number; episode?: number }) =>
      gqlQuery(GET_CDN_PLAYER, { imdbId, ...opts }).then((d: any) => d.cdnPlayer),

    cdnByKp: (kpId: number, opts?: { season?: number; episode?: number }) =>
      gqlQuery(GET_CDN_PLAYER, { kpId, ...opts }).then((d: any) => d.cdnPlayer),
  },

  user: {
    listFavorites: (opts: { page?: number; language?: string } = {}) =>
      gqlQuery(GET_FAVORITES, withDefaults(opts)).then((d: any) => d.favorites),

    addFavorite: (mediaId: number, mediaType: string = "movie") =>
      gqlMutate(ADD_FAVORITE, { mediaId, mediaType }).then((d: any) => d.addFavorite),

    removeFavorite: (mediaId: number, mediaType: string = "movie") =>
      gqlMutate(REMOVE_FAVORITE, { mediaId, mediaType }).then((d: any) => ({ deleted: d.removeFavorite })),

    checkFavorite: (_mediaId: number, _mediaType: string = "movie") =>
      Promise.resolve({ isFavorite: false }),

    listWatchLater: () =>
      gqlQuery(GET_WATCH_LATER, {}).then((d: any) => d.watchLater),

    addWatchLater: (mediaId: number) =>
      gqlMutate(ADD_WATCH_LATER, { mediaId }).then((d: any) => d.addToWatchLater),

    removeWatchLater: (mediaId: number) =>
      gqlMutate(REMOVE_WATCH_LATER, { mediaId }).then((d: any) => ({ deleted: d.removeFromWatchLater })),

    checkWatchLater: (_mediaId: number) =>
      Promise.resolve({ isSaved: false }),

    getSyncProgress: (opts: { language?: string } = {}) =>
      gqlQuery(GET_SYNC_PROGRESS, withDefaults(opts)).then((d: any) => d.syncProgress),

    upsertProgress: (body: { mediaId: number; mediaType?: string; season?: number; episode?: number; progress: number }) =>
      gqlMutate(UPSERT_PROGRESS, body).then((d: any) => d.upsertProgress),

    deleteProgress: (_body: { mediaId: number; mediaType?: string; season?: number; episode?: number }) =>
      Promise.resolve({ deleted: true }),

    batchSyncProgress: (items: { mediaId: number; mediaType?: string; season?: number; episode?: number; progress: number }[]) =>
      gqlMutate(BATCH_SYNC_PROGRESS, { items }).then((d: any) => d.batchSyncProgress),
  },

  system: {
    health: () => Promise.resolve({ ok: true }),
    supporters: () =>
      gqlQuery(GET_SUPPORTERS, {}).then((d: any) => d.supporters),
  },

  auth: {
    getLoginUrl: (redirectUri: string, pkce?: { code_challenge?: string; code_challenge_method?: string; state?: string }) =>
      gqlQuery(GET_LOGIN_URL, { redirectUri, codeChallenge: pkce?.code_challenge }).then((d: any) => ({ url: d.loginUrl })),

    exchangeCode: async (_code: string, _redirectUri: string, _codeVerifier?: string) => {
      throw new Error("exchangeCode must go through REST — Neo ID direct call");
    },

    refresh: (refreshToken: string) =>
      gqlMutate(REFRESH_TOKENS, { refreshToken }).then((d: any) => d.refreshTokens),

    profile: () =>
      gqlQuery(gql`query { health { ok } }`).then(() => ({ id: "", email: null })),

    logout: () =>
      gqlMutate(LOGOUT, {}).then(() => ({ ok: true })),
  },
};
