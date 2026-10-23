"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FocusContext, setFocus, useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { ChevronDown, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/context/i18n-context";
import { useInputMode } from "@/lib/context/input-mode";
import { cx } from "@/lib/utils/cx";
import type { KodikPlaylist, PlayerAvailability } from "@/lib/api/types";
import { WatchModal, type KodikControls, type KodikSelection } from "./WatchModal";

type Source = "kodik" | "alloha" | "collaps";

interface WatchActionsProps {
  mediaType: "movie" | "tv";
  tmdbId: number;
  kpId: number | null;
  imdbId: string | null;
  title: string;
  label: string;
}

interface ModalState {
  url: string;
  kodik?: KodikControls;
}

function mergeKodikSeasons(playlist: KodikPlaylist | null) {
  const episodesBySeason = new Map<number, Set<number>>();

  for (const result of playlist?.results ?? []) {
    for (const translation of result.translations) {
      for (const season of translation.seasons) {
        const episodes = episodesBySeason.get(season.number) ?? new Set<number>();
        for (const episode of season.episodes) episodes.add(episode.number);
        episodesBySeason.set(season.number, episodes);
      }
    }
  }

  return [...episodesBySeason.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, episodes]) => ({ number, episodes: [...episodes].sort((a, b) => a - b) }));
}

function SourceButton({
  focusKey,
  label,
  busy,
  disabled,
  focusable,
  onClick,
}: {
  focusKey: string;
  label: string;
  busy: boolean;
  disabled: boolean;
  focusable: boolean;
  onClick: () => void;
}) {
  const { ref, focused } = useFocusable({ focusKey, focusable, onEnterPress: onClick });
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={cx(
        "detail-watch__source",
        focused && "detail-watch__source--focused",
        busy && "detail-watch__source--busy",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {busy && <Loader2 size={13} className="detail-watch__spinner" aria-hidden="true" />}
      {label}
    </button>
  );
}

function WatchMainButton({
  label,
  busy,
  expanded,
  onPress,
}: {
  label: string;
  busy: boolean;
  expanded: boolean;
  onPress: () => void;
}) {
  const { ref, focused } = useFocusable({ focusKey: "detail-play", onEnterPress: onPress });

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      className={cx(
        "detail-hero-action detail-hero-action--primary detail-watch__main",
        (focused || expanded) && "detail-hero-action--active",
      )}
      onClick={onPress}
      aria-label={label}
      aria-expanded={expanded}
    >
      <span className="detail-hero-action__icon">
        {busy ? (
          <Loader2 size={18} className="detail-watch__spinner" aria-hidden="true" />
        ) : (
          <Play size={18} fill="currentColor" strokeWidth={0} />
        )}
      </span>
      <span className="detail-hero-action__label">{label}</span>
      <ChevronDown size={16} className="detail-watch__chevron" aria-hidden="true" />
    </button>
  );
}

export function WatchActions({
  mediaType,
  tmdbId,
  kpId,
  imdbId,
  title,
  label,
}: WatchActionsProps) {
  const { t } = useI18n();
  const isSpatial = useInputMode();
  const isTv = mediaType === "tv";

  const rootRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [tapExpanded, setTapExpanded] = useState(false);
  const [busySource, setBusySource] = useState<Source | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [availability, setAvailability] = useState<PlayerAvailability | null>(null);

  const { ref: groupRef, focusKey, hasFocusedChild } = useFocusable({
    focusKey: "DETAIL_WATCH_GROUP",
    trackChildren: true,
    preferredChildFocusKey: "detail-play",
  });

  const expanded = hovered || tapExpanded || hasFocusedChild;
  const canKodik = Boolean(kpId || imdbId);
  const canCollaps = Boolean(kpId || imdbId);
  const busy = busySource != null;

  useEffect(() => {
    let cancelled = false;
    api.players
      .availability({ kpId: kpId ?? undefined, tmdbId, imdbId: imdbId ?? undefined })
      .then((next) => {
        if (!cancelled) setAvailability(next);
      })
      .catch(() => {
        if (!cancelled) {
          setAvailability({ kodik: canKodik, alloha: true, collaps: canCollaps });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kpId, imdbId, tmdbId, canKodik, canCollaps]);

  const fetchKodikUrl = useCallback(
    async (selection: KodikSelection) => {
      if (!kpId && !imdbId) return null;
      const opts = isTv ? { season: selection.season, episode: selection.episode } : {};
      const response = kpId
        ? await api.players.kodikByKp(kpId, opts)
        : await api.players.kodikByImdb(imdbId!, opts);
      return response?.url ?? null;
    },
    [kpId, imdbId, isTv],
  );

  const startSource = useCallback(
    async (source: Source, seasonOverride?: number) => {
      if (busy) return;
      setBusySource(source);
      try {
        if (source === "kodik") {
          const playlist = await api.players.kodik({
            kpId: kpId ?? undefined,
            imdbId: imdbId ?? undefined,
          });
          const seasons = mergeKodikSeasons(playlist);
          const season =
            seasons.find((item) => item.number === seasonOverride) ?? seasons[0];
          const initial: KodikSelection = {
            season: season?.number,
            episode: season?.episodes[0],
          };
          const url = await fetchKodikUrl(initial);
          if (!url) throw new Error("No Kodik URL");

          setModal({
            url,
            kodik: { seasons, initial, onChange: fetchKodikUrl },
          });
        } else {
          const opts = isTv ? { season: seasonOverride ?? 1, episode: 1 } : {};
          let response;
          if (source === "alloha") {
            if (kpId) response = await api.players.allohaByKp(kpId, opts);
            else if (imdbId) response = await api.players.allohaByImdb(imdbId, opts);
            else response = await api.players.allohaByTmdb(tmdbId, opts);
          } else if (kpId) {
            response = await api.players.collapsByKp(kpId, opts);
          } else if (imdbId) {
            response = await api.players.collapsByImdb(imdbId, opts);
          }

          if (!response?.url) throw new Error("No player URL");
          setModal({ url: response.url });
        }
      } catch {
        toast.error(t.detail.watchError);
      } finally {
        setBusySource(null);
      }
    },
    [busy, kpId, imdbId, tmdbId, isTv, fetchKodikUrl, t.detail.watchError],
  );

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setTapExpanded(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const clearHoverClose = useCallback(() => {
    if (hoverTimeout.current !== null) {
      window.clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  }, []);

  useEffect(() => clearHoverClose, [clearHoverClose]);

  const handlePointerEnter = useCallback(() => {
    clearHoverClose();
    if (window.matchMedia("(hover: hover)").matches) setHovered(true);
  }, [clearHoverClose]);

  const handlePointerLeave = useCallback(() => {
    clearHoverClose();
    hoverTimeout.current = window.setTimeout(() => setHovered(false), 160);
  }, [clearHoverClose]);

  const sources = useMemo(
    () =>
      [
        { id: "kodik" as const, label: "Kodik", available: availability?.kodik },
        { id: "alloha" as const, label: "Alloha", available: availability?.alloha },
        { id: "collaps" as const, label: "Collaps", available: availability?.collaps },
      ].filter((source) => source.available),
    [availability],
  );

  const handleMainClick = useCallback(() => {
    if (busy) return;

    if (isSpatial) {
      const first = sources[0]?.id;
      if (hasFocusedChild && first) setFocus(`detail-source-${first}`);
      else setTapExpanded(true);
      return;
    }

    const canHover =
      typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
    if (!canHover && !tapExpanded) {
      setTapExpanded(true);
      return;
    }
    const first = sources[0]?.id;
    if (first) void startSource(first);
  }, [busy, hasFocusedChild, isSpatial, tapExpanded, startSource, sources]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={rootRef}
        className={cx("detail-watch", expanded && "detail-watch--expanded")}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div ref={groupRef as React.RefObject<HTMLDivElement>} className="detail-watch__pill">
          <WatchMainButton
            label={label}
            busy={busy}
            expanded={expanded}
            onPress={handleMainClick}
          />
        </div>

        <div className="detail-watch__sources" aria-hidden={!expanded}>
          {!availability ? (
            <div className="detail-watch__hint">
              <Loader2 size={14} className="detail-watch__spinner" aria-hidden="true" />
              {t.detail.watchLoading}
            </div>
          ) : sources.length === 0 ? (
            <div className="detail-watch__hint">{t.detail.watchUnavailable}</div>
          ) : (
            sources.map((source) => (
              <SourceButton
                key={source.id}
                focusKey={`detail-source-${source.id}`}
                label={source.label}
                busy={busySource === source.id}
                disabled={busy}
                focusable={expanded}
                onClick={() => {
                  setTapExpanded(true);
                  void startSource(source.id);
                }}
              />
            ))
          )}
        </div>
      </div>

      {modal && (
        <WatchModal
          url={modal.url}
          title={title}
          kodik={modal.kodik}
          onClose={() => setModal(null)}
        />
      )}
    </FocusContext.Provider>
  );
}
