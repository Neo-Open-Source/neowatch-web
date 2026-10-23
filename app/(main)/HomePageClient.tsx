"use client";

import { useEffect } from "react";
import type { CategorySection, MediaItem, Studio, TrendingItem } from "@/lib/api/types";
import { StudiosRow } from "@/components/sections/StudiosRow";
import { WatchlistRow } from "@/components/sections/WatchlistRow";
import { TrendingRow } from "@/components/sections/TrendingRow";
import { MediaListRow } from "@/components/sections/MediaListRow";
import { ContinueWatchingRow } from "@/components/sections/ContinueWatchingRow";
import { useI18n } from "@/lib/context/i18n-context";
import { toApiLanguage } from "@/lib/api/types";
import { setHomeCategories } from "@/lib/state/home-bootstrap";
import { PageTitle } from "@/components/ui/PageTitle";
import { useInitialFocus } from "@/lib/hooks/use-initial-focus";

export interface HomeInitialData {
  trending: TrendingItem[];
  topMovies: MediaItem[];
  topSeries: MediaItem[];
  studios: Studio[];
  categories?: CategorySection[];
}

export function HomePageClient({ initial }: { initial: HomeInitialData | null }) {
  const { t, locale } = useI18n();

  // Seed the client categories cache so the header dropdown skips its own fetch.
  useEffect(() => {
    if (initial?.categories?.length) {
      setHomeCategories(toApiLanguage(locale), initial.categories);
    }
  }, [initial?.categories, locale]);

  // Приоритет фокуса: continue watching → watchlist → студии.
  useInitialFocus(["row-continue-card-0", "row-watchlist-card-0", "row-studios-card-0"]);

  return (
    <>
      <PageTitle>{t.meta.home}</PageTitle>
      <h1 className="visually-hidden">{t.meta.home}</h1>

      {/* 1. Continue Watching — auth required, 3+ items minimum */}
      <ContinueWatchingRow title={t.home.continueWatching} focusKey="row-continue" />

      {/* 2. Watchlist — только для авторизованных с 3+ тайтлами */}
      <WatchlistRow title={t.home.watchlist} focusKey="row-watchlist" />

      {/* 3. Популярные студии */}
      <StudiosRow title={t.home.popularStudios} focusKey="row-studios" initialData={initial?.studios ?? null} />

      {/* 4. Популярное */}
      <TrendingRow title={t.home.popular} focusKey="row-trending" initialData={initial?.trending ?? null} />

      {/* 5. Топ фильмов */}
      <MediaListRow title={t.home.topMovies} focusKey="row-top-movies" type="movie" initialData={initial?.topMovies ?? null} />

      {/* 6. Топ сериалов */}
      <MediaListRow title={t.home.topSeries} focusKey="row-top-series" type="tv" initialData={initial?.topSeries ?? null} />
    </>
  );
}
