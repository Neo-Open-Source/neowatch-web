"use client";

import { createContext, useContext, type ReactNode } from "react";
import { NAVBAR_SEARCH_FOCUS_KEY } from "@/components/Header";

/**
 * Ordered list of focus targets used when a card navigates "up" past the
 * top row of its grid. Pages register their own targets (filters, detail-page
 * hero actions, ...) instead of the card hook knowing about specific pages.
 */
const DEFAULT_UP_TARGETS: string[] = [NAVBAR_SEARCH_FOCUS_KEY];

const UpTargetsContext = createContext<string[]>(DEFAULT_UP_TARGETS);

export function UpTargetsProvider({
  targets,
  children,
}: {
  targets: string[];
  children: ReactNode;
}) {
  return (
    <UpTargetsContext.Provider value={targets}>{children}</UpTargetsContext.Provider>
  );
}

export function useUpTargets() {
  return useContext(UpTargetsContext);
}
