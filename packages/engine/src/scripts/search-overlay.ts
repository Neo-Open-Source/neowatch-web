import { actions } from "astro:actions";
import { bindEach } from "../lib/client/bind";
import { createSearchOverlay } from "../lib/search/controller";
import { trackKeyboardInset } from "../lib/search/keyboard-inset";
import type { SearchResultPage } from "../lib/search/types";

trackKeyboardInset();

bindEach<HTMLElement>("[data-search-overlay]", (_overlay, signal) => {
  const overlay = createSearchOverlay(async ({ q, page }) => {
    const { data, error } = await actions.catalog.search({ q, page });
    if (error || !data) throw new Error("search failed");
    return data as SearchResultPage;
  }, signal);
  if (!overlay) return undefined;

  for (const trigger of document.querySelectorAll<HTMLButtonElement>("[data-search-open]")) {
    trigger.addEventListener("click", () => overlay.open(), { signal });
  }

  return undefined;
});
