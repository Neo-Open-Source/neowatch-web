import { PosterCardSkeleton } from "@/components/cards/PosterCardSkeleton";
import { CastCardSkeleton } from "@/components/skeletons/CastCardSkeleton";
import { DetailHeroSkeleton } from "@/components/skeletons/DetailHeroSkeleton";
import { ShelfSkeleton } from "@/components/skeletons/ShelfSkeleton";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const SEASONS = makeSkeletonKeys(6);
const CAST = makeSkeletonKeys(10);
const SIMILAR = makeSkeletonKeys(10);

export default function DetailLoading() {
  return (
    <>
      <div className="detail-hero-wrap">
        <div className="detail-hero-card" aria-hidden="true">
          <div className="detail-hero-backdrop">
            <div className="skeleton detail-hero-backdrop__skeleton" />
          </div>

          <div className="detail-hero-content">
            <DetailHeroSkeleton />
          </div>
        </div>

        <div className="detail-shelves-layer">
          <ShelfSkeleton titleWidth={96}>
            {SEASONS.map((key) => (
              <PosterCardSkeleton key={key} />
            ))}
          </ShelfSkeleton>

          <ShelfSkeleton titleWidth={72}>
            {CAST.map((key) => (
              <CastCardSkeleton key={key} />
            ))}
          </ShelfSkeleton>

          <ShelfSkeleton titleWidth={84}>
            {SIMILAR.map((key) => (
              <PosterCardSkeleton key={`similar-${key}`} />
            ))}
          </ShelfSkeleton>
        </div>
      </div>
    </>
  );
}
