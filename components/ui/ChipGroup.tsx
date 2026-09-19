"use client";

import { createContext, useContext, useState } from "react";
import { FocusContext, useFocusable, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { NAVBAR_SEARCH_FOCUS_KEY, CONTENT_FOCUS_KEY } from "@/components/Header";
import { getHeaderOffset } from "@/lib/utils/scroll-into-view";
import { getScrollRoot, scrollRootBy } from "@/lib/state/scroll-root";
import { cx } from "@/lib/utils/cx";

/**
 * Shared vertical-navigation logic for filter controls inside a ChipGroup.
 * Geometry alone can't reliably find the navbar above the chips, so `up` and
 * `down` are resolved deterministically: up returns to the header, down jumps
 * to the page's content target.
 */
function useChipDirectionalNav(onDown?: () => void) {
  return {
    onArrowPress: (dir: string) => {
      if (dir === "up") { setFocus(NAVBAR_SEARCH_FOCUS_KEY); return false; }
      if (dir === "down") {
        if (onDown) onDown();
        else setFocus(CONTENT_FOCUS_KEY);
        return false;
      }
      return true;
    },
  };
}

function scrollIntoViewIfNeeded(node: HTMLElement | null, pad = 16) {
  if (!node || typeof window === "undefined") return;
  const rect = node.getBoundingClientRect();
  const headerH = getHeaderOffset();
  const root = getScrollRoot();
  const topBound = root ? root.getBoundingClientRect().top + headerH + pad : headerH + pad;
  if (rect.top < topBound) {
    scrollRootBy(rect.top - topBound, "smooth");
  }
}

interface ChipGroupProps {
  focusKey: string;
  children: React.ReactNode;
  onDown?: () => void;
}

/**
 * Container for filter pills/selects. Exposes the content target (`onDown`) to
 * its children so each focused child can navigate down to the page's content —
 * the container itself only receives arrow presses when it is the focused node.
 */
const ChipNavContext = createContext<{ onDown?: () => void }>({});

export function ChipGroup({ focusKey, children, onDown }: ChipGroupProps) {
  const { ref, focusKey: resolvedKey } = useFocusable({
    focusKey,
    trackChildren: true,
    isFocusBoundary: true,
    focusBoundaryDirections: ["left", "right"],
    onFocus: ({ node }) => scrollIntoViewIfNeeded(node),
    onArrowPress: useChipDirectionalNav(onDown).onArrowPress,
  });

  return (
    <FocusContext.Provider value={resolvedKey}>
      <ChipNavContext.Provider value={{ onDown }}>
        <div ref={ref as React.RefObject<HTMLDivElement>} className="chip-group">
          {children}
        </div>
      </ChipNavContext.Provider>
    </FocusContext.Provider>
  );
}

interface ChipProps {
  focusKey: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Chip({ focusKey, active, onClick, children }: ChipProps) {
  const { onDown } = useContext(ChipNavContext);
  const { ref, focused } = useFocusable({
    focusKey,
    onFocus: ({ node }) => scrollIntoViewIfNeeded(node),
    onEnterPress: onClick,
    onArrowPress: useChipDirectionalNav(onDown).onArrowPress,
  });

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={cx("chip", active && "chip--active", focused && "chip--nav-focused")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface FocusableSelectProps {
  focusKey: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function FocusableSelect({ focusKey, value, onChange, className, children }: FocusableSelectProps) {
  const { onDown } = useContext(ChipNavContext);
  const { onArrowPress } = useChipDirectionalNav(onDown);
  // When the native <select> popup is open the browser owns arrow keys; the
  // spatial-navigation up/down must not hijack them.
  const [open, setOpen] = useState(false);

  const { ref, focused } = useFocusable({
    focusKey,
    onFocus: ({ node }) => scrollIntoViewIfNeeded(node),
    onEnterPress: () => {
      (ref.current as HTMLSelectElement | null)?.focus();
      (ref.current as HTMLSelectElement | null)?.click();
    },
    onArrowPress: (dir) => {
      if (open) return false;
      return onArrowPress(dir);
    },
  });

  return (
    <select
      ref={ref as React.RefObject<HTMLSelectElement>}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={() => setOpen((o) => !o)}
      onBlur={() => setOpen(false)}
      className={cx(
        className ?? "chip-select",
        value && "chip-select--active",
        focused && "chip-select--nav-focused",
      )}
    >
      {children}
    </select>
  );
}