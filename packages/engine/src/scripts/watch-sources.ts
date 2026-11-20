import { watchSources } from "../data/watch";
import { bindEach } from "../lib/client/bind";

type Tab = "voice" | "subtitle";

const trackTab = (trackId: string): Tab | null => {
  for (const source of watchSources) {
    if (source.tracks.voice.some((item) => item.trackId === trackId)) return "voice";
    if (source.tracks.subtitle.some((item) => item.trackId === trackId)) return "subtitle";
  }
  return null;
};

bindEach<HTMLElement>("[data-watch-view]", (root, signal) => {
  const sourceButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-watch-source]")];
  const panels = new Map(
    [...root.querySelectorAll<HTMLElement>("[data-watch-panel]")].map((panel) => [panel.dataset.watchPanel, panel]),
  );
  if (sourceButtons.length === 0 || panels.size === 0) return undefined;

  let selectedTrack =
    root.querySelector<HTMLButtonElement>('[data-watch-track][aria-pressed="true"]')?.dataset.watchTrack ?? "";
  let activeSourceId =
    sourceButtons.find((button) => button.getAttribute("aria-pressed") === "true")?.dataset.watchSource ?? "";

  const offers = (sourceId: string): boolean =>
    !!panels.get(sourceId)?.querySelector(`[data-watch-track="${selectedTrack}"]`);

  const visibleSource = (): string => {
    if (offers(activeSourceId)) return activeSourceId;
    const other = sourceButtons.find((button) => button.dataset.watchSource !== activeSourceId);
    return other && offers(other.dataset.watchSource ?? "") ? (other.dataset.watchSource ?? "") : activeSourceId;
  };

  const renderTabs = (panel: HTMLElement): void => {
    const current = trackTab(selectedTrack) ?? "voice";
    for (const button of panel.querySelectorAll<HTMLButtonElement>("[data-watch-tab]")) {
      const on = button.dataset.watchTab === current;
      button.setAttribute("aria-pressed", String(on));
      button.classList.toggle("text-ink", on);
      button.classList.toggle("text-muted", !on);
    }
    for (const list of panel.querySelectorAll<HTMLElement>("[data-watch-list]")) {
      list.hidden = list.dataset.watchList !== current;
    }
  };

  const render = (): void => {
    const shown = visibleSource();
    activeSourceId = shown;
    for (const button of sourceButtons) {
      button.hidden = !offers(button.dataset.watchSource ?? "");
      button.setAttribute("aria-pressed", String(button.dataset.watchSource === shown));
    }
    for (const [id, panel] of panels) {
      panel.hidden = id !== shown;
    }
    const panel = panels.get(shown);
    if (panel) {
      if (trackTab(selectedTrack)) {
        for (const button of panel.querySelectorAll<HTMLButtonElement>("[data-watch-track]")) {
          button.setAttribute("aria-pressed", String(button.dataset.watchTrack === selectedTrack));
        }
      }
      renderTabs(panel);
    }
  };

  render();

  root.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const source = target.closest<HTMLButtonElement>("[data-watch-source]");
      if (source) {
        activeSourceId = source.dataset.watchSource ?? "";
        render();
        return;
      }

      const track = target.closest<HTMLButtonElement>("[data-watch-track]");
      if (track) {
        selectedTrack = track.dataset.watchTrack ?? "";
        render();
        return;
      }

      const tabButton = target.closest<HTMLButtonElement>("[data-watch-tab]");
      if (!tabButton) return;
      const panel = panels.get(activeSourceId);
      if (!panel) return;
      for (const button of panel.querySelectorAll<HTMLButtonElement>("[data-watch-tab]")) {
        const on = button === tabButton;
        button.setAttribute("aria-pressed", String(on));
        button.classList.toggle("text-ink", on);
        button.classList.toggle("text-muted", !on);
      }
      for (const list of panel.querySelectorAll<HTMLElement>("[data-watch-list]")) {
        list.hidden = list.dataset.watchList !== tabButton.dataset.watchTab;
      }
    },
    { signal },
  );
});
