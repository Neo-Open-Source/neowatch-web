"use client";

import { useEffect, type ReactNode } from "react";

/**
 * iOS Safari rotation fix. The mobile layout locks html/body/app-shell to the
 * viewport height (`100dvh`) with `overflow: hidden`. During device rotation
 * Safari keeps a stale viewport height and scrolls the document, which leaves
 * a gap above the header ("empty square") and the shell no longer fills the
 * screen. JS-driven `--app-height` + a scroll reset on rotation keep the shell
 * glued to the actual viewport.
 */
function useViewportHeightSync() {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--app-height", `${h}px`);
    };

    // iOS fires resize/orientationchange late; re-sync on the next frame and
    // after a short delay so the final (post-rotation) size is captured.
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      raf = requestAnimationFrame(sync);
      timer = setTimeout(sync, 120);
    };

    const onOrientation = () => {
      // Safari scrolls the document during rotation — reset it so the header
      // stays glued to the top and no gap appears above it.
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      schedule();
    };

    sync();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("pageshow", sync);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("pageshow", sync);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, []);
}

/** App chrome shell — on mobile locks height so only `<main>` scrolls. */
export function AppShell({ children }: { children: ReactNode }) {
  useViewportHeightSync();
  return <div className="app-shell">{children}</div>;
}
