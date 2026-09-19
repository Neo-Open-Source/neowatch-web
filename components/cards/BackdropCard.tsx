import { memo } from "react";
import { getConfig } from "@/lib/constants/config";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { cx } from "@/lib/utils/cx";

interface BackdropCardItem {
  id?: string;
  name: string;
  backdropUrl: string;
  progressPercent?: number;
}

interface BackdropCardProps {
  item?: BackdropCardItem;
}

export const BackdropCard = memo(function BackdropCard({ item }: BackdropCardProps) {
  if (!item) {
    return (
      <div className="backdrop-card backdrop-card--skeleton">
        <Skeleton className="backdrop-card__img-skeleton" />
        <Skeleton className="backdrop-card__label-skeleton" />
      </div>
    );
  }

  const { showHitboxes } = getConfig();

  return (
    <div className={cx("backdrop-card", showHitboxes && "backdrop-card--hitbox")}>
      <SmartImage
        src={item.backdropUrl}
        alt={item.name}
        className="backdrop-card__img"
        loadedClassName="backdrop-card__img--loaded"
        errorAsLoaded
        draggable={false}
        decoding="async"
      />

      {item.progressPercent !== undefined && (
        <div className="backdrop-card__progress-track" aria-hidden="true">
          <div className="backdrop-card__progress-fill" style={{ width: `${item.progressPercent}%` }} />
        </div>
      )}

      <div className="backdrop-card__label">{item.name}</div>
    </div>
  );
});
