function PosterCard() {
  return (
    <div className="nw-loading-card" aria-hidden="true">
      <div className="nw-loading-card__poster" />
      <div className="nw-loading-card__line nw-loading-card__line--title" />
      <div className="nw-loading-card__line nw-loading-card__line--sub" />
    </div>
  );
}

export default function DetailLoading() {
  return (
    <div className="nw-loading">
      <div className="nw-loading-hero" aria-hidden="true" />
      {[0, 1, 2].map((shelf) => (
        <div key={shelf} className="nw-loading-shelf" aria-hidden="true">
          <div className="nw-loading-shelf__title" />
          <div className="nw-loading-shelf__row">
            {Array.from({ length: 10 }, (_, i) => (
              <PosterCard key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
