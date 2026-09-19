"use client";

import { Suspense, memo, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useInfiniteResource } from "@/lib/hooks/use-infinite-resource";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { SearchItem, Genre, PersonItem } from "@/lib/api/types";
import { PageTitle } from "@/components/ui/PageTitle";
import { MediaCard } from "@/components/cards/MediaCard";
import { ChipGroup, Chip, FocusableSelect } from "@/components/ui/ChipGroup";
import { UpTargetsProvider } from "@/lib/context/up-navigation";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const SKELETONS = makeSkeletonKeys(20);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, i) => CURRENT_YEAR - i);

const PersonResultCard = memo(function PersonResultCard({ person, focusKey }: { person: PersonItem; focusKey: string }) {
  const router = useRouter();
  const { ref, focused } = useCardNavigation({
    focusKey,
    onEnterPress: () => router.push(`/person/${person.tmdbId}`),
  });

  return (
    <div
      ref={ref}
      data-spatial-card
      role="button"
      tabIndex={0}
      className={["search-page__person", focused ? "search-page__person--focused" : ""].join(" ")}
      onClick={() => router.push(`/person/${person.tmdbId}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/person/${person.tmdbId}`); } }}
      style={{ cursor: "pointer" }}
    >
      {person.profile ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.profile} alt="" className="search-page__person-photo" draggable={false} loading="lazy" decoding="async" />
      ) : (
        <div className="search-page__person-photo search-page__person-photo--missing" />
      )}
      <span className="search-page__person-name">{person.name}</span>
      {person.department && <span className="search-page__person-dept">{person.department}</span>}
    </div>
  );
});

function SearchPageInner() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const debouncedQ = useDebouncedValue(q, 300);

  const [type, setType] = useState<"movie" | "tv" | "multi">("multi");
  const [genreId, setGenreId] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const genres = useAsyncResource(
    () => api.genres.list(toApiLanguage(locale)),
    [locale],
  );

  const { items, loading, error, hasMore, loadMore } = useInfiniteResource(
    (page) => {
      const opts: Parameters<typeof api.media.search>[0] = {
        type,
        language: toApiLanguage(locale),
        page,
      };
      if (debouncedQ.trim()) opts.q = debouncedQ.trim();
      if (genreId) opts.genre = genreId;
      if (yearFrom) opts.yearFrom = Number(yearFrom);
      if (yearTo) opts.yearTo = Number(yearTo);
      return api.media.search(opts);
    },
    [debouncedQ, type, genreId, yearFrom, yearTo, locale],
  );

  const sentinelRef = useRef<HTMLDivElement>(null);
  const focusedOnLoad = useRef(false);

  const genreOptions = useMemo(() => {
    if (!genres.data) return [];
    const map = new Map<string, Genre>();
    for (const g of [...genres.data.movie, ...genres.data.tv]) {
      map.set(String(g.id), g);
    }
    return Array.from(map.values());
  }, [genres.data]);

  const { mediaItems, people } = useMemo(() => {
    const seen = new Set<string>();
    const media = items.filter(
      (item): item is Extract<SearchItem, { mediaType: "movie" | "tv" }> => {
        if (item.mediaType !== "movie" && item.mediaType !== "tv") return false;
        const key = `${item.mediaType}-${item.tmdbId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      },
    );
    const persons = items.filter(
      (item): item is Extract<SearchItem, { mediaType: "person" }> =>
        item.mediaType === "person",
    );
    return { mediaItems: media, people: persons };
  }, [items]);

  // Stable observer + re-check after every load (see useInfiniteScroll).
  useInfiniteScroll(sentinelRef, loadMore, hasMore, { rootMargin: "200px" });

  useEffect(() => {
    if (focusedOnLoad.current || loading || mediaItems.length === 0) return;
    focusedOnLoad.current = true;
    setFocus("search-card-0");
  }, [loading, mediaItems.length]);

  useEffect(() => {
    focusedOnLoad.current = false;
  }, [debouncedQ, type, genreId, yearFrom, yearTo]);

  const hasActiveFilters = genreId || yearFrom || yearTo;

  return (
    <UpTargetsProvider targets={["SEARCH_FILTERS"]}>
      <PageTitle>{q.trim() ? `${t.search.resultsFor} ${q.trim()}` : t.meta.search}</PageTitle>

      <div className="search-page__header">
        <h1 className="search-page__title">
          {q.trim() ? (
            <>{t.search.resultsFor} <span className="search-page__query-text">{q.trim()}</span></>
          ) : t.meta.search}
        </h1>

        <ChipGroup focusKey="SEARCH_FILTERS" onDown={() => setFocus("search-card-0")}>
          <Chip focusKey="FILTER_ALL" active={type === "multi"} onClick={() => setType("multi")}>{t.search.filters.typeAll}</Chip>
          <Chip focusKey="FILTER_MOVIE" active={type === "movie"} onClick={() => setType("movie")}>{t.search.filters.typeMovie}</Chip>
          <Chip focusKey="FILTER_TV" active={type === "tv"} onClick={() => setType("tv")}>{t.search.filters.typeTV}</Chip>

          <div className="chip-group__divider" />

          {genreOptions.length > 0 && (
            <FocusableSelect focusKey="FILTER_GENRE" value={genreId} onChange={setGenreId}>
              <option value="">{t.search.filters.genreAll}</option>
              {genreOptions.map((g) => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
            </FocusableSelect>
          )}

          <div className="chip-group__year-range">
            <FocusableSelect focusKey="FILTER_YEAR_FROM" value={yearFrom} onChange={setYearFrom}>
              <option value="">{t.search.filters.yearFrom}</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </FocusableSelect>
            <span className="chip-group__year-sep">—</span>
            <FocusableSelect focusKey="FILTER_YEAR_TO" value={yearTo} onChange={setYearTo}>
              <option value="">{t.search.filters.yearTo}</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </FocusableSelect>
          </div>

          {hasActiveFilters && (
            <Chip focusKey="FILTER_RESET" onClick={() => { setGenreId(""); setYearFrom(""); setYearTo(""); }}>✕</Chip>
          )}
        </ChipGroup>
      </div>

      {!loading && people.length > 0 && (
        <section className="search-page__people">
          {people.map((person, i) => (
            <PersonResultCard key={person.tmdbId} person={person} focusKey={`person-card-${i}`} />
          ))}
        </section>
      )}

      {error ? (
        <p className="search-page__status">{t.search.error}</p>
      ) : loading ? (
        <div className="media-grid" data-spatial-grid>
          {SKELETONS.map((k) => <MediaCard key={k} />)}
        </div>
      ) : mediaItems.length > 0 ? (
        <>
          <div className="media-grid" data-spatial-grid>
            {mediaItems.map((item, i) => (
              <MediaCard key={`${item.mediaType}-${item.tmdbId}`} item={item} focusKey={`search-card-${i}`} />
            ))}
          </div>
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
        </>
      ) : (
        <p className="search-page__status">{t.search.noResults}</p>
      )}
    </UpTargetsProvider>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
