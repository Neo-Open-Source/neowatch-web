"use client";

import type { KeyboardEvent } from "react";

/**
 * Keyboard activation for clickable cards that already receive Enter from the
 * spatial-navigation layer. Enter `keydown` is passed to the native element
 * handler here and stopped from propagating to the window-level spatial nav
 * listener, so a focused card's action fires exactly once either way.
 */
export function onCardKeyDown(e: KeyboardEvent, onActivate: () => void) {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  e.stopPropagation();
  onActivate();
}