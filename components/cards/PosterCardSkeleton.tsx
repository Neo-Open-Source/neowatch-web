import { Skeleton } from "@/components/ui/Skeleton";

export function PosterCardSkeleton() {
  return (
    <div className="media-card media-card--skeleton" aria-hidden="true">
      <div className="media-card__poster-wrap">
        <Skeleton className="media-card__poster-skeleton" />
      </div>
      <div className="media-card__meta">
        <Skeleton className="media-card__title-skeleton" />
        <Skeleton className="media-card__subtitle-skeleton" />
      </div>
    </div>
  );
}
