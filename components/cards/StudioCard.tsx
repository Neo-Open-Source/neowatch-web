"use client";

import { memo } from "react";
import type { Studio } from "@/lib/api/types";
import { StudioCardSkeleton } from "@/components/skeletons/StudioCardSkeleton";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { getConfig } from "@/lib/constants/config";
import { cx } from "@/lib/utils/cx";

interface StudioCardProps {
  item?: Studio;
  focusKey?: string;
  onActivate?: () => void;
}

function StudioCardReal({ item, focusKey, onActivate }: { item: Studio; focusKey?: string; onActivate?: () => void }) {
  const { ref, focused } = useCardNavigation({
    focusKey,
    onEnterPress: onActivate,
  });
  const { showHitboxes } = getConfig();

  return (
    <div
      ref={ref}
      data-spatial-card
      role={onActivate ? "button" : undefined}
      tabIndex={onActivate ? 0 : undefined}
      className={cx("studio-card", focused && "studio-card--focused", showHitboxes && "studio-card--hitbox")}
      onClick={onActivate}
      onKeyDown={onActivate ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); } } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.logoUrl} alt={item.name} className="studio-card__logo" draggable={false} loading="lazy" decoding="async" />
      {focused && <div className="studio-card__focus-indicator" aria-hidden="true" />}
    </div>
  );
}

export const StudioCard = memo(function StudioCard({ item, focusKey, onActivate }: StudioCardProps) {
  if (!item) return <StudioCardSkeleton />;
  return <StudioCardReal item={item} focusKey={focusKey} onActivate={onActivate} />;
});
