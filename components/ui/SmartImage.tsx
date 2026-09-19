"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";

// SSR-safe layout effect: synchronous reveal before first paint on the client,
// plain effect during server rendering (no-op there).
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
import type { ImgHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils/cx";

type ImageStatus = "loading" | "loaded" | "error";

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onLoad" | "onError" | "alt" | "className"> {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Extra class applied once the image loaded (fade-in), mirrored by `errorAsLoaded`. */
  loadedClassName?: string;
  /** Kept on screen while loading — e.g. a skeleton overlay. */
  skeleton?: ReactNode;
  /** Swaps the <img> on error (or when src is missing) — e.g. a placeholder. */
  fallback?: ReactNode;
  /** Treat network errors as a successful load so decorative backgrounds always render. */
  errorAsLoaded?: boolean;
}

/** How far (px) outside the viewport images begin loading. */
const REVEAL_MARGIN = 400;

function SmartImageInner({
  src,
  alt,
  className,
  loadedClassName,
  skeleton,
  fallback,
  errorAsLoaded,
  ...imgProps
}: SmartImageProps) {
  const [status, setStatus] = useState<ImageStatus>(src ? "loading" : "error");
  const [revealed, setRevealed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reveal is driven by IntersectionObserver instead of the native
  // `loading="lazy"` attribute. Native lazy loading is unreliable in
  // Safari/iOS inside horizontally-scrolled rows and `content-visibility:auto`
  // grids — the browser can permanently skip those images (skeleton stuck on
  // screen, no onLoad/onError ever fires). Controlling the fetch ourselves
  // behaves identically in every engine, including inside transformed tracks
  // and skipped (content-visibility) subtrees.
  //
  // Images already inside the viewport are revealed synchronously before the
  // first paint so above-the-fold content does not flash a skeleton.
  useIsomorphicLayoutEffect(() => {
    if (!src || revealed) return;
    const node = imgRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const nearViewport =
      rect.top < window.innerHeight + REVEAL_MARGIN &&
      rect.bottom > -REVEAL_MARGIN &&
      rect.left < window.innerWidth + REVEAL_MARGIN &&
      rect.right > -REVEAL_MARGIN;

    if (nearViewport || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${REVEAL_MARGIN}px` },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [src, revealed]);

  const showFallback = !src || (status === "error" && !errorAsLoaded);
  const loaded = status === "loaded" || (status === "error" && errorAsLoaded);

  return (
    <>
      {skeleton && !showFallback && status === "loading" && skeleton}
      {showFallback && fallback != null ? (
        fallback
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...imgProps}
          ref={imgRef}
          src={revealed ? src : undefined}
          alt={alt ?? ""}
          loading={revealed ? "eager" : undefined}
          className={cx(className, loaded && loadedClassName)}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus(errorAsLoaded ? "loaded" : "error")}
        />
      ) : null}
    </>
  );
}

/**
 * <img> with built-in loading/error state and automatic reset when `src`
 * changes (keyed remount), so consumers don't need a reset-per-src effect.
 */
export const SmartImage = memo(function SmartImage(props: SmartImageProps) {
  return <SmartImageInner key={props.src ?? "empty"} {...props} />;
});
