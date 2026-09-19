// Viewport helpers — browser-only, safe to call from focus/scroll handlers.
// Kept in one place so all spatial-navigation code reads the header offset and
// scrolls consistently (and plays nice with CSS `scroll-behavior`).

import { isScrollRestoring } from "@/lib/state/scroll-restore";
import {
  getScrollRoot,
  getViewportHeight,
  scrollRootBy,
  scrollRootTo,
} from "@/lib/state/scroll-root";

export function getHeaderOffset(): number {
  if (typeof document === "undefined") return 52;
  // When content scrolls inside [data-scroll-root], the header sits outside
  // that pane — no inset needed. Otherwise use the sticky/fixed header height.
  if (getScrollRoot()) return 0;
  return (
    (document.querySelector("[data-site-header]") as HTMLElement | null)
      ?.offsetHeight ?? 52
  );
}

/**
 * Scrolls the page vertically so `node` sits below the sticky header and
 * above the bottom edge. No-op when the element is already in view.
 * Skipped while an explicit scroll restoration is in flight so focus-driven
 * scrolling does not fight the "return to where I was" position.
 */
export function ensureVisibleVertically(node: HTMLElement, pad = 24): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (isScrollRestoring()) return;
  const headerH = getHeaderOffset();
  const viewportH = getViewportHeight();
  const rect = node.getBoundingClientRect();
  const root = getScrollRoot();
  const topBound = root ? root.getBoundingClientRect().top + headerH + pad : headerH + pad;
  const bottomBound = root
    ? root.getBoundingClientRect().bottom - pad
    : viewportH - pad;

  if (rect.top < topBound) {
    scrollRootBy(rect.top - topBound, "smooth");
  } else if (rect.bottom > bottomBound) {
    scrollRootBy(rect.bottom - bottomBound, "smooth");
  }
}

export function scrollToTop(smooth = true): void {
  if (typeof window === "undefined") return;
  if (isScrollRestoring()) return;
  scrollRootTo(0, smooth ? "smooth" : "auto");
}
