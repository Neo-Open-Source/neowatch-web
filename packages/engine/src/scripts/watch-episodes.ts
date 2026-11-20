import { bindEach } from "../lib/client/bind";
import { scrollBehavior } from "../lib/client/scroll";

bindEach<HTMLElement>("[data-watch-view]", (root, signal) => {
  const episodeList = root.querySelector<HTMLElement>("[data-watch-episodes]");
  const episodeButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-watch-episode]")];
  const prev = root.querySelector<HTMLButtonElement>("[data-watch-episode-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-watch-episode-next]");
  if (!episodeList) return undefined;

  const updateArrows = (): void => {
    const max = episodeList.scrollWidth - episodeList.clientWidth;
    if (prev) prev.hidden = max <= 4 || episodeList.scrollLeft <= 4;
    if (next) next.hidden = max <= 4 || episodeList.scrollLeft >= max - 4;
  };

  const scrollEpisodes = (direction: 1 | -1): void => {
    const card = episodeList.querySelector<HTMLElement>(":scope > li");
    const gap = Number.parseFloat(getComputedStyle(episodeList).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : 0;
    const pages = step > 0 ? Math.max(1, Math.floor(episodeList.clientWidth / step)) : 0;
    episodeList.scrollBy({
      left: step > 0 ? direction * pages * step : direction * Math.round(episodeList.clientWidth * 0.85),
      behavior: scrollBehavior(),
    });
  };

  const selectEpisode = (episode: HTMLButtonElement): void => {
    for (const button of episodeButtons) {
      button.setAttribute("aria-pressed", String(button === episode));
    }
    episode.scrollIntoView({ block: "nearest", inline: "nearest", behavior: scrollBehavior() });
  };

  updateArrows();
  prev?.addEventListener("click", () => scrollEpisodes(-1), { signal });
  next?.addEventListener("click", () => scrollEpisodes(1), { signal });
  episodeList.addEventListener("scroll", updateArrows, { signal, passive: true });
  window.addEventListener("resize", updateArrows, { signal });

  episodeList.addEventListener(
    "wheel",
    (event) => {
      if (!event.shiftKey || !event.altKey) return;
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (delta === 0) return;
      event.preventDefault();
      episodeList.scrollLeft += delta;
    },
    { signal, passive: false },
  );

  root.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const episode = target.closest<HTMLButtonElement>("[data-watch-episode]");
      if (episode && !episode.disabled) selectEpisode(episode);
    },
    { signal },
  );
});
