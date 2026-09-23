"use client";

import { useEffect } from "react";
import { ShelfSection } from "@/components/sections/ShelfSection";
import { BackdropCard } from "@/components/cards/BackdropCard";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { EnrichedSyncProgressItem } from "@/lib/api/types";
import { useAuth } from "@/lib/context/auth-context";
import { useI18n } from "@/lib/context/i18n-context";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { getHomePersonal } from "@/lib/state/home-bootstrap";

/** Minimum items to show the row on the home page. */
const MIN_ITEMS = 3;

/**
 * Best-known snapshot — lets the row render instantly on repeat visits.
 * Keyed by userId so signing out / switching accounts doesn't leak data.
 */
const STORAGE_KEY = "nw_continue_watching";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getSnapshot(): EnrichedSyncProgressItem[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : null;
  } catch {
    return null;
  }
}

function setSnapshot(items: EnrichedSyncProgressItem[]) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

export function ContinueWatchingRow({
  title,
  focusKey,
}: {
  title: string;
  focusKey?: string;
}) {
  const { locale } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const enabled = !authLoading && isAuthenticated;

  const cached = enabled ? getSnapshot() : null;
  const personal = enabled ? getHomePersonal() : null;
  const personalItems = personal?.syncProgress ?? null;

  // personalItems in deps: pick up home.personal when it arrives post-unlock.
  const { data, error, loading } = useAsyncResource<EnrichedSyncProgressItem[]>(
    () =>
      enabled
        ? api.user.getSyncProgress({ language: toApiLanguage(locale) })
        : Promise.resolve([]),
    [locale, enabled, personalItems],
    personalItems,
  );

  // Write-through cache
  useEffect(() => {
    if (data && data.length > 0 && enabled) {
      setSnapshot(data);
    }
  }, [data, enabled]);

  if (!enabled) return null;

  const freshItems = data ?? [];
  const hasEnough = freshItems.length >= MIN_ITEMS;
  const cachedEnough = cached && cached.length >= MIN_ITEMS;
  const items = hasEnough ? freshItems : cachedEnough ? cached! : [];

  // Build backdrop cards
  const cards = items.map((item) => {
    // Card image: episode still for TV, backdrop for movie
    const imageUrl =
      item.mediaType === "tv" && item.episodeStill
        ? item.episodeStill
        : item.backdrop ?? item.poster ?? null;

    // Label: show name + episode info for TV, movie title for movies
    const label =
      item.mediaType === "tv"
        ? `${item.title ?? "Unknown"}${item.season != null && item.episode != null ? ` · S${item.season} E${item.episode}` : ""}${item.episodeName ? ` — ${item.episodeName}` : ""}`
        : item.title ?? "Unknown";

    return { item, imageUrl, label };
  });

  const visible = (!loading && !error && hasEnough) || (error && cachedEnough);

  if (!visible) {
    if (loading && cachedEnough) {
      // Show cached row while loading
      return (
        <ShelfSection title={title} focusKey={focusKey}>
          {cached!.slice(0, 12).map((item) => {
            const imageUrl =
              item.mediaType === "tv" && item.episodeStill
                ? item.episodeStill
                : item.backdrop ?? item.poster ?? null;
            const label =
              item.mediaType === "tv"
                ? `${item.title ?? "Unknown"}${item.season != null && item.episode != null ? ` · S${item.season} E${item.episode}` : ""}`
                : item.title ?? "Unknown";
            return (
              <BackdropCard
                key={`${item.mediaId}-${item.season}-${item.episode}`}
                item={{
                  id: `${item.mediaId}-${item.season}-${item.episode}`,
                  name: label,
                  backdropUrl: imageUrl ?? "",
                  progressPercent: item.progress,
                }}
              />
            );
          })}
        </ShelfSection>
      );
    }
    return null;
  }

  return (
    <ShelfSection title={title} focusKey={focusKey}>
      {cards.map(({ item, imageUrl, label }) => (
        <BackdropCard
          key={`${item.mediaId}-${item.season}-${item.episode}`}
          item={{
            id: `${item.mediaId}-${item.season}-${item.episode}`,
            name: label,
            backdropUrl: imageUrl ?? "",
            progressPercent: item.progress,
          }}
        />
      ))}
    </ShelfSection>
  );
}
