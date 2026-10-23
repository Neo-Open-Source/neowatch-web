import { MediaGridSkeleton } from "@/components/skeletons/MediaGridSkeleton";

export function SearchSkeleton() {
  return (
    <>
      <div className="search-page__header" aria-hidden="true">
        <div className="skeleton search-page__title-skeleton" />
        <div className="chip-group">
          <div className="skeleton nw-chip-skeleton" />
          <div className="skeleton nw-chip-skeleton" />
          <div className="skeleton nw-chip-skeleton" />
        </div>
      </div>
      <MediaGridSkeleton />
    </>
  );
}
