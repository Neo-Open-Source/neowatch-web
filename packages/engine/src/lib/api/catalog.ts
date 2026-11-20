import type { ApiClient } from "./client";
import { query } from "./client";
import { normalizeCard, type WireCard } from "./normalize";
import type { BrowsePage, BrowseParams } from "./types";

const FEED_TTL_MS = 60_000;

export function createCatalogApi(client: ApiClient) {
  return {
    async browse(params: BrowseParams = {}): Promise<BrowsePage> {
      const path = `/api/v1/catalog/browse${query(params)}`;
      const page = await client.get<Omit<BrowsePage, "items"> & { items: WireCard[] }>(path, {
        ttlMs: FEED_TTL_MS,
      });
      return { ...page, items: page.items.map(normalizeCard) };
    },
  };
}
