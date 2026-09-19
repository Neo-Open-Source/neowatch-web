"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { beginDataLoad, endDataLoad } from "@/lib/state/data-loading";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import type { MediaItem, MediaType, Paginated } from "@/lib/api/types";
import { mediaKey } from "@/lib/utils/media-key";

export type GridItem = MediaItem & { mediaType?: MediaType };

export interface InfiniteMediaSource {
  items: GridItem[];
  initialLoading: boolean;
  loadingMore: boolean;
  error: boolean;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

function itemKey(item: GridItem): string {
  return mediaKey(item.mediaType, item.tmdbId);
}

/**
 * Loads a paged media list with infinite scroll and duplicate suppression.
 * The sentinel hook keeps loading while the sentinel is inside the viewport,
 * so short pages don't stall the grid.
 */
export function useInfiniteMediaSource(
  loader: (page: number) => Promise<Paginated<GridItem>>,
): InfiniteMediaSource {
  const [items, setItems] = useState<GridItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());

  // Latest state mirrored into a ref so the stable IntersectionObserver
  // callback never goes stale and never needs to be re-created.
  const stateRef = useRef({ page, hasMore, error });
  useEffect(() => {
    stateRef.current = { page, hasMore, error };
  }, [page, hasMore, error]);

  const mergeItems = useCallback((next: GridItem[]) => {
    const seen = seenRef.current;
    const fresh: GridItem[] = [];
    for (const item of next) {
      const key = itemKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      fresh.push(item);
    }
    if (fresh.length === 0) return;
    setItems((prev) => [...prev, ...fresh]);
  }, []);

  const loadPage = useCallback(
    async (pageNum: number): Promise<boolean> => {
      if (busyRef.current) return false;
      busyRef.current = true;
      setLoadingMore(true);
      setError(false);
      beginDataLoad();
      try {
        const res = await loader(pageNum);
        mergeItems(res.items);
        setPage(res.page + 1);
        setHasMore(res.page < res.totalPages);
        return true;
      } catch {
        setError(true);
        return false;
      } finally {
        busyRef.current = false;
        setLoadingMore(false);
        endDataLoad();
      }
    },
    [loader, mergeItems],
  );

  // Initial load — reset everything synchronously when loader changes
  useEffect(() => {
    let cancelled = false;
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        endDataLoad();
      }
    };

    seenRef.current = new Set();
    startTransition(() => {
      setItems([]);
      setPage(1);
      setHasMore(true);
      setError(false);
      setInitialLoading(true);
      setLoadingMore(false);
    });
    busyRef.current = true;
    beginDataLoad();

    loader(1)
      .then((res) => {
        if (cancelled) return;
        mergeItems(res.items);
        setPage(res.page + 1);
        setHasMore(res.page < res.totalPages);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => {
        busyRef.current = false;
        if (!cancelled) setInitialLoading(false);
        finish();
      });

    return () => {
      cancelled = true;
      busyRef.current = false;
      finish();
    };
  }, [loader, mergeItems]);

  // Infinite scroll: stable observer + re-check after every load so short pages
  // that leave the sentinel inside the margin still keep loading.
  useInfiniteScroll(
    sentinelRef,
    () => loadPage(stateRef.current.page),
    hasMore,
    { rootMargin: "600px 0px", enabled: !initialLoading && !error },
  );

  return {
    items,
    initialLoading,
    loadingMore,
    error,
    hasMore,
    sentinelRef,
  };
}