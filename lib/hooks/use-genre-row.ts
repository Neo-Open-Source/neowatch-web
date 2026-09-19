"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ApiLanguage, CategoryItem, MediaItem } from "@/lib/api/types";
import { mediaKey } from "@/lib/utils/media-key";

/** Reads a px-typed CSS custom property with a fallback for SSR/missing tokens. */
function cssPx(varName: string, fallback: number): number {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const px = parseFloat(raw);
  return Number.isFinite(px) && px > 0 ? px : fallback;
}

/**
 * Poster card width from the `--card-poster-w` token (responsive). Falls back
 * to 200 when unavailable (SSR) so row math still works.
 */
function posterCardWidth(): number {
  return cssPx("--card-poster-w", 200);
}

/**
 * How many cards a shelf row needs to visibly reach the right edge of the
 * screen (plus one extra). Used to keep pulling pages until a short first page
 * no longer leaves the row half-empty.
 */
function rowTargetCount(): number {
  if (typeof window === "undefined") return 10;
  const sidePad = cssPx("--nw-side-pad", 48);
  const gap = cssPx("--nw-card-gap", 10);
  const usable = Math.max(1, window.innerWidth - 2 * sidePad);
  return Math.max(10, Math.ceil(usable / (posterCardWidth() + gap)) + 1);
}

const objectKey = (mediaType: "movie" | "tv", tmdbId: number) => mediaKey(mediaType, tmdbId);

function dedupe(items: MediaItem[], mediaType: "movie" | "tv"): MediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = objectKey(mediaType, item.tmdbId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type GenreRowStatus = "loading" | "ready" | "error";

interface GenreRowState {
  items: MediaItem[];
  status: GenreRowStatus;
}

/**
 * Loads a genre's collection row. Genre collections overlap heavily (e.g.
 * Action and Adventure share their whole top of the list), so pages are pulled
 * until enough titles *not yet shown in another row* are found. Fresh titles
 * lead the row; the tail is padded with already-seen ones so the row always
 * reaches the screen edge. Every freshly shown title is claimed in `usedKeys`
 * so later rows avoid it.
 */
export function useGenreRow(
  genre: CategoryItem,
  mediaType: "movie" | "tv",
  lang: ApiLanguage,
  usedKeys: Set<string>,
): GenreRowState {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [status, setStatus] = useState<GenreRowStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const target = rowTargetCount();
      const maxPages = Math.max(4, Math.ceil(target / 4)); // don't sweep the whole collection
      let page = 1;
      let pool: MediaItem[] = [];
      let totalPages = 1;

      try {
        let freshCount = 0;
        do {
          const res = await api.categories.collection(genre.id, { language: lang, page });
          if (cancelled) return;
          totalPages = res.totalPages;
          pool = dedupe(pool.concat(res.items), mediaType);
          freshCount = pool.filter((item) => !usedKeys.has(objectKey(mediaType, item.tmdbId))).length;
          page += 1;
        } while (freshCount < target && page <= totalPages && page <= maxPages);

        if (cancelled) return;
        const fresh = pool.filter((item) => !usedKeys.has(objectKey(mediaType, item.tmdbId)));
        const seen = pool.filter((item) => usedKeys.has(objectKey(mediaType, item.tmdbId)));
        for (const item of fresh) usedKeys.add(objectKey(mediaType, item.tmdbId));
        setItems([...fresh, ...seen].slice(0, target));
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [genre.id, lang, mediaType, usedKeys]);

  return { items, status };
}