"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

const InputModeContext = createContext(false);

// TV/remote or keyboard navigation (spatial mode) vs mouse/touch.
// Spatial mode is the default on coarse-pointer TVs (large screens), and can be
// entered on any device by pressing arrow/Enter keys. Phones stay in touch mode.

const SPATIAL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  "Escape",
  "Backspace",
]);

let isSpatial = false;

const getSnapshot = () => isSpatial;

function isTvLikeDevice() {
  // Phones also report pointer:coarse — only treat large coarse-pointer
  // screens (TVs / set-top boxes) as spatial by default.
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(min-width: 960px)").matches
  );
}

function subscribe(onStoreChange: () => void) {
  isSpatial = isTvLikeDevice();
  onStoreChange();

  const onKeyDown = (e: KeyboardEvent) => {
    if (SPATIAL_KEYS.has(e.key)) {
      isSpatial = true;
      onStoreChange();
    }
  };

  const onPointerMove = () => {
    isSpatial = false;
    onStoreChange();
  };
  const onPointerDown = () => {
    isSpatial = false;
    onStoreChange();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
  };
}

export function InputModeProvider({ children }: { children: ReactNode }) {
  const spatial = useSyncExternalStore(subscribe, getSnapshot, () => false);

  useEffect(() => {
    document.documentElement.dataset.inputMode = spatial ? "spatial" : "mouse";
  }, [spatial]);

  return (
    <InputModeContext.Provider value={spatial}>{children}</InputModeContext.Provider>
  );
}

export function useInputMode() {
  return useContext(InputModeContext);
}
