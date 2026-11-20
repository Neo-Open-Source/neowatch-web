import { bindEach } from "../lib/client/bind";
import { scrollBehavior } from "../lib/client/scroll";

const SHOW_AFTER = 600;

bindEach<HTMLButtonElement>("[data-to-top]", (button, signal) => {
  const sync = (): void => {
    const open = window.scrollY > SHOW_AFTER;
    button.dataset.open = String(open);
    button.inert = !open;
  };

  sync();
  window.addEventListener("scroll", sync, { signal, passive: true });
  button.addEventListener(
    "click",
    () => {
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
    },
    { signal },
  );
});
