import { clearHistory, readHistory, readRecent, removeHistory, type RecentItem } from "./history";
import { mediaUrl } from "../media-url";
import { searchSources, type SearchSource } from "./sources";
import { text } from "../text";
import type { SearchItem, SearchState } from "./types";

const stateMessages: Record<SearchState, string> = {
  initial: text.search.startTyping,
  loading: text.search.loading,
  empty: text.search.empty,
  error: text.search.error,
};

export interface OverlayRefs {
  overlay: HTMLElement;
  panel: HTMLElement;
  field: HTMLInputElement;
  results: HTMLElement;
  clear?: HTMLButtonElement | null;
  close?: HTMLButtonElement | null;
  resultTemplate?: HTMLTemplateElement | null;
  historyTemplate?: HTMLTemplateElement | null;
  recentTemplate?: HTMLTemplateElement | null;
  sourceTemplate?: HTMLTemplateElement | null;
  skeletonRowTemplate?: HTMLTemplateElement | null;
}

export function collectRefs(): OverlayRefs | null {
  const overlay = document.querySelector<HTMLElement>("[data-search-overlay]");
  const panel = overlay?.querySelector<HTMLElement>("[data-search-panel]");
  const field = overlay?.querySelector<HTMLInputElement>("[data-search-input]");
  const results = overlay?.querySelector<HTMLElement>("[data-search-body]");
  if (!overlay || !panel || !field || !results) return null;
  return {
    overlay,
    panel,
    field,
    results,
    clear: overlay.querySelector<HTMLButtonElement>("[data-search-clear]"),
    close: overlay.querySelector<HTMLButtonElement>("[data-search-close]"),
    resultTemplate: overlay.querySelector<HTMLTemplateElement>("[data-search-result-template]"),
    historyTemplate: overlay.querySelector<HTMLTemplateElement>("[data-search-history-template]"),
    recentTemplate: overlay.querySelector<HTMLTemplateElement>("[data-search-recent-template]"),
    sourceTemplate: overlay.querySelector<HTMLTemplateElement>("[data-search-source-template]"),
    skeletonRowTemplate: overlay.querySelector<HTMLTemplateElement>("[data-search-skeleton-row-template]"),
  };
}

function clone<T extends HTMLElement>(template: HTMLTemplateElement | null | undefined): T | null {
  const node = template?.content.firstElementChild?.cloneNode(true);
  return node instanceof HTMLElement ? (node as T) : null;
}

export function stateNode(state: SearchState): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "flex min-h-[200px] flex-col items-center justify-center gap-2 p-4 text-center text-muted";
  wrapper.setAttribute("role", "status");

  if (state === "loading") {
    const spinner = document.createElement("span");
    spinner.className = "size-[22px] shrink-0 animate-spin rounded-full border-2 border-line border-t-accent";
    wrapper.appendChild(spinner);
  }

  const message = document.createElement("p");
  message.textContent = stateMessages[state];
  wrapper.appendChild(message);
  return wrapper;
}

function sectionHead(title: string, action?: { label: string; run: () => void }): HTMLElement {
  const head = document.createElement("div");
  head.className = "flex items-center justify-between gap-4 px-1";

  const heading = document.createElement("h3");
  heading.className = "text-caption font-medium uppercase tracking-wide text-muted";
  heading.textContent = title;
  head.appendChild(heading);

  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-caption text-muted transition-colors hover:text-ink";
    button.textContent = action.label;
    button.addEventListener("click", action.run);
    head.appendChild(button);
  }
  return head;
}

function historySection(refs: OverlayRefs, items: string[], onPick: (value: string) => void): HTMLElement {
  const section = document.createElement("section");
  section.appendChild(
    sectionHead(text.search.history, {
      label: text.search.clearHistory,
      run: () => {
        clearHistory();
        renderInitial(refs, onPick);
      },
    }),
  );

  const list = document.createElement("ul");
  list.className = "mt-1 flex flex-col gap-1";
  for (const value of items) {
    const node = clone<HTMLElement>(refs.historyTemplate);
    if (!node) continue;
    node.querySelector("[data-history-text]")?.replaceChildren(value);
    node.querySelector("[data-history-open]")?.addEventListener("click", () => onPick(value));
    node.querySelector("[data-history-remove]")?.addEventListener("click", () => {
      removeHistory(value);
      renderInitial(refs, onPick);
    });
    list.appendChild(node);
  }
  section.appendChild(list);
  return section;
}

function recentSection(refs: OverlayRefs, items: RecentItem[]): HTMLElement {
  const section = document.createElement("section");
  section.appendChild(sectionHead(text.search.recent));

  const grid = document.createElement("div");
  grid.className = "mt-2 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3 px-1";
  for (const item of items) {
    const node = clone<HTMLAnchorElement>(refs.recentTemplate);
    if (!node) continue;
    node.href = mediaUrl(item.key, item.titleEnglish, item.titleOriginal, item.title);
    node.querySelector("[data-recent-title]")?.replaceChildren(item.title);
    const image = node.querySelector("img");
    if (image && item.poster) image.src = item.poster;
    else image?.remove();
    grid.appendChild(node);
  }
  section.appendChild(grid);
  return section;
}

export function renderState(refs: OverlayRefs, state: SearchState): void {
  refs.results.replaceChildren(stateNode(state));
  refs.results.scrollTop = 0;
}

export function renderInitial(refs: OverlayRefs, onPick: (value: string) => void): void {
  const history = readHistory();
  const recent = readRecent();
  if (history.length === 0 && recent.length === 0) {
    renderState(refs, "initial");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col gap-3 pb-2 pt-1";
  if (history.length > 0) wrapper.appendChild(historySection(refs, history, onPick));
  if (recent.length > 0) wrapper.appendChild(recentSection(refs, recent));
  refs.results.replaceChildren(wrapper);
  refs.results.scrollTop = 0;
}

export function resultRow(refs: OverlayRefs, item: SearchItem): HTMLAnchorElement | null {
  const row = clone<HTMLAnchorElement>(refs.resultTemplate);
  if (!row) return null;

  row.href = mediaUrl(item.key, item.titleEnglish, item.titleOriginal, item.title);
  Object.assign(row.dataset, {
    key: item.key,
    kind: item.kind,
    title: item.title,
    english: item.titleEnglish ?? "",
    original: item.titleOriginal ?? "",
    ...(item.poster ? { poster: item.poster } : {}),
  });

  row.querySelector("[data-result-title]")?.replaceChildren(item.title);
  row.querySelector("[data-result-meta]")?.replaceChildren(
    [text.kinds[item.kind as keyof typeof text.kinds], item.year].filter(Boolean).join(" · "),
  );

  const image = row.querySelector("img");
  if (image && item.poster) image.src = item.poster;
  else image?.remove();
  return row;
}

function sourceSection(refs: OverlayRefs, source: SearchSource): HTMLElement | null {
  const section = clone<HTMLElement>(refs.sourceTemplate);
  if (!section) return null;
  section.dataset.source = source.id;
  section.querySelector("[data-source-mark]")?.replaceChildren(source.mark);
  section.querySelector("[data-source-name]")?.replaceChildren(source.name);
  if (!source.live) {
    section.setAttribute("aria-hidden", "true");
    const list = section.querySelector<HTMLElement>("[data-source-list]");
    for (let index = 0; index < 3; index += 1) {
      const row = clone<HTMLElement>(refs.skeletonRowTemplate);
      if (row) list?.appendChild(row);
    }
    section.querySelector("[data-source-more]")?.remove();
  }
  return section;
}

export function renderItems(refs: OverlayRefs, items: SearchItem[], append: boolean): void {
  const live = searchSources.find((source) => source.live);
  const list = append
    ? refs.results.querySelector<HTMLElement>("[data-source-list]")
    : null;

  if (!append) {
    refs.results.replaceChildren();
    refs.results.scrollTop = 0;
    if (items.length === 0) {
      renderState(refs, "empty");
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col gap-4 pb-2 pt-1";
    for (const source of searchSources) {
      const section = sourceSection(refs, source);
      if (section) wrapper.appendChild(section);
    }
    refs.results.appendChild(wrapper);
  }

  const target =
    list ??
    (live
      ? refs.results.querySelector<HTMLElement>(`[data-source="${live.id}"] [data-source-list]`)
      : null);
  if (!target) return;
  for (const item of items) {
    const row = resultRow(refs, item);
    if (row) target.appendChild(row);
  }
}

export function syncSourceMore(
  refs: OverlayRefs,
  visible: boolean,
  remaining: number,
  loading: boolean,
): void {
  const button = refs.results.querySelector<HTMLButtonElement>("[data-source-more]");
  if (!button) return;
  button.hidden = !visible;
  button.disabled = loading;
  const label = loading
    ? text.search.loading
    : remaining > 0
      ? `${text.states.more} ${remaining}`
      : text.states.more;
  button.querySelector("[data-source-more-label]")?.replaceChildren(label);
}
