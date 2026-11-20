import { bindEach } from "../lib/client/bind";

bindEach<HTMLElement>("[data-search-overlay]", (overlay) => {
  const drawer = overlay.querySelector<HTMLElement>("[data-search-filters]");
  if (!drawer) return undefined;

  const setOpen = (open: boolean): void => {
    drawer.dataset.open = String(open);
    overlay
      .querySelector<HTMLButtonElement>("[data-search-filters-open]")
      ?.setAttribute("aria-expanded", String(open));
  };

  for (const button of overlay.querySelectorAll<HTMLButtonElement>("[data-search-filters-open]")) {
    button.addEventListener("click", () => setOpen(drawer.dataset.open !== "true"));
  }
  drawer.querySelector("[data-search-filters-close]")?.addEventListener("click", () => setOpen(false));

  overlay.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || drawer.dataset.open !== "true") return;
    event.stopPropagation();
    setOpen(false);
  });

  return undefined;
});
