import type { ApiClient } from "./client";
import { query } from "./client";
import type { Playback, PlaybackParams } from "./types";

const PLAYBACK_TTL_MS = 60_000;

export function createPlaybackApi(client: ApiClient) {
  return {
    media(params: PlaybackParams): Promise<Playback> {
      return client.get<Playback>(`/api/v1/player/media${query(params)}`, { ttlMs: PLAYBACK_TTL_MS });
    },
  };
}
