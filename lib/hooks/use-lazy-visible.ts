"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True once the element is (or was) close to the viewport. Child content can
 * be mounted lazily — e.g. for shelves below the fold — so expensive fetches
 * and render work only happen near the visible area. Once revealed it stays
 * mounted; there is no unmount on scroll.
 */
export function useLazyVisible(margin = "600px 0px"): [(el: HTMLElement | null) => void, boolean] {
  const [revealed, setRevealed] = useState(false);
  const nodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (revealed) return;
    const node = nodeRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed, margin]);

  const ref = (el: HTMLElement | null) => {
    nodeRef.current = el;
  };

  return [ref, revealed];
}