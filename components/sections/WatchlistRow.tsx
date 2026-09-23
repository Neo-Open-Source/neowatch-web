"use client";

import { useEffect } from "react";
import { ShelfSection } from "@/components/sections/ShelfSection";
import { MediaCard } from "@/components/cards/MediaCard";
import { SeeAllCard } from "@/components/cards/SeeAllCard";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { FavoriteItem, Paginated } from "@/lib/api/types";
import { useAuth } from "@/lib/context/auth-context";
import { useI18n } from "@/lib/context/i18n-context";
import { useInputMode } from "@/lib/context/input-mode";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { getStoredAccessToken } from "@/lib/state/auth-session";
import { getFavoritesSnapshot, setFavoritesSnapshot } from "@/lib/state/favorites-cache";
import { getHomePersonal } from "@/lib/state/home-bootstrap";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

/** Home shelf only when the list has at least 3 titles. */
const MIN_HOME_ITEMS = 3;

const SKELETONS = makeSkeletonKeys(10);

export function WatchlistRow({ title, focusKey }: { title: string; focusKey?: string }) {
  const { locale } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isSpatial = useInputMode();
  const enabled = !authLoading && isAuthenticated;

  // Best-known snapshot — lets the row render instantly (real cards) on repeat
  // visits; the site "knows" the count up front instead of waiting for the fetch.
  const cached = enabled ? getFavoritesSnapshot() : null;
  const personal = enabled ? getHomePersonal() : null;
  const personalFavorites = personal?.favorites ?? null;

  // personalFavorites in deps: adopt home.personal when it lands after unlock.
  const { data, error, loading } = useAsyncResource<Paginated<FavoriteItem> | null>(
    () =>
      enabled
        ? api.user.listFavorites({ language: toApiLanguage(locale) })
        : Promise.resolve(null),
    [locale, enabled, personalFavorites],
    personalFavorites,
  );

  // Write-through: keep the snapshot fresh for the next visit.
  useEffect(() => {
    if (data && enabled) {
      setFavoritesSnapshot(data.items, data.totalResults);
    }
  }, [data, enabled]);

  if (!enabled) {
    // Auth still resolving: show the local snapshot as soon as a session is
    // likely (token present) instead of leaving a blank gap.
    const hasToken = typeof window !== "undefined" && !!getStoredAccessToken();
    if (authLoading && hasToken) {
      const snap = getFavoritesSnapshot();
      if (snap && snap.totalResults >= MIN_HOME_ITEMS && snap.items.length > 0) {
        return (
          <ShelfSection title={title} href="/watchlist" focusKey={focusKey}>
            {snap.items.map((item, i) => (
              <MediaCard
                key={`${item.mediaType}-${item.tmdbId}`}
                item={item}
                focusKey={focusKey ? `${focusKey}-card-${i}` : undefined}
              />
            ))}
          </ShelfSection>
        );
      }
    }
    return null;
  }

  const freshTotal = data?.totalResults ?? 0;
  const freshItems = data?.items ?? [];
  const cachedRow =
    cached && cached.totalResults >= MIN_HOME_ITEMS && cached.items.length > 0;
  const freshRow =
    freshTotal >= MIN_HOME_ITEMS && freshItems.length > 0;

  const seeAllCard =
    isSpatial && focusKey && (freshRow || cachedRow) ? (
      <SeeAllCard href="/watchlist" focusKey={`${focusKey}-see-all`} />
    ) : null;

  // Fresh fetch succeeded and clears the threshold → real row.
  if (!loading && !error && freshRow) {
    return (
      <ShelfSection title={title} href="/watchlist" focusKey={focusKey}>
        {freshItems.map((item, i) => (
          <MediaCard
            key={`${item.mediaType}-${item.tmdbId}`}
            item={item}
            focusKey={focusKey ? `${focusKey}-card-${i}` : undefined}
          />
        ))}
        {seeAllCard}
      </ShelfSection>
    );
  }

  // Fetch failed but a cached snapshot still clears the threshold → cached row.
  if (error && cachedRow) {
    return (
      <ShelfSection title={title} href="/watchlist" focusKey={focusKey}>
        {cached!.items.map((item, i) => (
          <MediaCard
            key={`${item.mediaType}-${item.tmdbId}`}
            item={item}
            focusKey={focusKey ? `${focusKey}-card-${i}` : undefined}
          />
        ))}
        {seeAllCard}
      </ShelfSection>
    );
  }

  // Loaded with too few titles → hide the row.
  if (!loading) return null;

  // Still loading: if the snapshot already knows the count, use it to decide
  // between an instant cached row and a hidden (known-empty) row — only when
  // we have no snapshot at all do we render skeletons.
  if (cachedRow) {
    return (
      <ShelfSection title={title} href="/watchlist" focusKey={focusKey}>
        {cached!.items.map((item, i) => (
          <MediaCard
            key={`${item.mediaType}-${item.tmdbId}`}
            item={item}
            focusKey={focusKey ? `${focusKey}-card-${i}` : undefined}
          />
        ))}
        {seeAllCard}
      </ShelfSection>
    );
  }

  if (cached) return null;

  return (
    <ShelfSection title={title} loading href="/watchlist" focusKey={focusKey}>
      {SKELETONS.map((k) => (
        <MediaCard key={k} />
      ))}
    </ShelfSection>
  );
}
