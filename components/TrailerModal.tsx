"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: unknown) => YouTubePlayer;
      PlayerState: { UNSTARTED: number; CUED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  playVideo: () => void;
  mute: () => void;
  setVolume: (v: number) => void;
  getPlayerState: () => number | undefined;
  destroy: () => void;
}

interface TrailerModalProps {
  youtubeId: string;
  title?: string;
  onClose: () => void;
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (typeof window !== "undefined" && window.YT?.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function TrailerModal({ youtubeId, title, onClose }: TrailerModalProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [apiFailed, setApiFailed] = useState(false);
  // The YouTube embed paints white while its page loads. A video-frame poster
  // covers that flash; it is removed once the player reports ready. The player
  // itself always renders underneath, so hiding the flash can never block
  // playback (hiding the holder with opacity did).
  const [playerReady, setPlayerReady] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  // Safety net: drop the poster even if the player never reports ready
  // (restricted embed, network hiccup) so YouTube's own error UI surfaces.
  useEffect(() => {
    const t = setTimeout(() => setPlayerReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Close on ESC / Backspace and on the browser/remote "back" button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    history.pushState({ trailerModal: true }, "");
    const onPopState = () => onClose();
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
      if (history.state?.trailerModal) history.back();
    };
  }, [onClose]);

  // YouTube IFrame Player API — the only reliable way to force autoplay.
  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !holderRef.current) return;
        if (!window.YT?.Player) {
          setApiFailed(true);
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _player = new window.YT.Player(holderRef.current, {
          videoId: youtubeId,
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            controls: 1,
          },
          events: {
            onReady: (e: { target: YouTubePlayer }) => {
              playerRef.current = e.target;
              setPlayerReady(true);
              try {
                e.target.setVolume(100);
                e.target.playVideo();
                // If the browser blocks unmuted autoplay, the video stays
                // unstarted — muted autoplay is allowed everywhere, retry it.
                setTimeout(() => {
                  try {
                    const st = e.target.getPlayerState();
                    if (st === window.YT!.PlayerState.UNSTARTED || st === window.YT!.PlayerState.CUED) {
                      e.target.mute();
                      e.target.playVideo();
                    }
                  } catch {
                    /* ignore */
                  }
                }, 900);
              } catch {
                /* ignore */
              }
            },
          },
        });
      })
      .catch(() => setApiFailed(true));

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [youtubeId]);

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-[200] bg-black/88 flex items-center justify-center p-6 animate-[detail-fade-in_150ms_ease]"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Trailer"}
      onMouseDown={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="relative w-full max-w-[1040px]"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute left-1/2 -translate-x-1/2 -top-12 z-10 w-10 h-10 border-0 bg-transparent text-white text-2xl leading-none flex items-center justify-center cursor-pointer drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)] hover:opacity-80 transition-opacity"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
          {apiFailed ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0`}
              title={title ?? "Trailer"}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={() => setPlayerReady(true)}
              className="w-full h-full border-0 block"
            />
          ) : (
            <div ref={holderRef} className="w-full h-full" />
          )}

          {!playerReady && !posterFailed && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                alt=""
                className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none"
                onError={() => setPosterFailed(true)}
                draggable={false}
                decoding="async"
                fetchPriority="high"
              />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
