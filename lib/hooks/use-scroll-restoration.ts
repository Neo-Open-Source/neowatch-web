"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { beginScrollRestore, consumeBackNavigation, endScrollRestore, getSavedScroll, markBackNavigation, saveScroll, superviseScroll, superviseFocus } from "@/lib/state/scroll-restore";
import { getPathFocus } from "@/lib/state/focus-return";
import { getScrollY, onScrollRoot, scrollRootTo } from "@/lib/state/scroll-root";

/**
 * Gives the app explicit scroll behavior on navigation, overriding Next.js's
 * default "maintain scroll position on all navigations":
 *   - forward (push) navigation → scroll to the top (fresh item / page).
 *   - back / popstate navigation → restore the saved position of that page.
 * The popstate only fires for in-app back() calls and the browser back/forward
 * buttons, so direction is reliable.
 */
export function useScrollRestore() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  // Track the current scroll position for the page we are on.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => saveScroll(pathname, getScrollY()));
    };
    const off = onScrollRoot(onScroll);
    return () => {
      off();
      cancelAnimationFrame(raf);
      saveScroll(pathname, getScrollY());
    };
  }, [pathname]);

  // Detect back/forward via popstate (fires for router.back() + browser nav).
  useEffect(() => {
    const onPop = () => markBackNavigation();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (prev === null) {
      endScrollRestore();
      return; // initial load — nothing to restore.
    }

    const isBack = consumeBackNavigation();

    if (isBack) {
      // Returning to a page: restore its saved position and keep the
      // "don't auto-scroll on focus" guard ON long enough that the page's
      // initial focus (e.g. detail Play button → scrollToHero) fires while
      // suppressed, then release it so normal navigation resumes.
      const target = getSavedScroll(pathname) ?? 0;
      const focusKey = getPathFocus(pathname);
      beginScrollRestore();
      const cancel = superviseScroll(target);
      // Focus restore runs independently of the scroll guard timer: the target
      // card (e.g. a season) can load later than the scroll target becomes
      // reachable, so let it keep retrying until it mounts or cancels below.
      const cancelFocus = focusKey ? superviseFocus(focusKey) : undefined;
      const clearTimer = setTimeout(() => {
        endScrollRestore();
        cancel();
      }, 1600);

      return () => {
        cancel();
        cancelFocus?.();
        clearTimeout(clearTimer);
        endScrollRestore();
      };
    }

    // Forward navigation — a fresh page always starts at the top.
    scrollRootTo(0);
    return;
  }, [pathname]);
}