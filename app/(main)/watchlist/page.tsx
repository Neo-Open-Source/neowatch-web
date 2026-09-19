"use client";

import { useCallback, useEffect, useRef } from "react";
import { FocusContext, useFocusable, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { useAuth } from "@/lib/context/auth-context";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { FavoriteItem } from "@/lib/api/types";
import { PageTitle } from "@/components/ui/PageTitle";
import { MediaCard } from "@/components/cards/MediaCard";
import { NAVBAR_SEARCH_FOCUS_KEY } from "@/components/Header";
import { useInfiniteMediaSource } from "@/lib/hooks/use-infinite-media-source";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";
import { setFavoritesSnapshot } from "@/lib/state/favorites-cache";

const SKELETONS = makeSkeletonKeys(12);
const FOCUS_PREFIX = "watchlist-card";

export default function WatchlistPage() {
  const { t, locale } = useI18n();
  const { isAuthenticated, loading: authLoading, signIn } = useAuth();
  const lang = toApiLanguage(locale);

  const loader = useCallback(
    (page: number) => api.user.listFavorites({ language: lang, page }),
    [lang],
  );

  return (
    <>
      <PageTitle>{t.meta.watchlist}</PageTitle>
      <div className="list-page__header">
        <h1 className="list-page__title">{t.watchlist.title}</h1>
      </div>

      {authLoading ? (
        <p className="media-grid__status">{t.search.loading}</p>
      ) : !isAuthenticated ? (
        <div className="watchlist-empty">
          <p className="watchlist-empty__text">{t.watchlist.signInPrompt}</p>
          <button type="button" className="watchlist-empty__btn" onClick={() => void signIn()}>
            {t.watchlist.signIn}
          </button>
        </div>
      ) : (
        <WatchlistGrid loader={loader} />
      )}
    </>
  );
}

function WatchlistGrid({
  loader,
}: {
  loader: (page: number) => ReturnType<typeof api.user.listFavorites>;
}) {
  const { t } = useI18n();
  const { items, initialLoading, loadingMore, error, hasMore, sentinelRef } =
    useInfiniteMediaSource(loader);

  const { ref: gridRef, focusKey } = useFocusable({
    focusKey: `GRID_${FOCUS_PREFIX}`,
    trackChildren: true,
    autoRestoreFocus: true,
    isFocusBoundary: false,
    focusable: !initialLoading && items.length > 0,
    preferredChildFocusKey: `${FOCUS_PREFIX}-0`,
    onArrowPress: (dir) => {
      if (dir === "up") {
        setFocus(NAVBAR_SEARCH_FOCUS_KEY);
        return false;
      }
      return true;
    },
  });

  const focusedOnLoad = useRef(false);
  useEffect(() => {
    if (focusedOnLoad.current || initialLoading || items.length === 0) return;
    focusedOnLoad.current = true;
    setFocus(`${FOCUS_PREFIX}-0`);
  }, [initialLoading, items.length]);

  // Keep the home-row snapshot fresh after a visit to the watchlist page.
  const wroteSnapshot = useRef(false);
  useEffect(() => {
    if (wroteSnapshot.current || initialLoading || items.length === 0) return;
    wroteSnapshot.current = true;
    // The grid is backed by listFavorites, so items are FavoriteItems at runtime.
    setFavoritesSnapshot(items as FavoriteItem[], items.length);
  }, [initialLoading, items]);

  if (!initialLoading && !error && items.length === 0) {
    return (
      <div className="watchlist-empty">
        <p className="watchlist-empty__text">{t.watchlist.empty}</p>
      </div>
    );
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={gridRef as React.RefObject<HTMLDivElement>}
        className="media-grid"
        data-spatial-grid
      >
        {items.map((item, i) => (
          <MediaCard
            key={`${item.mediaType}-${item.tmdbId}`}
            item={item}
            focusKey={`${FOCUS_PREFIX}-${i}`}
          />
        ))}

        {initialLoading && items.length === 0 && SKELETONS.map((k) => (
          <MediaCard key={`skeleton-${k}`} />
        ))}

        {error && <p className="media-grid__status">{t.home.error}</p>}

        {!hasMore && !error && items.length > 0 && (
          <p className="media-grid__status">{t.list.allLoaded}</p>
        )}

        <div
          ref={sentinelRef as React.RefObject<HTMLDivElement>}
          aria-hidden="true"
          className={loadingMore && items.length > 0 ? "media-grid__loading-more" : ""}
        />
      </div>
    </FocusContext.Provider>
  );
}
