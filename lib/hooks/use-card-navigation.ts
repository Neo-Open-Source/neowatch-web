"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import {
  useFocusable,
  setFocus,
  getCurrentFocusKey,
  doesFocusableExist,
} from "@noriginmedia/norigin-spatial-navigation";
import { useScrollRow } from "@/components/ui/ScrollRow";
import { useUpTargets } from "@/lib/context/up-navigation";
import { NAVBAR_SEARCH_FOCUS_KEY } from "@/components/Header";
import { setReturnFocusKey, recordPathFocus } from "@/lib/state/focus-return";
import { ensureVisibleVertically, scrollToTop } from "@/lib/utils/scroll-into-view";

interface UseCardNavigationOptions {
  focusKey?: string;
  onEnterPress?: () => void;
}

/**
 * A card is on the first row of a bare (non-ScrollRow) grid when it sits at
 * the same vertical position as the first card in the grid. Grids and cards
 * are located by semantic data-* markers instead of presentational class
 * names, so renaming CSS classes cannot silently break up-navigation.
 */
function isGridFirstRow(node: HTMLElement | null): boolean {
  if (!node) return false;
  const grid = node.closest<HTMLElement>("[data-spatial-grid]");
  if (!grid) return false;
  const firstCard = grid.querySelector<HTMLElement>("[data-spatial-card]");
  if (!firstCard) return false;
  return Math.abs(node.getBoundingClientRect().top - firstCard.getBoundingClientRect().top) < 8;
}

/**
 * Grid geometry for wrap-around navigation: the card's index in the grid, the
 * full row length (counted on the first, always-full row) and total card count.
 */
function gridGeometry(node: HTMLElement): { index: number; cols: number; total: number } | null {
  const grid = node.closest<HTMLElement>("[data-spatial-grid]");
  if (!grid) return null;
  const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-spatial-card]"));
  const index = cards.indexOf(node);
  if (index === -1) return null;
  const firstTop = Math.round(cards[0].getBoundingClientRect().top);
  let cols = 0;
  for (const card of cards) {
    if (Math.abs(Math.round(card.getBoundingClientRect().top) - firstTop) < 8) cols++;
    else break;
  }
  return { index, cols, total: cards.length };
}

/**
 * On bare grids (not ScrollRows) pressing ← at the start of a row jumps to the
 * last card of the previous row, and → at the end of a row jumps to the first
 * card of the next row — standard TV grid behaviour.
 */
function gridWrapFocusKey(node: HTMLElement, dir: "left" | "right", currentKey: string): string | null {
  const geo = gridGeometry(node);
  if (!geo || geo.cols <= 1) return null;
  const { index, cols, total } = geo;

  let target = -1;
  if (dir === "right" && index % cols === cols - 1) {
    target = index + 1;
  } else if (dir === "left" && index % cols === 0) {
    target = index - 1;
  }
  if (target < 0 || target >= total) return null;
  return currentKey.replace(/-\d+$/, `-${target}`);
}

export function useCardNavigation({ focusKey, onEnterPress }: UseCardNavigationOptions) {
  const row = useScrollRow();
  const nodeRef = useRef<HTMLElement | null>(null);
  // Which focusable to jump to when pressing "up" past the top row is a
  // page-level concern. The hook only knows the ordered list of targets —
  // it does not know about specific pages/filters.
  const upTargets = useUpTargets();
  const pathname = usePathname();

  const { ref, focused } = useFocusable({
    focusKey,
    onFocus: ({ node }) => {
      nodeRef.current = node;
      if (focusKey && pathname) recordPathFocus(pathname, focusKey);
      if (!node) return;
      if (row) {
        row.scrollCardIntoView(node);
        return;
      }
      if (isGridFirstRow(node)) {
        // On the grid's first row the page headings/filters above the grid must
        // be visible too — scroll to the very top of the page.
        scrollToTop();
      } else {
        ensureVisibleVertically(node);
      }
    },
    onArrowPress: (dir) => {
      if (dir === "left" || dir === "right") {
        row?.markHoriz();
        if (!row && nodeRef.current && focusKey) {
          const wrapTarget = gridWrapFocusKey(nodeRef.current, dir, focusKey);
          if (wrapTarget) {
            setFocus(wrapTarget);
            return false;
          }
        }
      }
      const atTopRow = row ? row.isTopRow() : isGridFirstRow(nodeRef.current);
      if (dir === "up" && atTopRow) {
        setReturnFocusKey(getCurrentFocusKey());
        const target = upTargets.find((key) => doesFocusableExist(key));
        setFocus(target ?? NAVBAR_SEARCH_FOCUS_KEY);
        return false;
      }
      return true;
    },
    onEnterPress,
  });

  return { ref, focused };
}
