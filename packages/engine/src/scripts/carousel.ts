import { bindEach } from "../lib/client/bind";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

bindEach<HTMLElement>("[data-carousel]", (viewport) => {
  const track = viewport.querySelector<HTMLElement>("[data-carousel-track]");
  const prev = viewport.querySelector<HTMLButtonElement>("[data-carousel-prev]");
  const next = viewport.querySelector<HTMLButtonElement>("[data-carousel-next]");
  if (!track || !prev || !next) return undefined;

  const update = (): void => {
    const max = track.scrollWidth - track.clientWidth;
    prev.hidden = max <= 4 || track.scrollLeft <= 4;
    next.hidden = max <= 4 || track.scrollLeft >= max - 4;
  };

  const scrollByPage = (direction: 1 | -1): void => {
    const card = track.querySelector<HTMLElement>(":scope > li");
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : 0;
    const pages = step > 0 ? Math.max(1, Math.floor(track.clientWidth / step)) : 0;
    track.scrollBy({
      left: step > 0 ? direction * pages * step : direction * Math.round(track.clientWidth * 0.85),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  };

  let ticking = false;
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };

  prev.addEventListener("click", () => scrollByPage(-1));
  next.addEventListener("click", () => scrollByPage(1));
  track.addEventListener("scroll", onScroll, { passive: true });

  const observer = new ResizeObserver(update);
  observer.observe(track);
  update();

  return () => observer.disconnect();
});
