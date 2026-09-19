import type { ApiClient, QueryParams } from "./client";
import type { PlayerResponse } from "./types";

export interface PlayerOptions {
  season?: number;
  episode?: number;
}

function playerParams(opts: PlayerOptions = {}): QueryParams {
  const params: QueryParams = {};
  if (opts.season !== undefined) params.season = opts.season;
  if (opts.episode !== undefined) params.episode = opts.episode;
  return params;
}

export function playerEndpoints(client: ApiClient) {
  return {
    allohaByTmdb: (tmdbId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/alloha/tmdb/${tmdbId}`, playerParams(opts)),

    allohaByKp: (kpId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/alloha/kp/${kpId}`, playerParams(opts)),

    cdn: (cdnId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/cdn/${cdnId}`, playerParams(opts)),

    cdnByImdb: (imdbId: string, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/cdn/imdb/${imdbId}`, playerParams(opts)),

    cdnByKp: (kpId: number, opts?: PlayerOptions) =>
      client.get<PlayerResponse>(`/api/v1/player/cdn/kp/${kpId}`, playerParams(opts)),
  };
}

export type PlayersApi = ReturnType<typeof playerEndpoints>;
