// iOS Safari does not shrink dvh (or any layout-viewport unit) when the soft
// keyboard opens, and ignores interactive-widget. Only the visual viewport
// reports the keyboard, so track it and publish a --keyboard-inset the overlay
// padding consumes. Recomputed on every event: some iOS 26 builds leave a
// stale offsetTop after dismissal, and caching the first value strands the bar.
export function trackKeyboardInset(): void {
  const vv = window.visualViewport;
  if (!vv) return;

  const update = (): void => {
    const hidden = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty("--keyboard-inset", `${hidden}px`);
  };

  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  update();
}
