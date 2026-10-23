import { Skeleton } from "@/components/ui/Skeleton";

export function GenreCardSkeleton() {
  return (
    <div className="genre-card genre-card--skeleton" aria-hidden="true">
      <Skeleton className="genre-card__backdrop-skeleton" rounded="lg" />
    </div>
  );
}
