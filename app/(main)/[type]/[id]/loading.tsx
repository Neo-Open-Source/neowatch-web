import { CastCard } from "@/components/cards/CastCard";
import { MediaCard } from "@/components/cards/MediaCard";
import { SeasonCard } from "@/components/cards/SeasonCard";
import { ShelfSection } from "@/components/sections/ShelfSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const CAST_SKELETONS = makeSkeletonKeys(10);
const SEASON_SKELETONS = makeSkeletonKeys(6);
const MEDIA_SKELETONS = makeSkeletonKeys(10);

export default function DetailLoading() {
  return (
    <div className="detail-hero-wrap">
      <div className="detail-hero-card" data-detail-hero>
        <div className="detail-hero-content">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14 w-64 rounded-lg" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3.5 w-80" />
            <Skeleton className="h-3.5 w-72" />
          </div>
        </div>
      </div>

      <div className="detail-shelves-layer">
        <ShelfSection title="" loading navigable={false}>
          {SEASON_SKELETONS.map((k) => (
            <SeasonCard key={k} />
          ))}
        </ShelfSection>
        <ShelfSection title="" loading navigable={false}>
          {CAST_SKELETONS.map((k) => (
            <CastCard key={k} />
          ))}
        </ShelfSection>
        <ShelfSection title="" loading navigable={false}>
          {MEDIA_SKELETONS.map((k) => (
            <MediaCard key={k} />
          ))}
        </ShelfSection>
      </div>
    </div>
  );
}
