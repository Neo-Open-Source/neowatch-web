"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { CategoryItem, CategorySection, GenresResponse } from "@/lib/api/types";
import { useI18n } from "@/lib/context/i18n-context";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { useInputMode } from "@/lib/context/input-mode";
import { useInitialFocus } from "@/lib/hooks/use-initial-focus";
import { useLazyVisible } from "@/lib/hooks/use-lazy-visible";
import { useGenreRow } from "@/lib/hooks/use-genre-row";
import { PageTitle } from "@/components/ui/PageTitle";
import { ShelfSection } from "@/components/sections/ShelfSection";
import { MediaCard } from "@/components/cards/MediaCard";
import { SeeAllCard } from "@/components/cards/SeeAllCard";
import { GenreCard } from "@/components/cards/GenreCard";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const GENRES_SECTION = "Genres";
const GENRE_SKELETONS = makeSkeletonKeys(12);
const MEDIA_SKELETONS = makeSkeletonKeys(14);
/** How many poster-row placeholders to show while the category list is loading. */
const ROW_PLACEHOLDERS = 3;

function MediaRowSkeletons() {
  return (
    <>
      {MEDIA_SKELETONS.map((k) => (
        <MediaCard key={k} />
      ))}
    </>
  );
}

/** Fetches and renders a genre row — only mounted after the row is near the viewport. */
function GenreRowLoaded({
  genre,
  mediaType,
  focusKey,
  usedKeys,
}: {
  genre: CategoryItem;
  mediaType: "movie" | "tv";
  focusKey: string;
  usedKeys: Set<string>;
}) {
  const { t, locale } = useI18n();
  const isSpatial = useInputMode();
  const lang = toApiLanguage(locale);
  const { items, status } = useGenreRow(genre, mediaType, lang, usedKeys);

  const href = `/categories/${genre.id}`;
  const seeAllCard =
    isSpatial && status === "ready" && items.length > 0 ? (
      <SeeAllCard href={href} focusKey={`${focusKey}-see-all`} />
    ) : null;

  return (
    <ShelfSection title={genre.name} loading={status === "loading"} href={href} focusKey={focusKey}>
      {status === "error" ? (
        <p className="shelf-section__error">{t.home.error}</p>
      ) : status === "loading" ? (
        <MediaRowSkeletons />
      ) : (
        <>
          {items.map((item, i) => (
            <MediaCard
              key={item.tmdbId}
              item={item}
              mediaType={mediaType}
              focusKey={`${focusKey}-card-${i}`}
            />
          ))}
          {seeAllCard}
        </>
      )}
    </ShelfSection>
  );
}

/** Lazily mounts the real row; until then keeps a poster-skeleton shelf in layout. */
function GenreRow(props: {
  genre: CategoryItem;
  mediaType: "movie" | "tv";
  focusKey: string;
  usedKeys: Set<string>;
}) {
  const [ref, revealed] = useLazyVisible();

  if (!revealed) {
    return (
      <div ref={ref}>
        <ShelfSection title="" loading focusKey={props.focusKey} navigable={false}>
          <MediaRowSkeletons />
        </ShelfSection>
      </div>
    );
  }

  return <GenreRowLoaded {...props} />;
}

export default function CategoriesPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const lang = toApiLanguage(locale);

  const { data: sections, error: sectionsError, loading: sectionsLoading } = useAsyncResource<CategorySection[]>(
    () => api.categories.list(lang),
    [lang],
  );
  const { data: genreLists } = useAsyncResource<GenresResponse>(
    () => api.genres.list(lang),
    [lang],
  );

  const genres = useMemo(
    () => sections?.find((s) => s.section === GENRES_SECTION)?.items ?? [],
    [sections],
  );
  const movieGenreIds = useMemo(
    () => new Set(genreLists?.movie.map((g) => g.id) ?? []),
    [genreLists],
  );

  // Genres fall back to movies (the collection endpoint tries movie discover
  // first, then TV), so a genre's native type is "movie" unless it is TV-only.
  const mediaTypeFor = (genre: CategoryItem): "movie" | "tv" => {
    const id = parseInt(genre.id.replace(/\D+/g, ""), 10);
    return movieGenreIds.has(id) ? "movie" : "tv";
  };

  // Media keys already shown in an earlier genre row, so later rows pull
  // deeper pages instead of repeating the same top titles. Stable set
  // instance shared across rows via props.
  const [usedKeys] = useState(() => new Set<string>());

  useInitialFocus(["cat-genres-card-0"]);

  return (
    <>
      <PageTitle>{t.meta.categories}</PageTitle>
      <h1 className="visually-hidden">{t.meta.categories}</h1>

      <div className="flex flex-col gap-10">
        <ShelfSection title={t.home.genres} loading={sectionsLoading} focusKey="cat-genres">
          {sectionsLoading ? (
            GENRE_SKELETONS.map((k) => <GenreCard key={k} name="" />)
          ) : sectionsError ? (
            <p className="shelf-section__error">{t.home.error}</p>
          ) : (
            genres.map((g, i) => (
              <GenreCard
                key={g.id}
                name={g.name}
                backdrop={g.backdrop}
                focusKey={`cat-genres-card-${i}`}
                onActivate={() => router.push(`/categories/${g.id}`)}
              />
            ))
          )}
        </ShelfSection>

        {/* While the genre list loads, reserve space with poster-row skeletons
            so the page doesn't look like "only backdrops" then jump. */}
        {sectionsLoading &&
          Array.from({ length: ROW_PLACEHOLDERS }, (_, i) => (
            <ShelfSection key={`cat-row-skel-${i}`} title="" loading focusKey={`cat-row-skel-${i}`} navigable={false}>
              <MediaRowSkeletons />
            </ShelfSection>
          ))}

        {genres.map((g, i) => (
          <GenreRow key={g.id} genre={g} mediaType={mediaTypeFor(g)} focusKey={`cat-row-${i}`} usedKeys={usedKeys} />
        ))}
      </div>
    </>
  );
}
