"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useTopLoader } from "nextjs-toploader";
import { isDataLoading, subscribeDataLoading } from "@/lib/state/data-loading";

export function DataLoaderBar() {
  const loading = useSyncExternalStore(subscribeDataLoading, isDataLoading, () => false);
  const { start, done } = useTopLoader();
  const actionsRef = useRef({ start, done });

  useEffect(() => {
    actionsRef.current = { start, done };
  }, [start, done]);

  useEffect(() => {
    if (loading) actionsRef.current.start();
    else actionsRef.current.done(true);
  }, [loading]);

  return null;
}
