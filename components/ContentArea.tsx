"use client";

import type { ReactNode } from "react";
import { FocusContext, useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { CONTENT_FOCUS_KEY } from "@/components/Header";

export function ContentArea({ children }: { children: ReactNode }) {
  const { ref, focusKey } = useFocusable({
    focusKey: CONTENT_FOCUS_KEY,
    trackChildren: true,
    // Deliberately OFF: with it on, removing a focused card during SPA
    // navigation schedules a debounced restore to CONTENT, and a live container
    // without a focused child then blocks initial focus (dead arrows).
    autoRestoreFocus: false,
    isFocusBoundary: true,
    focusBoundaryDirections: ["down"],
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <main ref={ref} className="flex-1 page content-scroll" data-scroll-root>
        {children}
      </main>
    </FocusContext.Provider>
  );
}
