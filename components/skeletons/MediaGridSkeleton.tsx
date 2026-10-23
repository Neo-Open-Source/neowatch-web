import { PosterCardSkeleton } from "@/components/cards/PosterCardSkeleton";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

interface MediaGridSkeletonProps {
  count?: number;
}

export function MediaGridSkeleton({ count = 12 }: MediaGridSkeletonProps) {
  return (
    <div className="media-grid" aria-hidden="true">
      {makeSkeletonKeys(count).map((key) => (
        <PosterCardSkeleton key={key} />
      ))}
    </div>
  );
}
