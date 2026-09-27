function PosterCard() {
  return (
    <div className="nw-loading-card" aria-hidden="true">
      <div className="nw-loading-card__poster" />
      <div className="nw-loading-card__line nw-loading-card__line--title" />
      <div className="nw-loading-card__line nw-loading-card__line--sub" />
    </div>
  );
}

function Shelf({ cards = 10 }: { cards?: number }) {
  return (
    <div className="nw-loading-shelf" aria-hidden="true">
      <div className="nw-loading-shelf__title" />
      <div className="nw-loading-shelf__row">
        {Array.from({ length: cards }, (_, i) => (
          <PosterCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default function MainLoading() {
  return (
    <div className="nw-loading">
      <Shelf cards={6} />
      <Shelf cards={10} />
      <Shelf cards={10} />
      <Shelf cards={10} />
    </div>
  );
}
