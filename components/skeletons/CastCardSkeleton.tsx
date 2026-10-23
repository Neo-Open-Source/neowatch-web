import { Skeleton } from "@/components/ui/Skeleton";

export function CastCardSkeleton() {
  return (
    <div className="cast-card cast-card--skeleton" aria-hidden="true">
      <Skeleton className="cast-card__avatar" rounded="full" />
      <Skeleton className="cast-card__name-skeleton" />
      <Skeleton className="cast-card__role-skeleton" />
    </div>
  );
}
