"use client";

import { useEffect, useState } from "react";

// YouTube oEmbed returns 401 for age-restricted videos and 404 for private /
// unavailable ones, so a failing probe means "restricted" without an API key.
// The endpoint is CORS-enabled, so this works directly from the browser.
const embeddableCache = new Map<string, boolean>();

async function isEmbeddable(yid: string): Promise<boolean> {
  const cached = embeddableCache.get(yid);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${yid}&format=json`,
      { headers: { accept: "application/json" } },
    );
    const ok = res.ok;
    embeddableCache.set(yid, ok);
    return ok;
  } catch {
    embeddableCache.set(yid, false);
    return false;
  }
}

/** Returns only the trailer ids that are publicly viewable (not restricted). */
export function useEmbeddableTrailers(yids: string[]): string[] {
  const [available, setAvailable] = useState<string[]>([]);
  const yidKey = yids.join("|");

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      yids.map(async (yid) => ((await isEmbeddable(yid)) ? yid : null)),
    ).then((results) => {
      if (cancelled) return;
      setAvailable(results.filter((x): x is string => x !== null));
    });

    return () => {
      cancelled = true;
    };
  }, [yidKey, yids]);

  return available;
}
