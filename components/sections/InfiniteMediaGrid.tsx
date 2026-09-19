"use client";

import { useEffect, useRef } from "react";
import { FocusContext, useFocusable, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import type { MediaType, Paginated } from "@/lib/api/types";
import { MediaCard } from "@/components/cards/MediaCard";
import { useInfiniteMediaSource, type GridItem } from "@/lib/hooks/use-infinite-media-source";
import { useI18n } from "@/lib/context/i18n-context";
import { NAVBAR_SEARCH_FOCUS_KEY } from "@/components/Header";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const SKELETONS = makeSkeletonKeys(12);

export interface InfiniteGridProps {
  loader: (page: number) => Promise<Paginated<GridItem>>;
  focusKeyPrefix: string;
  /** Fallback type for endpoints whose items carry no `mediaType` (movieList/tvList). */
  mediaType?: MediaType;
}

export function InfiniteMediaGrid({ loader, focusKeyPrefix, mediaType }: InfiniteGridProps) {
  const { t } = useI18n();
  const { items, initialLoading, loadingMore, error, hasMore, sentinelRef } = useInfiniteMediaSource(loader);

  const { ref: gridRef, focusKey } = useFocusable({
    focusKey: `GRID_${focusKeyPrefix}`,
    trackChildren: true,
    autoRestoreFocus: true,
    isFocusBoundary: false,
    // Empty during load / error — don't become an invisible navigation target.
    focusable: !initialLoading && items.length > 0,
    preferredChildFocusKey: `${focusKeyPrefix}-0`,
    onArrowPress: (dir) => {
      if (dir === "up") {
        setFocus(NAVBAR_SEARCH_FOCUS_KEY);
        return false;
      }
      return true;
    },
  });

  // Focus first card after initial load completes
  const focusedOnLoad = useRef(false);
  useEffect(() => {
    if (focusedOnLoad.current || initialLoading || items.length === 0) return;
    focusedOnLoad.current = true;
    setFocus(`${focusKeyPrefix}-0`);
  }, [initialLoading, items.length, focusKeyPrefix]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={gridRef as React.RefObject<HTMLDivElement>}
        className="media-grid"
        data-spatial-grid
      >
        {items.map((item, i) => (
          <MediaCard
            key={item.mediaType ? `${item.mediaType}-${item.tmdbId}` : `item-${item.tmdbId}`}
            item={item}
            focusKey={`${focusKeyPrefix}-${i}`}
            mediaType={mediaType}
          />
        ))}

        {initialLoading && items.length === 0 && SKELETONS.map((k) => <MediaCard key={`skeleton-${k}`} />)}

        {error && <p className="media-grid__status">{t.search.error}</p>}

        {!hasMore && !error && items.length > 0 && (
          <p className="media-grid__status">{t.list.allLoaded}</p>
        )}

        <div ref={sentinelRef as React.RefObject<HTMLDivElement>} aria-hidden="true" className={loadingMore && items.length > 0 ? "media-grid__loading-more" : ""} />
      </div>
    </FocusContext.Provider>
  );
}