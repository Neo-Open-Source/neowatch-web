"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollOptions {
  /** IntersectionObserver rootMargin — how far ahead of the viewport the sentinel loads. */
  rootMargin?: string;
  /** External gate (e.g. keep off while an error is shown or initial load is running). */
  enabled?: boolean;
}

/**
 * Loads the next page once a sentinel enters the viewport.
 *
 * IntersectionObserver only fires when the intersection state *changes*. After a
 * page is appended the sentinel can stay inside the rootMargin (e.g. short result
 * sets), so no new callback would fire and the scroll would stall until the user
 * scrolled away and back. This hook forces a fresh intersection callback after
 * every successful load (`loadMore` returns `true`), so it keeps loading while the
 * sentinel is still within view and stops as soon as it leaves the margin or
 * `hasMore`/`enabled` turn off.
 */
export function useInfiniteScroll(
  sentinelRef: React.RefObject<HTMLElement | null>,
  loadMore: () => boolean | Promise<boolean>,
  hasMore: boolean,
  { rootMargin = "200px", enabled = true }: InfiniteScrollOptions = {},
): void {
  const loadMoreRef = useRef(loadMore);
  const hasMoreRef = useRef(hasMore);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    loadMoreRef.current = loadMore;
    hasMoreRef.current = hasMore;
    enabledRef.current = enabled;
  }, [loadMore, hasMore, enabled]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    let disposed = false;
    let inFlight = false;
    const intersecting = { value: false };

    let observer: IntersectionObserver;

    const attempt = () => {
      if (disposed || inFlight) return;
      if (!intersecting.value || !hasMoreRef.current || !enabledRef.current) return;
      inFlight = true;
      Promise.resolve(loadMoreRef.current()).then((didLoad) => {
        inFlight = false;
        if (disposed) return;
        // Unobserve + observe forces a fresh callback with the current state —
        // otherwise the sentinel staying inside the margin after a load would
        // never re-trigger (no intersection *change*).
        if (didLoad && intersecting.value) {
          observer.unobserve(sentinel);
          observer.observe(sentinel);
        }
      });
    };

    observer = new IntersectionObserver(
      (entries) => {
        intersecting.value = Boolean(entries[0]?.isIntersecting);
        attempt();
      },
      { rootMargin },
    );
    observer.observe(sentinel);

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [sentinelRef, rootMargin, hasMore, enabled]);
}
