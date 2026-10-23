import type { CSSProperties, ReactNode } from "react";

interface ShelfSkeletonProps {
  children: ReactNode;
  titleWidth?: number;
}

export function ShelfSkeleton({ children, titleWidth = 140 }: ShelfSkeletonProps) {
  const titleStyle: CSSProperties = { width: titleWidth };

  return (
    <section className="shelf-section" data-shelf aria-hidden="true">
      <div className="shelf-section__header">
        <div className="skeleton shelf-section__title-skeleton" style={titleStyle} />
      </div>
      <div className="scroll-row">
        <div className="scroll-row__viewport">
          <div className="scroll-row__track">{children}</div>
        </div>
      </div>
    </section>
  );
}
