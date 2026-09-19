"use client";

import { useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { doesFocusableExist, setFocus, useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/context/i18n-context";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { useInitialFocus } from "@/lib/hooks/use-initial-focus";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { EnrichedSyncProgressItem, SeasonDetails, TVDetails } from "@/lib/api/types";
import { useAuth } from "@/lib/context/auth-context";
import { NAVBAR_SEARCH_FOCUS_KEY } from "@/components/Header";
import { scrollRootTo } from "@/lib/state/scroll-root";
import { UpTargetsProvider } from "@/lib/context/up-navigation";
import { EpisodeCard } from "@/components/cards/EpisodeCard";
import { PageTitle } from "@/components/ui/PageTitle";
import { Skeleton } from "@/components/ui/Skeleton";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const SEASON_HEADER_FOCUS_KEY = "SEASON_HEADER";
const FIRST_EPISODE_FOCUS_KEY = "season-episode-0";
const EPISODE_SKELETONS = makeSkeletonKeys(8);

export default function SeasonPage({
  initialSeason,
  initialTv,
}: {
  initialSeason?: SeasonDetails | null;
  initialTv?: TVDetails | null;
}) {
  const params = useParams<{ type: string; id: string; seasonNumber: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();
  const lang = toApiLanguage(locale);

  const type = params.type as "movie" | "tv";
  if (type !== "tv") notFound();
  const tvId = parseInt(params.id, 10);
  const seasonNumber = parseInt(params.seasonNumber, 10);
  if (isNaN(tvId) || isNaN(seasonNumber)) notFound();

  useInitialFocus([SEASON_HEADER_FOCUS_KEY]);

  const { data: season, loading, error } = useAsyncResource<SeasonDetails>(
    () => api.media.season(tvId, seasonNumber, { language: lang }),
    [tvId, seasonNumber, lang],
    // Server-fetched data from generateMetadata — skip duplicate client calls.
    initialSeason,
  );

  const { data: tv } = useAsyncResource<TVDetails>(
    () => api.media.tvDetail(tvId, { language: lang }),
    [tvId, lang],
    initialTv,
  );

  const { isAuthenticated } = useAuth();
  const { data: progressItems } = useAsyncResource<EnrichedSyncProgressItem[]>(
    () =>
      isAuthenticated
        ? api.user.getSyncProgress({ language: lang })
        : Promise.resolve([]),
    [lang, isAuthenticated],
  );

  // Build a lookup map: `season:episode` → progress item
  const progressMap = new Map<string, EnrichedSyncProgressItem>();
  if (progressItems) {
    for (const p of progressItems) {
      if (p.mediaId === tvId && p.season === seasonNumber) {
        progressMap.set(`${p.season}:${p.episode}`, p);
      }
    }
  }

  const [poster, setPoster] = useState<"loading" | "loaded" | "error">("loading");

  const exitSeason = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/tv/${tvId}`);
    }
  };

  const { ref: headerRef, focused: headerFocused } = useFocusable({
    focusKey: SEASON_HEADER_FOCUS_KEY,
    onEnterPress: exitSeason,
    onArrowPress: (dir) => {
      if (dir === "up") {
        setFocus(NAVBAR_SEARCH_FOCUS_KEY);
        scrollRootTo(0, "smooth");
        return false;
      }
      if (dir === "down" && doesFocusableExist(FIRST_EPISODE_FOCUS_KEY)) {
        setFocus(FIRST_EPISODE_FOCUS_KEY);
        return false;
      }
      return false;
    },
  });
  if (error) notFound();

  const seasonName = season?.name || `${t.detail.season} ${seasonNumber}`;
  const episodeCount = season?.episodeCount ?? season?.episodes?.length ?? 0;
  const posterUrl = season?.poster ?? tv?.poster ?? null;

  return (
    <UpTargetsProvider targets={[SEASON_HEADER_FOCUS_KEY]}>
      <PageTitle>{tv?.title ? `${tv.title} · ${seasonName}` : seasonName}</PageTitle>

      <div className="season-page">
        <div className="season-layout">
          <div className="season-poster-wrap">
            {posterUrl ? (
              poster === "error" ? (
                <div className="season-poster season-poster--missing" />
              ) : (
                <>
                  {poster === "loading" && <Skeleton className="season-poster-skeleton" />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterUrl}
                    alt={seasonName}
                    className={`season-poster${poster === "loaded" ? " season-poster--loaded" : ""}`}
                    onLoad={() => setPoster("loaded")}
                    onError={() => setPoster("error")}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                </>
              )
            ) : (
              <div className="season-poster season-poster--missing" />
            )}
          </div>

          <div className="season-main">
            <div className="season-header">
              <div className="season-header__top">
                <button
                  type="button"
                  ref={headerRef as React.RefObject<HTMLButtonElement>}
                  className={`season-header__back${headerFocused ? " season-header__back--focused" : ""}`}
                  onClick={exitSeason}
                  aria-label={t.a11y.back}
                >
                  <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
                </button>
                <h1 className="season-header__title">{seasonName}</h1>
              </div>

              <div className="season-header__sub">
                {(tv?.title || episodeCount > 0) && (
                  <p className="season-header__meta">
                    {[tv?.title, episodeCount > 0 ? `${episodeCount} ${t.detail.episodeLabel(episodeCount)}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>

              {season?.overview && <p className="season-header__overview">{season.overview}</p>}
            </div>

            <div className="episode-list" data-spatial-grid>
              {loading
                ? EPISODE_SKELETONS.map((k) => <EpisodeCard key={k} />)
                : (season?.episodes ?? []).map((ep, i) => {
                    const p = progressMap.get(`${ep.seasonNumber}:${ep.episodeNumber}`);
                    return (
                      <EpisodeCard
                        key={ep.id}
                        episode={ep}
                        focusKey={`season-episode-${i}`}
                        progress={p?.progress}
                        watched={p != null && p.progress >= 95}
                        tvId={tvId}
                        imdbId={tv?.imdbId ?? null}
                        kpId={tv?.kpId ?? null}
                      />
                    );
                  })}
            </div>
          </div>
        </div>
      </div>
    </UpTargetsProvider>
  );
}
