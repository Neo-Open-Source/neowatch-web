import { Skeleton } from "@/components/ui/Skeleton";

export function StudioCardSkeleton() {
  return (
    <div className="studio-card studio-card--skeleton" aria-hidden="true">
      <Skeleton className="studio-card__logo-skeleton" />
    </div>
  );
}
