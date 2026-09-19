"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import type { MediaItem } from "@/lib/api/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { PosterCardSkeleton } from "@/components/cards/PosterCardSkeleton";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { SmartImage } from "@/components/ui/SmartImage";
import { getConfig } from "@/lib/constants/config";
import { releaseYear } from "@/lib/utils/media-format";
import { cx } from "@/lib/utils/cx";
import { onCardKeyDown } from "@/lib/utils/keyboard";

interface MediaCardProps {
  item?: MediaItem & { mediaType?: string };
  focusKey?: string;
  mediaType?: "movie" | "tv";
}

function MediaCardSkeleton() {
  return <PosterCardSkeleton />;
}

function MediaCardReal({ item, focusKey, mediaType }: {
  item: MediaItem & { mediaType?: string };
  focusKey?: string;
  mediaType?: "movie" | "tv";
}) {
  const router = useRouter();
  const resolvedType = (item.mediaType as "movie" | "tv" | undefined) ?? mediaType;
  const href = resolvedType ? `/${resolvedType}/${item.tmdbId}` : undefined;

  const { ref, focused } = useCardNavigation({
    focusKey,
    onEnterPress: href ? () => router.push(href) : undefined,
  });
  const { showHitboxes } = getConfig();

  const year = releaseYear(item.releaseDate);
  const activate = href ? () => router.push(href) : undefined;

  return (
    <div
      ref={ref}
      data-spatial-card
      className={cx("media-card", focused && "media-card--focused", showHitboxes && "media-card--hitbox")}
      onClick={activate}
      onKeyDown={activate ? (e) => onCardKeyDown(e, activate) : undefined}
      role={activate ? "button" : undefined}
      tabIndex={activate ? 0 : undefined}
      style={href ? { cursor: "pointer" } : undefined}
    >
      <div className="media-card__poster-wrap">
        <SmartImage
          src={item.poster}
          alt={item.title}
          className="media-card__poster"
          loadedClassName="media-card__poster--loaded"
          skeleton={<Skeleton className="media-card__poster-skeleton" />}
          fallback={<div className="media-card__poster media-card__poster--missing" />}
          draggable={false}
          decoding="async"
        />
        {focused && <div className="media-card__focus-indicator" aria-hidden="true" />}
      </div>
      <div className="media-card__meta">
        <p className="media-card__title">{item.title}</p>
        {year && <span className="media-card__year">{year}</span>}
      </div>
    </div>
  );
}

export const MediaCard = memo(function MediaCard({ item, focusKey, mediaType }: MediaCardProps) {
  if (!item) return <MediaCardSkeleton />;
  return <MediaCardReal item={item} focusKey={focusKey} mediaType={mediaType} />;
});