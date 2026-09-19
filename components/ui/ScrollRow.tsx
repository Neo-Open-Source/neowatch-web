"use client";

import { useRef, useState, useCallback, useEffect, startTransition, type ReactNode } from "react";
import { createContext, useContext } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FocusContext, useFocusable, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { NAVBAR_SEARCH_FOCUS_KEY } from "@/components/Header";
import { getHeaderOffset, scrollToTop } from "@/lib/utils/scroll-into-view";
import { getScrollRoot, scrollRootBy } from "@/lib/state/scroll-root";

interface ScrollRowProps {
  children: ReactNode;
  focusKey?: string;
  /**
   * When false the row registers no focusable (only skeletons / no real
   * content yet), so navigation can never land on an invisible empty container.
   */
  navigable?: boolean;
}

function usePreferNativeSwipe() {
  const [native, setNative] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const sync = () => setNative(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return native;
}

export function ScrollRow({ children, focusKey, navigable = true }: ScrollRowProps) {
  const { t } = useI18n();
  const nativeSwipe = usePreferNativeSwipe();
  const viewportRef  = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);
  const offsetRef    = useRef(0);
  const isHorizRef   = useRef(false);
  const paddingRef   = useRef({ left: 0, right: 0 });
  const [translateX, setTranslateX]     = useState(0);
  const [animateTrack, setAnimateTrack] = useState(false);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [hovered, setHovered]   = useState(false);

  const { ref: scrollRowRef, focusKey: resolvedFocusKey } = useFocusable({
    focusKey,
    trackChildren: true,
    focusable: navigable,
    autoRestoreFocus: true,
    isFocusBoundary: true,
    focusBoundaryDirections: ["left", "right"],
    preferredChildFocusKey: focusKey ? `${focusKey}-card-0` : undefined,
    onArrowPress: (dir) => {
      if (dir === "up") {
        setFocus(NAVBAR_SEARCH_FOCUS_KEY);
        scrollToTop();
        return false;
      }
      return true;
    },
  });

  // ── helpers ─────────────────────────────────────────────────────────────

  function getOffsetInsideTrack(el: HTMLElement, track: HTMLElement) {
    let offset = 0;
    let node: HTMLElement | null = el;
    while (node && node !== track) {
      offset += node.offsetLeft;
      node = node.offsetParent as HTMLElement | null;
    }
    return offset;
  }

  const readOffset = useCallback(() => {
    if (nativeSwipe) return viewportRef.current?.scrollLeft ?? 0;
    return offsetRef.current;
  }, [nativeSwipe]);

  const applyOffset = useCallback((offset: number, animate: boolean) => {
    const viewport = viewportRef.current;
    offsetRef.current = offset;
    if (nativeSwipe && viewport) {
      if (animate) viewport.scrollTo({ left: offset, behavior: "smooth" });
      else viewport.scrollLeft = offset;
      return;
    }
    setAnimateTrack(animate);
    setTranslateX(-offset);
  }, [nativeSwipe]);

  const syncCanScroll = useCallback((offset: number) => {
    const track    = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const padL = parseFloat(getComputedStyle(track).paddingLeft)  || 0;
    const padR = parseFloat(getComputedStyle(track).paddingRight) || 0;
    paddingRef.current = { left: padL, right: padR };
    const usable     = viewport.clientWidth - padL - padR;
    const contentW   = track.scrollWidth   - padL - padR;
    const maxOffset  = Math.max(0, contentW - usable);
    setCanLeft(offset > 4);
    setCanRight(offset < maxOffset - 4);
  }, []);

  useEffect(() => { syncCanScroll(readOffset()); }, [syncCanScroll, readOffset, nativeSwipe]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track    = trackRef.current;
    if (!viewport || !track) return;
    const ro = new ResizeObserver(() => syncCanScroll(readOffset()));
    ro.observe(viewport);
    ro.observe(track);
    return () => ro.disconnect();
  }, [syncCanScroll, readOffset]);

  // Keep arrow state in sync with native swipe scroll
  useEffect(() => {
    if (!nativeSwipe) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onScroll = () => {
      offsetRef.current = viewport.scrollLeft;
      syncCanScroll(viewport.scrollLeft);
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [nativeSwipe, syncCanScroll]);

  // Reset transform when switching into native mode
  useEffect(() => {
    if (nativeSwipe) {
      startTransition(() => {
        setTranslateX(0);
        setAnimateTrack(false);
      });
    }
  }, [nativeSwipe]);

  // ── public: called by card onFocus ───────────────────────────────────────

  const scrollCardIntoView = useCallback((cardEl: HTMLElement) => {
    const track    = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    // ── Vertical: scroll page so the whole shelf-section row is visible ──
    const section = viewport.closest<HTMLElement>("[data-shelf]") ?? viewport;
    const headerH = getHeaderOffset();
    const pad = 24;
    const secRect = section.getBoundingClientRect();
    const root = getScrollRoot();
    const topBound = root ? root.getBoundingClientRect().top + headerH + pad : headerH + pad;
    const bottomBound = root
      ? root.getBoundingClientRect().bottom - pad
      : window.innerHeight - pad;

    if (secRect.top < topBound) {
      scrollRootBy(secRect.top - topBound, "smooth");
    } else if (secRect.bottom > bottomBound) {
      scrollRootBy(secRect.bottom - bottomBound, "smooth");
    }

    // ── Horizontal ───────────────────────────────────────────────────────
    const { left: padL, right: padR } = paddingRef.current;
    const usable = viewport.clientWidth - padL - padR;

    const cardLeft  = getOffsetInsideTrack(cardEl, track) - padL;
    const cardRight = cardLeft + cardEl.offsetWidth;
    const cur       = readOffset();

    let next = cur;
    if (cardLeft  < cur)               next = Math.max(0, cardLeft);
    else if (cardRight > cur + usable) next = cardRight - usable;

    const contentW  = track.scrollWidth - padL - padR;
    const maxOffset = Math.max(0, contentW - usable);
    const clamped   = Math.min(Math.max(0, next), maxOffset);

    const animate       = isHorizRef.current;
    isHorizRef.current  = false;
    applyOffset(clamped, animate);
    syncCanScroll(clamped);
  }, [syncCanScroll, readOffset, applyOffset]);

  // expose via context so cards can call it
  const ctxValue = {
    resolvedFocusKey,
    isTopRow: () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-shelf]"));
      const section = viewportRef.current?.closest<HTMLElement>("[data-shelf]");
      return !section || sections.indexOf(section) === 0;
    },
    scrollCardIntoView,
    markHoriz: () => { isHorizRef.current = true; },
  };

  // ── arrow button scroll ──────────────────────────────────────────────────

  const scrollBy = useCallback((dir: "left" | "right") => {
    const track    = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const { left: padL, right: padR } = paddingRef.current;
    const usable = viewport.clientWidth - padL - padR;
    const step   = usable * 0.8;

    const contentW  = track.scrollWidth - padL - padR;
    const maxOffset = Math.max(0, contentW - usable);
    const cur       = readOffset();
    const next      = dir === "left"
      ? Math.max(0, cur - step)
      : Math.min(maxOffset, cur + step);

    applyOffset(next, true);
    syncCanScroll(next);
  }, [syncCanScroll, readOffset, applyOffset]);

  const scrollByPixels = useCallback((delta: number) => {
    const track    = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport || delta === 0) return;
    const { left: padL, right: padR } = paddingRef.current;
    const usable = viewport.clientWidth - padL - padR;
    const contentW  = track.scrollWidth - padL - padR;
    const maxOffset = Math.max(0, contentW - usable);
    const next = Math.min(Math.max(0, readOffset() + delta), maxOffset);

    applyOffset(next, false);
    syncCanScroll(next);
  }, [syncCanScroll, readOffset, applyOffset]);

  useEffect(() => {
    // Native swipe mode already handles trackpads / touch; only wire wheel for transform mode
    if (nativeSwipe) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (e: WheelEvent) => {
      const horizontal = e.deltaX !== 0 || e.shiftKey;
      if (!horizontal) return;

      let delta: number;
      if (e.deltaX !== 0) {
        delta = e.deltaX;
        if (e.deltaMode === 1) delta *= 16;
        else if (e.deltaMode === 2) delta *= viewport.clientWidth;
      } else {
        delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 16;
        else if (e.deltaMode === 2) delta *= viewport.clientWidth;
      }
      if (delta === 0) return;

      e.preventDefault();
      scrollByPixels(delta);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [scrollByPixels, nativeSwipe]);

  return (
    <ScrollRowContext.Provider value={ctxValue}>
      <FocusContext.Provider value={resolvedFocusKey}>
        <div
          ref={scrollRowRef as React.RefObject<HTMLDivElement>}
          className={`scroll-row${nativeSwipe ? " scroll-row--native" : ""}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Arrow dir="left"  visible={!nativeSwipe && hovered && canLeft}  onClick={() => scrollBy("left")}  label={t.a11y.scrollLeft} />
          <div ref={viewportRef} className="scroll-row__viewport">
            <div
              ref={trackRef}
              className={`scroll-row__track${animateTrack && !nativeSwipe ? " scroll-row__track--animate" : ""}`}
              style={nativeSwipe ? undefined : { transform: `translate3d(${translateX}px, 0, 0)` }}
            >
              {children}
            </div>
          </div>
          <Arrow dir="right" visible={!nativeSwipe && hovered && canRight} onClick={() => scrollBy("right")} label={t.a11y.scrollRight} />
        </div>
      </FocusContext.Provider>
    </ScrollRowContext.Provider>
  );
}

// ── Context so cards can trigger scroll ─────────────────────────────────────

interface ScrollRowCtx {
  resolvedFocusKey: string;
  isTopRow: () => boolean;
  scrollCardIntoView: (el: HTMLElement) => void;
  markHoriz: () => void;
}

const ScrollRowContext = createContext<ScrollRowCtx | null>(null);
export function useScrollRow() { return useContext(ScrollRowContext); }

// ── Arrow button ─────────────────────────────────────────────────────────────

function Arrow({ dir, visible, onClick, label }: {
  dir: "left" | "right"; visible: boolean; onClick: () => void; label: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      tabIndex={-1}
      className={`scroll-row__arrow scroll-row__arrow--${dir}${visible ? " scroll-row__arrow--visible" : ""}`}
    >
      {dir === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}
