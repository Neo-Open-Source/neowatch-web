"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import { useParams, notFound } from "next/navigation";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { useInfiniteResource } from "@/lib/hooks/use-infinite-resource";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { PersonCreditItem, PersonDetails } from "@/lib/api/types";
import { PageTitle } from "@/components/ui/PageTitle";
import { MediaCard } from "@/components/cards/MediaCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const SKELETONS = makeSkeletonKeys(20);

export default function PersonPage({ initialData }: { initialData?: PersonDetails | null }) {
  const params = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const lang = toApiLanguage(locale);

  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  const { data: person, loading: personLoading, error: personError } = useAsyncResource(
    () => api.people.detail(id, { language: lang }),
    [id, lang],
    // Server-fetched data from generateMetadata — skip the duplicate client
    // request while it stays current (refetches only on language switch).
    initialData,
  );

  const { items, loading, error, hasMore, loadMore } = useInfiniteResource<PersonCreditItem>(
    (page) => api.people.credits(id, { language: lang, page }),
    [id, lang],
  );

  const sentinelRef = useRef<HTMLDivElement>(null);
  const focusedOnLoad = useRef(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Stable observer + re-check after every load (see useInfiniteScroll).
  useInfiniteScroll(sentinelRef, loadMore, hasMore, { rootMargin: "200px" });

  // On TV, land focus on the first filmography card so the grid is navigable.
  useEffect(() => {
    if (focusedOnLoad.current || loading || items.length === 0) return;
    focusedOnLoad.current = true;
    setFocus("person-card-0");
  }, [loading, items.length]);

  useEffect(() => {
    focusedOnLoad.current = false;
  }, [id]);

  useEffect(() => {
    startTransition(() => setProfileLoaded(false));
  }, [person?.profile]);

  if (personError) notFound();

  return (
    <>
      <PageTitle>{person?.name ?? ""}</PageTitle>

      <div className="person-page">
        <div className="person-page__hero">
          {personLoading || !person ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-44 w-44 rounded-full" />
              <Skeleton className="h-7 w-56 rounded-lg" />
              <Skeleton className="h-4 w-40 rounded-lg" />
            </div>
          ) : (
            <>
              <div className="person-page__photo">
                {person.profile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.profile}
                    alt={person.name}
                    className={`person-page__photo-img${profileLoaded ? " person-page__photo-img--loaded" : ""}`}
                    onLoad={() => setProfileLoaded(true)}
                    draggable={false}
                  />
                ) : (
                  <div className="person-page__photo-fallback" aria-hidden="true">
                    <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="person-page__info">
                <h1 className="person-page__name">{person.name}</h1>
                {person.department && (
                  <p className="person-page__department">{person.department}</p>
                )}
                <p className="person-page__counts">{t.person.filmography}</p>
              </div>
            </>
          )}
        </div>

        {error ? (
          <p className="person-page__status">{t.search.error}</p>
        ) : loading ? (
          <div className="person-page__grid" data-spatial-grid>
            {SKELETONS.map((k) => <MediaCard key={k} />)}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="person-page__grid" data-spatial-grid>
              {items.map((item, i) => (
                <MediaCard
                  key={`${item.mediaType}-${item.tmdbId}`}
                  item={item}
                  focusKey={`person-card-${i}`}
                />
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
          </>
        ) : (
          <p className="person-page__status">{t.search.noResults}</p>
        )}
      </div>
    </>
  );
}
