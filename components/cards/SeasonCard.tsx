"use client";

import { memo } from "react";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { PosterCardSkeleton } from "@/components/cards/PosterCardSkeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { onCardKeyDown } from "@/lib/utils/keyboard";
import { cx } from "@/lib/utils/cx";
import type { Season } from "@/lib/api/types";

interface SeasonCardProps {
  season?: Season;
  episodesLabel?: string;
  focusKey?: string;
  onActivate?: () => void;
}

function SeasonCardReal({
  season,
  episodesLabel,
  focusKey,
  onActivate,
}: {
  season: Season;
  episodesLabel: string;
  focusKey?: string;
  onActivate?: () => void;
}) {
  const { ref, focused } = useCardNavigation({ focusKey, onEnterPress: onActivate });

  return (
    <div
      ref={ref}
      role={onActivate ? "button" : undefined}
      tabIndex={onActivate ? 0 : undefined}
      className={cx("media-card", focused && "media-card--focused")}
      onClick={onActivate}
      onKeyDown={onActivate ? (e) => onCardKeyDown(e, onActivate) : undefined}
      style={onActivate ? { cursor: "pointer" } : undefined}
    >
      <div className="media-card__poster-wrap">
        <SmartImage
          src={season.poster}
          alt={season.name}
          className="media-card__poster"
          loadedClassName="media-card__poster--loaded"
          fallback={<div className="media-card__poster media-card__poster--missing" />}
          draggable={false}
          decoding="async"
        />
        {focused && <div className="media-card__focus-indicator" aria-hidden="true" />}
      </div>
      <div className="media-card__meta">
        <p className="media-card__title">{season.name}</p>
        <span className="media-card__year">{season.episodeCount} {episodesLabel}</span>
      </div>
    </div>
  );
}

export const SeasonCard = memo(function SeasonCard({
  season,
  episodesLabel = "ep.",
  focusKey,
  onActivate,
}: SeasonCardProps) {
  if (!season) return <PosterCardSkeleton />;
  return (
    <SeasonCardReal
      season={season}
      episodesLabel={episodesLabel}
      focusKey={focusKey}
      onActivate={onActivate}
    />
  );
});
