import { apiOrigin } from "../config";
import { createAccountApi } from "./account";
import { createCatalogApi } from "./catalog";
import { ApiClient } from "./client";
import { createPlaybackApi } from "./playback";

export function createApi(accessToken: string | null = null) {
  const client = new ApiClient(apiOrigin(), accessToken);
  return {
    origin: client.origin,
    catalog: createCatalogApi(client),
    playback: createPlaybackApi(client),
    account: createAccountApi(client),
  };
}

export type Api = ReturnType<typeof createApi>;

export { proxiedImage } from "./images";
