export function DetailHeroSkeleton() {
  return (
    <div className="nw-hero-skeleton" aria-hidden="true">
      <div className="skeleton nw-hero-skeleton__title" />

      <div className="detail-meta nw-hero-skeleton__meta">
        <div className="skeleton nw-hero-skeleton__meta-item nw-hero-skeleton__meta-item--age" />
        <div className="skeleton nw-hero-skeleton__meta-item nw-hero-skeleton__meta-item--year" />
        <div className="skeleton nw-hero-skeleton__meta-item nw-hero-skeleton__meta-item--runtime" />
        <div className="skeleton nw-hero-skeleton__meta-item nw-hero-skeleton__meta-item--genres" />
      </div>

      <div className="detail-ratings">
        <div className="skeleton nw-hero-skeleton__badge" />
        <div className="skeleton nw-hero-skeleton__badge" />
      </div>

      <div className="detail-actions">
        <div className="skeleton nw-hero-skeleton__watch" />
        <div className="nw-hero-skeleton__secondary">
          <div className="skeleton nw-hero-skeleton__action" />
          <div className="skeleton nw-hero-skeleton__action" />
          <div className="skeleton nw-hero-skeleton__action" />
        </div>
      </div>

      <div className="nw-hero-skeleton__overview">
        <div className="skeleton nw-hero-skeleton__overview-line" />
        <div className="skeleton nw-hero-skeleton__overview-line nw-hero-skeleton__overview-line--long" />
        <div className="skeleton nw-hero-skeleton__overview-line nw-hero-skeleton__overview-line--medium" />
        <div className="skeleton nw-hero-skeleton__overview-line nw-hero-skeleton__overview-line--short" />
      </div>
    </div>
  );
}
