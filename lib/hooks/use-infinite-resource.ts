"use client";

import { useCallback, useEffect, useRef, useState, startTransition, type DependencyList } from "react";
import { beginDataLoad, endDataLoad } from "@/lib/state/data-loading";
import type { Paginated } from "@/lib/api/types";
import { mediaKey } from "@/lib/utils/media-key";

interface InfiniteResource<T> {
  items: T[];
  loading: boolean;      // initial load
  loadingMore: boolean;  // loading next page
  error: boolean;
  hasMore: boolean;
  loadMore: () => boolean | Promise<boolean>;
}

const itemDedupeKey = (item: unknown): string => {
  if (item && typeof item === "object" && "tmdbId" in item) {
    const mediaType = (item as { mediaType?: unknown }).mediaType;
    const tmdbId = (item as { tmdbId: unknown }).tmdbId;
    return typeof tmdbId === "number" ? mediaKey(String(mediaType), tmdbId) : String(item);
  }
  return String(item);
};

export function useInfiniteResource<T>(
  loader: (page: number) => Promise<Paginated<T>>,
  deps: DependencyList,
): InfiniteResource<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const loaderRef = useRef(loader);
  const pageRef = useRef(page);
  const totalPagesRef = useRef(totalPages);
  const busyRef = useRef(false);

  // Sync latest values into refs after commit so `loadMore` stays stable
  // (no IntersectionObserver churn) while always reading fresh state.
  useEffect(() => {
    loaderRef.current = loader;
    pageRef.current = page;
    totalPagesRef.current = totalPages;
  }, [loader, page, totalPages]);

  // Reset on dep change
  useEffect(() => {
    let cancelled = false;
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        endDataLoad();
      }
    };

    busyRef.current = true;
    startTransition(() => {
      setItems([]);
      setPage(1);
      setTotalPages(1);
      setLoading(true);
      setLoadingMore(false);
      setError(false);
    });
    beginDataLoad();

    loaderRef.current(1)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotalPages(res.totalPages);
        setPage(res.page);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => {
        busyRef.current = false;
        if (!cancelled) setLoading(false);
        finish();
      });

    return () => { cancelled = true; busyRef.current = false; finish(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback((): boolean | Promise<boolean> => {
    if (busyRef.current) return false;
    const nextPage = pageRef.current + 1;
    if (nextPage > totalPagesRef.current) return false;
    busyRef.current = true;
    setLoadingMore(true);

    return loaderRef.current(nextPage)
      .then((res) => {
        setItems((prev) => {
          const existingKeys = new Set(prev.map(itemDedupeKey));
          const fresh = res.items.filter((item) => !existingKeys.has(itemDedupeKey(item)));
          if (fresh.length === 0) return prev;
          return [...prev, ...fresh];
        });
        setTotalPages(res.totalPages);
        setPage(nextPage);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        busyRef.current = false;
        setLoadingMore(false);
      });
  }, []);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore: page < totalPages,
    loadMore,
  };
}
