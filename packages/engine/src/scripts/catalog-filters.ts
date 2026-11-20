import { bindEach } from "../lib/client/bind";

bindEach<HTMLElement>("[data-filters]", (root) => {
  const genres = root.querySelector<HTMLElement>("[data-filters-genres]");
  if (!genres) return undefined;
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-filters-open]")) {
    button.addEventListener("click", () => {
      genres.dataset.state = "open";
    });
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-filters-back]")) {
    button.addEventListener("click", () => {
      genres.dataset.state = "closed";
    });
  }
  return undefined;
});

bindEach<HTMLElement>("[data-catalog]", (catalog) => {
  const grid = catalog.querySelector<HTMLElement>("[data-view-grid]");
  const list = catalog.querySelector<HTMLElement>("[data-view-list]");
  const buttons = [...catalog.querySelectorAll<HTMLButtonElement>("[data-view-set]")];
  if (!grid || !list || buttons.length === 0) return undefined;

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const isList = button.dataset.viewSet === "list";
      const target = isList ? list : grid;
      const other = isList ? grid : list;
      other.classList.add("hidden");
      other.classList.remove("grid", "flex");
      target.classList.remove("hidden");
      target.classList.add(isList ? "flex" : "grid");
      for (const item of buttons) {
        const active = item === button;
        item.classList.toggle("text-accent", active);
        item.classList.toggle("text-muted", !active);
        item.setAttribute("aria-pressed", String(active));
      }
    });
  }
  return undefined;
});
