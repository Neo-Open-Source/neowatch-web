import type { ApiClient, QueryParams } from "./client";
import type { KodikPlaylist, PlayerAvailability, PlayerResponse } from "./types";

export interface PlayerOptions {
  season?: number;
  episode?: number;
  translation?: number;
}

function playerParams(opts: PlayerOptions = {}): QueryParams {
  const params: QueryParams = {};
  if (opts.season !== undefined) params.season = opts.season;
  if (opts.episode !== undefined) params.episode = opts.episode;
  if (opts.translation !== undefined) params.translation = opts.translation;
  return params;
}

export function playerEndpoints(client: ApiClient) {
  return {
    availability: (ids: { kpId?: number; tmdbId?: number; imdbId?: string }) =>
      client.get<PlayerAvailability>("/api/v1/player/availability", {
        kp: ids.kpId,
        tmdb: ids.tmdbId,
        imdb: ids.imdbId,
      }),

    allohaByTmdb: (tmdbId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/alloha/tmdb/${tmdbId}`, { ...playerParams(opts), format: "url" }),

    allohaByKp: (kpId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/alloha/kp/${kpId}`, { ...playerParams(opts), format: "url" }),

    allohaByImdb: (imdbId: string, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/alloha/imdb/${imdbId}`, { ...playerParams(opts), format: "url" }),

    collapsByKp: (kpId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/collaps/kp/${kpId}`, { ...playerParams(opts), format: "url" }),

    collapsByImdb: (imdbId: string, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/collaps/imdb/${imdbId}`, { ...playerParams(opts), format: "url" }),

    kodik: (ids: { kpId?: number; imdbId?: string; shikimoriId?: number }) =>
      client.get<KodikPlaylist>("/api/v1/player/kodik/proxy", {
        ...ids,
        format: "json",
      }),

    kodikByKp: (kpId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/kodik/kp/${kpId}`, { ...playerParams(opts), format: "url" }),

    kodikByImdb: (imdbId: string, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/kodik/imdb/${imdbId}`, { ...playerParams(opts), format: "url" }),

    cdn: (cdnId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/cdn/${cdnId}`, playerParams(opts)),

    cdnByImdb: (imdbId: string, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/cdn/imdb/${imdbId}`, playerParams(opts)),

    cdnByKp: (kpId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/cdn/kp/${kpId}`, playerParams(opts)),
  };
}

export type PlayersApi = ReturnType<typeof playerEndpoints>;
