"use client";

import { doesFocusableExist, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { getScrollMaxY, scrollRootTo } from "@/lib/state/scroll-root";

// Scroll position memory for the app's back/forward navigation.
//
// Next.js App Router "maintains" the window scroll position across *all*
// client-side navigations (see Link docs). That is wrong for this app:
// opening a NEW item must land at the top of the page (hero), while going
// BACK (e.g. exiting a season back to the detail page) must restore where the
// user was. We therefore track our own per-pathname positions and re-apply
// them on route change, overriding Next's own scroll handling afterwards.

const positions = new Map<string, number>();

let backPending = false;
let restoring = false;

export function markBackNavigation(): void {
  backPending = true;
}

export function consumeBackNavigation(): boolean {
  const val = backPending;
  backPending = false;
  return val;
}

export function isScrollRestoring(): boolean {
  return restoring;
}

export function getSavedScroll(pathname: string): number | undefined {
  return positions.get(pathname);
}

export function saveScroll(pathname: string, y: number): void {
  positions.set(pathname, y);
}

/**
 * Applies `targetY` repeatedly until the page is tall enough to reach it (data
 * loads asynchronously, so the target becomes reachable only after content
 * renders). Keeps re-applying so it wins over Next.js's own delayed scroll
 * handling. Stops early when reachable, or after `maxAttempts` (~6s). The
 * `isScrollRestoring()` guard stays ON until the owner (the hook) calls
 * `endScrollRestore()`, so focus-driven scrolling cannot steal the position on
 * the first frames after a back-navigation. Returns a cleanup that cancels.
 */
export function superviseScroll(targetY: number): () => void {
  let cancelled = false;
  let attempts = 0;
  const maxAttempts = 40;

  const apply = () => {
    if (cancelled || typeof window === "undefined") return;
    const maxY = getScrollMaxY();
    scrollRootTo(Math.min(targetY, maxY));
    if (maxY >= targetY || ++attempts > maxAttempts) return;
    setTimeout(apply, 150);
  };
  apply();

  return () => {
    cancelled = true;
  };
}

export function beginScrollRestore(): void {
  restoring = true;
}

export function endScrollRestore(): void {
  restoring = false;
}

/**
 * Re-focuses `targetKey` repeatedly until it is mounted. On a back-navigation
 * the target card (e.g. a season) loads asynchronously just like the content
 * that makes the page tall enough to restore the scroll — so we keep trying
 * until `doesFocusableExist` succeeds. Returns a cleanup that cancels.
 */
export function superviseFocus(targetKey: string): () => void {
  let cancelled = false;
  let attempts = 0;
  const maxAttempts = 40;

  const apply = () => {
    if (cancelled) return;
    if (doesFocusableExist(targetKey)) {
      setFocus(targetKey);
      return;
    }
    if (++attempts > maxAttempts) return;
    setTimeout(apply, 150);
  };
  apply();

  return () => {
    cancelled = true;
  };
}