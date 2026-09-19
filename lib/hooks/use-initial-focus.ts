"use client";

import { useEffect, useRef } from "react";
import { doesFocusableExist, getCurrentFocusKey, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useInputMode } from "@/lib/context/input-mode";
import { CONTENT_FOCUS_KEY, NAVBAR_FOCUS_KEY } from "@/components/Header";

// Layout-level containers that must never be mistaken for "the user is already
// navigating": they can be the current focus key while holding no focused leaf
// (e.g. after a debounced auto-restore during SPA navigation) — arrows are dead.
const CONTAINER_KEYS = new Set<string>([CONTENT_FOCUS_KEY, NAVBAR_FOCUS_KEY]);

// Focuses the first focusable from `priorityKeys` that is actually mounted.
// Re-checks until one appears (rows load async) or the user navigates manually.
// Only runs in spatial mode — with a mouse the highlight would just be noise.
export function useInitialFocus(priorityKeys: string[]) {
  const isSpatial = useInputMode();
  const doneRef = useRef(false);
  const keysKey = priorityKeys.join(",");

  useEffect(() => {
    if (!isSpatial) return;
    if (doneRef.current) return;
    let cancelled = false;
    let attempts = 0;

    const tryFocus = () => {
      if (cancelled || doneRef.current) return;
      // Respect a live leaf focus (e.g. the user is already navigating with
      // arrows). A stale key left over from a previous route — whose focusable
      // was unmounted during navigation — must not block initial focus: norigin
      // happily "focuses" a missing key, leaving the store poisoned and arrows
      // dead until reload. Container keys are excluded the same way.
      const currentKey = getCurrentFocusKey();
      if (currentKey && !CONTAINER_KEYS.has(currentKey) && doesFocusableExist(currentKey)) {
        doneRef.current = true;
        return;
      }
      const target = priorityKeys.find((key) => doesFocusableExist(key));
      if (target) {
        doneRef.current = true;
        setFocus(target);
        return;
      }
      if (attempts++ < 60) {
        setTimeout(tryFocus, 150);
      }
    };

    const timer = setTimeout(tryFocus, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysKey, isSpatial]);
}
