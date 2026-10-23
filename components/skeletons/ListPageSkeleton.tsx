import { MediaGridSkeleton } from "@/components/skeletons/MediaGridSkeleton";

interface ListPageSkeletonProps {
  titleWidth?: number;
  chips?: boolean;
}

export function ListPageSkeleton({ titleWidth = 140, chips = false }: ListPageSkeletonProps) {
  return (
    <>
      <div className="list-page__header" aria-hidden="true">
        <div className="skeleton list-page__title-skeleton" style={{ width: titleWidth }} />
        {chips && (
          <div className="chip-group">
            <div className="skeleton nw-chip-skeleton" />
            <div className="skeleton nw-chip-skeleton" />
          </div>
        )}
      </div>
      <MediaGridSkeleton />
    </>
  );
}
