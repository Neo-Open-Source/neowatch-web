import { addHistory, addRecent } from "./history";
import { lockScroll, unlockScroll } from "../client/scroll-lock";
import { collectRefs, renderInitial, renderItems, renderState, syncSourceMore } from "./render";
import { moveResultFocus, trapTab } from "./keyboard";
import { text } from "../text";
import { SEARCH_PAGE_SIZE, type SearchItem, type SearchResultPage } from "./types";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 220;
const PREVIEW_CHUNK = 4;
const EXPANDED_TARGET = 30;

export type SearchFn = (params: { q: string; page: number }) => Promise<SearchResultPage>;

export function createSearchOverlay(
  search: SearchFn,
  signal: AbortSignal,
): { open: () => void } | null {
  const collected = collectRefs();
  if (!collected) return null;
  const refs = collected;

  let query = "";
  let page = 1;
  let hasMore = false;
  let buffer: SearchItem[] = [];
  let shown = 0;
  let timer = 0;
  let requestId = 0;

  const isOpen = (): boolean => !refs.overlay.hidden;

  const resultRows = (): HTMLAnchorElement[] =>
    [...refs.results.querySelectorAll<HTMLAnchorElement>("[data-result-row]")];

  function resetResults(): void {
    page = 1;
    hasMore = false;
    buffer = [];
    shown = 0;
  }

  function syncMore(loading = false): void {
    syncSourceMore(refs, buffer.length > 0 || hasMore, buffer.length, loading);
  }

  function flush(count: number): void {
    const chunk = buffer.splice(0, count);
    if (chunk.length === 0) return;
    renderItems(refs, chunk, shown > 0);
    shown += chunk.length;
  }

  async function loadPage(target: number): Promise<boolean> {
    const current = ++requestId;
    let data: SearchResultPage;
    try {
      data = await search({ q: query, page: target });
    } catch {
      if (current === requestId) {
        if (shown > 0) syncMore();
        else renderState(refs, "error");
      }
      return false;
    }
    if (current !== requestId) return false;

    page = data.page;
    hasMore = data.hasMore || data.items.length === SEARCH_PAGE_SIZE;
    buffer.push(...data.items);
    return true;
  }

  async function showMore(): Promise<void> {
    const need = Math.max(EXPANDED_TARGET - shown, PREVIEW_CHUNK);
    syncMore(true);
    while (buffer.length < need && hasMore) {
      if (!(await loadPage(page + 1))) return;
    }
    flush(need);
    syncMore();
  }

  async function runFirst(): Promise<void> {
    resetResults();
    renderState(refs, "loading");
    if (!(await loadPage(1))) return;
    if (buffer.length === 0) {
      renderItems(refs, [], false);
      syncMore();
      return;
    }
    flush(PREVIEW_CHUNK);
    syncMore();
  }

  function pickHistory(value: string): void {
    query = value;
    refs.field.value = value;
    if (refs.clear) refs.clear.hidden = false;
    void runFirst();
  }

  function schedule(): void {
    window.clearTimeout(timer);
    if (query.length < MIN_QUERY_LENGTH) {
      requestId += 1;
      resetResults();
      renderInitial(refs, pickHistory);
      return;
    }
    timer = window.setTimeout(() => void runFirst(), DEBOUNCE_MS);
  }

  function resetState(): void {
    refs.field.value = "";
    query = "";
    resetResults();
    if (refs.clear) refs.clear.hidden = true;
    renderInitial(refs, pickHistory);
  }

  function open(): void {
    if (isOpen()) return;
    document.dispatchEvent(new Event("nw:close-menus"));
    resetState();
    lockScroll();
    refs.overlay.hidden = false;
    refs.field.focus();
  }

  function close(): void {
    if (!isOpen()) return;
    window.clearTimeout(timer);
    requestId += 1;
    refs.overlay.hidden = true;
    unlockScroll();
  }

  function rememberOpening(row: HTMLAnchorElement): void {
    const { key, kind, title, english, original } = row.dataset;
    if (!key || !kind || !title) return;
    addHistory(query);
    addRecent({
      key,
      kind,
      title,
      titleEnglish: english ?? null,
      titleOriginal: original ?? null,
      poster: row.dataset.poster ?? null,
    });
  }

  function clearField(): void {
    refs.field.value = "";
    query = "";
    if (refs.clear) refs.clear.hidden = true;
    window.clearTimeout(timer);
    requestId += 1;
    resetResults();
    renderInitial(refs, pickHistory);
    refs.field.focus();
  }

  function bindEvents(): void {
    refs.field.addEventListener("input", () => {
      query = refs.field.value.trim();
      if (refs.clear) refs.clear.hidden = query.length === 0;
      schedule();
    });

    refs.field.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const first = resultRows()[0];
      if (!first) return;
      rememberOpening(first);
      first.click();
    });

    refs.clear?.addEventListener("click", clearField);
    refs.close?.addEventListener("click", close);

    refs.overlay.addEventListener("mousedown", (event) => {
      if (event.target === refs.overlay) close();
    });

    refs.results.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-source-more]")) {
        void showMore();
        return;
      }
      const row = event.target.closest<HTMLAnchorElement>("[data-result-row]");
      if (row) rememberOpening(row);
    });

    refs.results.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const row =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("[data-result-row]")
          : null;
      if (!row) return;
      moveResultFocus(resultRows(), row, event.key === "ArrowDown" ? 1 : -1);
    });

    refs.panel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" && document.activeElement === refs.field) {
        event.preventDefault();
        moveResultFocus(resultRows(), null, 1);
        return;
      }
      if (event.key === "Tab") trapTab(event, refs.panel);
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          if (isOpen()) close();
          else open();
          return;
        }
        if (event.key === "Escape" && isOpen()) {
          event.preventDefault();
          close();
        }
      },
      { signal },
    );
  }

  renderInitial(refs, pickHistory);
  bindEvents();

  return { open };
}
