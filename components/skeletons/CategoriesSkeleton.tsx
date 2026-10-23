import { PosterCardSkeleton } from "@/components/cards/PosterCardSkeleton";
import { GenreCardSkeleton } from "@/components/skeletons/GenreCardSkeleton";
import { ShelfSkeleton } from "@/components/skeletons/ShelfSkeleton";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const GENRES = makeSkeletonKeys(12);
const POSTERS = makeSkeletonKeys(14);
const ROWS = makeSkeletonKeys(3);

export function CategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <ShelfSkeleton titleWidth={76}>
        {GENRES.map((key) => (
          <GenreCardSkeleton key={key} />
        ))}
      </ShelfSkeleton>

      {ROWS.map((row) => (
        <ShelfSkeleton key={row} titleWidth={row === 0 ? 104 : 88}>
          {POSTERS.map((key) => (
            <PosterCardSkeleton key={key} />
          ))}
        </ShelfSkeleton>
      ))}
    </div>
  );
}
