"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getConfig } from "@/lib/constants/config";
import { api } from "@/lib/api";
import type { CdnPlayerProps } from "@/components/player";

// Lazy-load the CdnPlayer — it's heavy (hls.js, etc.) and only needed when the
// user actually clicks "Watch".  The dynamic import keeps the detail / season
// pages lightweight.
const CdnPlayer = dynamic(
  () => import("@/components/player").then((m) => m.CdnPlayer),
  { ssr: false },
);

interface WatchPageClientProps {
  type: "movie" | "tv";
  tmdbId: number;
  season?: number;
  episode?: number;
  imdbId?: string;
  kpId?: number;
}

export default function WatchPageClient({
  type,
  tmdbId,
  season,
  episode,
  imdbId,
  kpId,
}: WatchPageClientProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialSeekDone, setInitialSeekDone] = useState(false);
  const progressRef = useRef(0);

  const apiUrl = getConfig().apiUrl;

  // ── Resume: seek to saved position once the video is ready ──
  useEffect(() => {
    if (initialSeekDone) return;
    const container = containerRef.current;
    if (!container) return;

    const trySeek = () => {
      const video = container.querySelector("video");
      if (!video || !isFinite(video.duration) || video.duration <= 0) return false;
      if (progressRef.current > 0 && progressRef.current < 95) {
        const seekTo = (progressRef.current / 100) * video.duration;
        if (isFinite(seekTo) && seekTo > 0) {
          video.currentTime = seekTo;
        }
      }
      setInitialSeekDone(true);
      return true;
    };

    // Poll until the video element exists and has a duration
    const interval = setInterval(() => {
      if (trySeek()) clearInterval(interval);
    }, 300);

    // Also try immediately
    trySeek();

    return () => clearInterval(interval);
  }, [initialSeekDone]);

  // ── Progress saving ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let saveTimer: ReturnType<typeof setInterval> | null = null;
    let videoEl: HTMLVideoElement | null = null;

    const startTracking = () => {
      if (cancelled || !videoEl) return;

      const save = () => {
        if (cancelled || !videoEl) return;
        const { currentTime, duration } = videoEl;
        if (!duration || !isFinite(duration) || duration <= 0) return;
        const pct = Math.min(99, Math.max(0, Math.round((currentTime / duration) * 100)));
        progressRef.current = pct;
        if (pct > 0) {
          api.user
            .upsertProgress({
              mediaId: tmdbId,
              mediaType: type,
              season: season ?? undefined,
              episode: episode ?? undefined,
              progress: pct,
            })
            .catch(() => {});
        }
      };

      saveTimer = setInterval(save, 15000);

      // Also save on seeked, pause, and beforeunload
      const onSeeked = () => save();
      const onPause = () => save();
      const onUnload = () => save();

      videoEl.addEventListener("seeked", onSeeked);
      videoEl.addEventListener("pause", onPause);
      window.addEventListener("beforeunload", onUnload);

      // Cleanup helpers stored on the video element for cleanup
      const cleanupMap = videoEl as HTMLVideoElement & { __nwCleanup?: () => void };
      cleanupMap.__nwCleanup = () => {
        videoEl?.removeEventListener("seeked", onSeeked);
        videoEl?.removeEventListener("pause", onPause);
        window.removeEventListener("beforeunload", onUnload);
      };
    };

    // Find the <video> element once it appears
    const interval = setInterval(() => {
      if (cancelled) { clearInterval(interval); return; }
      const v = container.querySelector("video");
      if (v && v !== videoEl) {
        videoEl = v;
        clearInterval(interval);
        startTracking();
      }
    }, 500);

    return () => {
      cancelled = true;
      if (saveTimer) clearInterval(saveTimer);
      const cleanupMap = videoEl as HTMLVideoElement & { __nwCleanup?: () => void };
      if (videoEl && cleanupMap.__nwCleanup) {
        cleanupMap.__nwCleanup();
      }
      // Final save on unmount
      if (videoEl) {
        const { currentTime, duration } = videoEl;
        if (duration && isFinite(duration) && duration > 0) {
          const pct = Math.min(99, Math.max(0, Math.round((currentTime / duration) * 100)));
          if (pct > 0) {
            api.user
              .upsertProgress({
                mediaId: tmdbId,
                mediaType: type,
                season: season ?? undefined,
                episode: episode ?? undefined,
                progress: pct,
              })
              .catch(() => {});
          }
        }
      }
    };
  }, [tmdbId, type, season, episode]);

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${type}/${tmdbId}`);
    }
  }, [router, type, tmdbId]);

  // Determine which identifier to pass to CdnPlayer
  const playerProps: Partial<CdnPlayerProps> = {
    apiUrl,
    mediaType: type,
    tmdbId,
    onClose: handleClose,
  };
  if (imdbId) playerProps.imdbId = imdbId;
  else if (kpId) playerProps.kpId = kpId;

  if (type === "tv") {
    if (season != null) playerProps.season = season;
    if (episode != null) playerProps.episode = episode;
  }

  return (
    <div
      ref={containerRef}
      className="watch-container"
    >
      <CdnPlayer {...(playerProps as CdnPlayerProps)} />
    </div>
  );
}
