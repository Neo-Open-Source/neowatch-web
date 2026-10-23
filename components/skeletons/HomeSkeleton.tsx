import { PosterCardSkeleton } from "@/components/cards/PosterCardSkeleton";
import { StudioCardSkeleton } from "@/components/skeletons/StudioCardSkeleton";
import { ShelfSkeleton } from "@/components/skeletons/ShelfSkeleton";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const STUDIOS = makeSkeletonKeys(20);
const POSTERS = makeSkeletonKeys(14);

export function HomeSkeleton() {
  return (
    <>
      <ShelfSkeleton titleWidth={170}>
        {STUDIOS.map((key) => (
          <StudioCardSkeleton key={key} />
        ))}
      </ShelfSkeleton>

      <ShelfSkeleton titleWidth={92}>
        {POSTERS.map((key) => (
          <PosterCardSkeleton key={key} />
        ))}
      </ShelfSkeleton>

      <ShelfSkeleton titleWidth={112}>
        {POSTERS.map((key) => (
          <PosterCardSkeleton key={`movie-${key}`} />
        ))}
      </ShelfSkeleton>

      <ShelfSkeleton titleWidth={104}>
        {POSTERS.map((key) => (
          <PosterCardSkeleton key={`tv-${key}`} />
        ))}
      </ShelfSkeleton>
    </>
  );
}
