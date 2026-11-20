import { bindEach } from "../lib/client/bind";
import { text } from "../lib/text";

const STORAGE_KEY = "nw_watch_panel";

bindEach<HTMLElement>("[data-watch-view]", (root, signal) => {
  const body = root.querySelector<HTMLElement>("[data-watch-body]");
  const sidebar = root.querySelector<HTMLElement>("[data-watch-sidebar]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-watch-panel-toggle]");
  const chevron = root.querySelector<HTMLElement>("[data-watch-panel-chevron]");

  const setPanel = (shown: boolean, persist = true): void => {
    const state = shown ? "shown" : "hidden";
    body?.setAttribute("data-panel", state);
    sidebar?.setAttribute("data-panel", state);
    chevron?.setAttribute("data-panel", state);
    toggle?.setAttribute("aria-pressed", String(shown));
    toggle?.setAttribute("aria-label", shown ? text.watch.hidePanel : text.watch.showPanel);
    if (sidebar) {
      sidebar.inert = !shown;
      sidebar.setAttribute("aria-hidden", String(!shown));
    }
    if (persist) localStorage.setItem(STORAGE_KEY, state);
  };

  setPanel(localStorage.getItem(STORAGE_KEY) !== "hidden", false);
  toggle?.addEventListener(
    "click",
    () => {
      setPanel(toggle.getAttribute("aria-pressed") !== "true");
    },
    { signal },
  );
});
