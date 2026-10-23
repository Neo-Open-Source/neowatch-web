import { Skeleton } from "@/components/ui/Skeleton";

export function BackdropCardSkeleton() {
  return (
    <div className="backdrop-card backdrop-card--skeleton" aria-hidden="true">
      <Skeleton className="backdrop-card__img-skeleton" />
      <Skeleton className="backdrop-card__label-skeleton" />
    </div>
  );
}
