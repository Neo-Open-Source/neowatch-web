import type { ApiClient, QueryParams } from "./client";
import type {
  ApiLanguage,
  BatchSyncResult,
  EnrichedSyncProgressItem,
  FavoriteItem,
  MediaType,
  Paginated,
  SyncProgressItem,
  WatchLaterItem,
} from "./types";
import { DEFAULT_LANGUAGE } from "./types";
import { clearFavoritesSnapshot, rememberFavoriteState } from "@/lib/state/favorites-cache";

export function userEndpoints(client: ApiClient) {
  return {
    listFavorites: (opts: { page?: number; language?: ApiLanguage } = {}) => {
      const params: QueryParams = {
        language: opts.language ?? DEFAULT_LANGUAGE,
      };
      if (opts.page !== undefined) params.page = opts.page;
      return client.get<Paginated<FavoriteItem>>("/api/v1/favorites", params);
    },

    addFavorite: (mediaId: number, mediaType: MediaType = "movie") =>
      client.post<{ id: string; mediaId: number; mediaType: string }>(
        `/api/v1/favorites/${mediaId}?mediaType=${mediaType}`,
      ).then((res) => {
        // Server-side state changed — drop stale cached GETs and the instant-row snapshot.
        client.invalidateCache("/api/v1/favorites");
        clearFavoritesSnapshot();
        rememberFavoriteState(mediaId, mediaType, true);
        return res;
      }),

    removeFavorite: (mediaId: number, mediaType: MediaType = "movie") =>
      client.delete<{ deleted: boolean }>(`/api/v1/favorites/${mediaId}`, { mediaType })
        .then((res) => {
          client.invalidateCache("/api/v1/favorites");
          clearFavoritesSnapshot();
          rememberFavoriteState(mediaId, mediaType, false);
          return res;
        }),

    checkFavorite: (mediaId: number, mediaType: MediaType = "movie") =>
      client.get<{ isFavorite: boolean }>(`/api/v1/favorites/${mediaId}/check`, { mediaType })
        .then((res) => {
          rememberFavoriteState(mediaId, mediaType, res.isFavorite);
          return res;
        }),

    listWatchLater: () => client.get<WatchLaterItem[]>("/api/v1/watch-later"),

    addWatchLater: (mediaId: number) =>
      client.post<{ id: string; mediaId: number }>(`/api/v1/watch-later/${mediaId}`)
        .then((res) => {
          client.invalidateCache("/api/v1/watch-later");
          return res;
        }),

    removeWatchLater: (mediaId: number) =>
      client.delete<{ deleted: boolean }>(`/api/v1/watch-later/${mediaId}`)
        .then((res) => {
          client.invalidateCache("/api/v1/watch-later");
          return res;
        }),

    checkWatchLater: (mediaId: number) =>
      client.get<{ isSaved: boolean }>(`/api/v1/watch-later/${mediaId}/check`),

    getSyncProgress: (opts: { language?: ApiLanguage } = {}) => {
      const params: QueryParams = {
        language: opts.language ?? DEFAULT_LANGUAGE,
      };
      return client.get<EnrichedSyncProgressItem[]>("/api/v1/sync/progress", params);
    },

    upsertProgress: (body: {
      mediaId: number;
      mediaType?: MediaType;
      season?: number;
      episode?: number;
      progress: number;
    }) => client.put<SyncProgressItem>("/api/v1/sync/progress", body)
      .then((res) => {
        client.invalidateCache("/api/v1/sync");
        return res;
      }),

    deleteProgress: (body: {
      mediaId: number;
      mediaType?: MediaType;
      season?: number;
      episode?: number;
    }) => client.delete<{ deleted: boolean }>("/api/v1/sync/progress", undefined, body)
      .then((res) => {
        client.invalidateCache("/api/v1/sync");
        return res;
      }),

    batchSyncProgress: (items: {
      mediaId: number;
      mediaType?: MediaType;
      season?: number;
      episode?: number;
      progress: number;
    }[]) => client.post<BatchSyncResult>("/api/v1/sync/progress/batch", { items })
      .then((res) => {
        client.invalidateCache("/api/v1/sync");
        return res;
      }),
  };
}

export type UserApi = ReturnType<typeof userEndpoints>;
