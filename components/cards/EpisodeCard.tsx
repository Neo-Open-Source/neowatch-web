"use client";

import { memo, useState } from "react";
import { useI18n } from "@/lib/context/i18n-context";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { TmdbBadge } from "@/components/ui/RatingBadges";
import { formatAirDate, formatRuntime, imageAtSize } from "@/lib/utils/media-format";
import type { Episode } from "@/lib/api/types";

const STILL_SIZE = "w1280";

interface EpisodeCardProps {
  episode?: Episode;
  focusKey?: string;
  // Viewing-status UI state (drive by the future continue-watching/watched feature).
  progress?: number; // 0..100, fraction already watched.
  watched?: boolean; // whether the episode is marked as viewed.
  /** TV show TMDB ID — enables the play button to navigate to the watch page. */
  tvId?: number;
  /** External IDs for the CDN player. */
  imdbId?: string | null;
  kpId?: number | null;
}

interface WatchUiState {
  watched: boolean;
  progress: number;
}

function EpisodeCardSkeleton() {
  return (
    <div className="episode-card episode-card--skeleton">
      <div className="episode-card__still-wrap">
        <Skeleton className="episode-card__still-skeleton" />
      </div>
      <div className="episode-card__content">
        <Skeleton className="episode-card__title-skeleton" rounded="sm" style={{ width: 168, height: 14 }} />
        <Skeleton className="episode-card__meta-skeleton" rounded="sm" style={{ width: 104, height: 11 }} />
        <Skeleton className="episode-card__overview-skeleton" rounded="sm" style={{ width: 192, height: 10 }} />
      </div>
    </div>
  );
}

function EpisodeCardReal({
  episode,
  focusKey,
  progress,
  watched,
  tvId,
  imdbId,
  kpId,
}: {
  episode: Episode;
  focusKey?: string;
  progress?: number;
  watched?: boolean;
  tvId?: number;
  imdbId?: string | null;
  kpId?: number | null;
}) {
  const { locale } = useI18n();

  const navigateToWatch = () => {
    if (!tvId) return;
    const params = new URLSearchParams();
    params.set("season", String(episode.seasonNumber));
    params.set("episode", String(episode.episodeNumber));
    if (imdbId) params.set("imdbId", imdbId);
    else if (kpId) params.set("kpId", String(kpId));
    window.location.href = `/tv/${tvId}/watch?${params.toString()}`;
  };

  const { ref, focused } = useCardNavigation({
    focusKey,
    onEnterPress: tvId ? () => navigateToWatch() : undefined,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ui, _setUi] = useState<WatchUiState>({ watched: !!watched, progress: progress ?? 0 });

  const isWatched = ui.watched;
  const isInProgress = !isWatched && ui.progress > 0 && ui.progress < 100;
  const progressFill = Math.min(100, Math.max(0, ui.progress));

  const meta = [formatAirDate(episode.airDate, locale), formatRuntime(episode.runtime)]
    .filter(Boolean)
    .join(" · ");

  const still = imageAtSize(episode.still, STILL_SIZE);

  return (
    <div
      ref={ref}
      data-spatial-card
      className={`episode-card${focused ? " episode-card--focused" : ""}`}
    >
      <div className="episode-card__still-wrap">
        {still ? (
          <SmartImage
            src={still}
            alt=""
            className="episode-card__still"
            loadedClassName="episode-card__still--loaded"
            skeleton={<Skeleton className="episode-card__still-skeleton" />}
            fallback={<div className="episode-card__still episode-card__still--missing" />}
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="episode-card__still episode-card__still--missing" />
        )}

        <span className="episode-card__number">E{episode.episodeNumber}</span>

        {episode.voteAverage > 0 && (
          <span className="episode-card__rating">
            <TmdbBadge score={episode.voteAverage} size="sm" />
          </span>
        )}

        {focused && <div className="episode-card__focus-indicator" aria-hidden="true" />}

        {!isWatched && (
          <button
            type="button"
            className="episode-card__play"
            aria-label={`Play E${episode.episodeNumber}`}
            onClick={(e) => { e.stopPropagation(); navigateToWatch(); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}

        {(isInProgress || isWatched) && (
          <div className="episode-card__progress-track" aria-hidden="true">
            <div
              className={`episode-card__progress-fill${
                isWatched ? " episode-card__progress-fill--full" : ""
              }`}
              style={{ width: `${progressFill}%` }}
            />
          </div>
        )}
      </div>

      <div className="episode-card__content">
        <h3 className="episode-card__title">
          <span className="episode-card__index">{episode.episodeNumber}. </span>
          {episode.name}
        </h3>
        <div className="episode-card__meta-row">
          {meta && <p className="episode-card__meta">{meta}</p>}
          {episode.voteAverage > 0 && (
            <span className="episode-card__rating-inline">
              <TmdbBadge score={episode.voteAverage} size="sm" />
            </span>
          )}
        </div>
        {episode.overview && <p className="episode-card__overview">{episode.overview}</p>}
      </div>
    </div>
  );
}

export const EpisodeCard = memo(function EpisodeCard({
  episode,
  focusKey,
  progress,
  watched,
  tvId,
  imdbId,
  kpId,
}: EpisodeCardProps) {
  if (!episode) return <EpisodeCardSkeleton />;
  return (
    <EpisodeCardReal
      episode={episode}
      focusKey={focusKey}
      progress={progress}
      watched={watched}
      tvId={tvId}
      imdbId={imdbId}
      kpId={kpId}
    />
  );
});