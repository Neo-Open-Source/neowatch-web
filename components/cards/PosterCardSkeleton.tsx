import { Skeleton } from "@/components/ui/Skeleton";

/** Loading placeholder for 2:3 poster cards (MediaCard / SeasonCard). */
export function PosterCardSkeleton() {
  return (
    <div className="media-card media-card--skeleton">
      <Skeleton className="media-card__poster-skeleton" />
      <Skeleton className="media-card__title-skeleton" />
      <Skeleton className="media-card__subtitle-skeleton" />
    </div>
  );
}
