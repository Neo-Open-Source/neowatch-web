// Scroll root helpers — on mobile the main content pane scrolls instead of
// the window (app shell). All scroll read/write goes through here.

export function getScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector<HTMLElement>("[data-scroll-root]");
  if (!el) return null;
  // Only treat as scroll root when the mobile app-shell styles are active
  const overflowY = getComputedStyle(el).overflowY;
  if (overflowY === "auto" || overflowY === "scroll") return el;
  return null;
}

export function getScrollY(): number {
  const root = getScrollRoot();
  if (root) return root.scrollTop;
  return window.scrollY || document.documentElement.scrollTop;
}

export function getViewportHeight(): number {
  const root = getScrollRoot();
  if (root) return root.clientHeight;
  return window.innerHeight;
}

export function getScrollMaxY(): number {
  const root = getScrollRoot();
  if (root) return Math.max(0, root.scrollHeight - root.clientHeight);
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

export function scrollRootTo(top: number, behavior: ScrollBehavior = "auto"): void {
  const root = getScrollRoot();
  if (root) {
    root.scrollTo({ top, behavior });
    return;
  }
  window.scrollTo({ top, behavior });
}

export function scrollRootBy(top: number, behavior: ScrollBehavior = "auto"): void {
  const root = getScrollRoot();
  if (root) {
    root.scrollBy({ top, behavior });
    return;
  }
  window.scrollBy({ top, behavior });
}

/** Absolute Y of `el` inside the active scroll root (or the document). */
export function getOffsetInScrollRoot(el: HTMLElement): number {
  const root = getScrollRoot();
  if (!root) return el.getBoundingClientRect().top + getScrollY();
  return el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
}

export function onScrollRoot(handler: () => void): () => void {
  const root = getScrollRoot();
  const target: HTMLElement | Window = root ?? window;
  target.addEventListener("scroll", handler, { passive: true });
  return () => target.removeEventListener("scroll", handler);
}
