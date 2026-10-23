"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { GenreCardSkeleton } from "@/components/skeletons/GenreCardSkeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { onCardKeyDown } from "@/lib/utils/keyboard";
import { cx } from "@/lib/utils/cx";
import { getConfig } from "@/lib/constants/config";

interface GenreCardProps {
  name: string;
  backdrop?: string | null;
  focusKey?: string;
  onActivate?: () => void;
}

function GenreCardReal({
  name,
  backdrop,
  focusKey,
  onActivate,
}: {
  name: string;
  backdrop?: string | null;
  focusKey?: string;
  onActivate?: () => void;
}) {
  const { ref, focused } = useCardNavigation({ focusKey, onEnterPress: onActivate });
  const { showHitboxes } = getConfig();
  const src = backdrop || null;

  return (
    <div
      ref={ref}
      data-spatial-card
      role={onActivate ? "button" : undefined}
      tabIndex={onActivate ? 0 : undefined}
      onClick={onActivate ? () => onActivate() : undefined}
      onKeyDown={onActivate ? (e) => onCardKeyDown(e, onActivate) : undefined}
      className={cx("genre-card", focused && "genre-card--focused", showHitboxes && "genre-card--hitbox")}
    >
      <SmartImage
        src={src}
        alt=""
        className="genre-card__backdrop"
        loadedClassName="genre-card__backdrop--loaded"
        skeleton={<Skeleton className="genre-card__backdrop-skeleton" />}
        errorAsLoaded
        draggable={false}
        decoding="async"
      />
      <span className="genre-card__label">{name}</span>
      {focused && <div className="genre-card__focus-indicator" aria-hidden="true" />}
    </div>
  );
}

export const GenreCard = memo(function GenreCard({
  name,
  backdrop,
  focusKey,
  onActivate,
}: GenreCardProps) {
  if (!name) return <GenreCardSkeleton />;
  return <GenreCardReal name={name} backdrop={backdrop} focusKey={focusKey} onActivate={onActivate} />;
});
