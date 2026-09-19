"use client";

import { ShelfSection } from "@/components/sections/ShelfSection";
import { MediaCard } from "@/components/cards/MediaCard";
import { SeeAllCard } from "@/components/cards/SeeAllCard";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { TrendingItem } from "@/lib/api/types";
import { useI18n } from "@/lib/context/i18n-context";
import { useInputMode } from "@/lib/context/input-mode";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const SKELETONS = makeSkeletonKeys(14);

export function TrendingRow({
  title,
  focusKey,
  initialData,
}: {
  title: string;
  focusKey?: string;
  /** SSR-fetched items — skips the post-hydration API call on first load. */
  initialData?: TrendingItem[] | null;
}) {
  const { t, locale } = useI18n();
  const isSpatial = useInputMode();
  const { data: items, error, loading } = useAsyncResource<TrendingItem[]>(
    () => api.media.trending({ language: toApiLanguage(locale) }).then((res) => res.items),
    [locale],
    initialData,
  );

  const seeAllCard =
    isSpatial && !loading && !error && focusKey ? (
      <SeeAllCard href="/popular" focusKey={`${focusKey}-see-all`} />
    ) : null;

  return (
    <ShelfSection title={title} loading={loading} href="/popular" focusKey={focusKey}>
      {error ? (
        <p className="shelf-section__error">{t.home.error}</p>
      ) : loading ? (
        SKELETONS.map((k) => <MediaCard key={k} />)
      ) : (
        <>
          {items?.map((item, i) => (
            <MediaCard key={`${item.mediaType}-${item.tmdbId}`} item={item} focusKey={focusKey ? `${focusKey}-card-${i}` : undefined} />
          ))}
          {seeAllCard}
        </>
      )}
    </ShelfSection>
  );
}
