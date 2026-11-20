import { bindEach } from "../lib/client/bind";
import { scrollBehavior } from "../lib/client/scroll";

bindEach<HTMLElement>("[data-watch-view]", (root, signal) => {
  const status = root.querySelector<HTMLElement>("[data-watch-status]");
  const player = root.querySelector<HTMLElement>("[data-watch-player]");
  const align = root.querySelector<HTMLButtonElement>("[data-watch-align]");

  root.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-watch-play]") && status) {
        status.hidden = !status.hidden;
      }
    },
    { signal },
  );

  align?.addEventListener(
    "click",
    () => {
      if (!player) return;
      window.scrollTo({ top: player.getBoundingClientRect().top + window.scrollY, behavior: scrollBehavior() });
    },
    { signal },
  );
});
