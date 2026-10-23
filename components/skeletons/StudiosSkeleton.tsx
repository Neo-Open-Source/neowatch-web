import { StudioCardSkeleton } from "@/components/skeletons/StudioCardSkeleton";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const STUDIOS = makeSkeletonKeys(20);

export function StudiosSkeleton() {
  return (
    <div className="studios-page">
      <div className="studios-page__header" aria-hidden="true">
        <div className="skeleton studios-page__title-skeleton" />
      </div>
      <div className="studios-grid" aria-hidden="true">
        {STUDIOS.map((key) => (
          <StudioCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}
