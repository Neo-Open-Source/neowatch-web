"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/context/i18n-context";
import { getConfig } from "@/lib/constants/config";
import { cx } from "@/lib/utils/cx";

export interface KodikSelection {
  season?: number;
  episode?: number;
}

export interface KodikControls {
  seasons: { number: number; episodes: number[] }[];
  initial: KodikSelection;
  onChange: (selection: KodikSelection) => Promise<string | null>;
}

interface WatchModalProps {
  url: string;
  title: string;
  kodik?: KodikControls;
  onClose: () => void;
}

type MenuName = "season" | "episode";

export function WatchModal({ url, title, kodik, onClose }: WatchModalProps) {
  const { t } = useI18n();
  const [src, setSrc] = useState(url);
  const [selection, setSelection] = useState<KodikSelection | undefined>(kodik?.initial);
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "Backspace") return;
      e.preventDefault();
      if (openMenu) {
        setOpenMenu(null);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, openMenu]);

  useEffect(() => {
    history.pushState({ watchModal: true }, "");
    const onPopState = () => onClose();
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      if (history.state?.watchModal) history.back();
    };
  }, [onClose]);

  const currentSeason =
    kodik?.seasons.find((item) => item.number === selection?.season) ?? kodik?.seasons[0];
  const currentEpisode = currentSeason?.episodes.includes(selection?.episode ?? -1)
    ? selection?.episode
    : currentSeason?.episodes[0];

  const apply = async (next: KodikSelection) => {
    if (!kodik) return;
    setSelection(next);
    setOpenMenu(null);
    setBusy(true);
    setError(null);
    try {
      const nextUrl = await kodik.onChange(next);
      if (!nextUrl) {
        setError(t.detail.watchError);
        return;
      }
      setSrc(nextUrl);
    } catch {
      setError(t.detail.watchError);
    } finally {
      setBusy(false);
    }
  };

  const chooseSeason = (seasonNumber: number) => {
    if (!selection) return;
    const season = kodik?.seasons.find((item) => item.number === seasonNumber);
    void apply({
      ...selection,
      season: seasonNumber,
      episode: season?.episodes[0],
    });
  };

  const chooseEpisode = (episodeNumber: number) => {
    if (!selection) return;
    void apply({ ...selection, episode: episodeNumber });
  };

  const menuButton = (menu: MenuName, label: string) => (
    <div className="watch-modal__menu">
      <button
        type="button"
        className={cx("watch-modal__menu-trigger", openMenu === menu && "watch-modal__menu-trigger--open")}
        aria-expanded={openMenu === menu}
        aria-haspopup="listbox"
        onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
      >
        <span className="watch-modal__menu-label">{label}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {openMenu === menu && (
        <div className="watch-modal__popover" role="listbox">
          {menu === "season" &&
            kodik?.seasons.map((item) => (
              <button
                key={item.number}
                type="button"
                role="option"
                aria-selected={item.number === currentSeason?.number}
                className={cx(
                  "watch-modal__popover-option",
                  item.number === currentSeason?.number && "watch-modal__popover-option--active",
                )}
                onClick={() => chooseSeason(item.number)}
              >
                {t.detail.season} {item.number}
              </button>
            ))}

          {menu === "episode" &&
            currentSeason?.episodes.map((item) => (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={item === currentEpisode}
                className={cx(
                  "watch-modal__popover-option",
                  item === currentEpisode && "watch-modal__popover-option--active",
                )}
                onClick={() => chooseEpisode(item)}
              >
                {t.detail.watchEpisode} {item}
              </button>
            ))}
        </div>
      )}
    </div>
  );

  const resolvedSrc = src.startsWith("/") ? `${getConfig().apiUrl}${src}` : src;

  const handleBackdropClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;
    if (!panel) {
      onClose();
      return;
    }
    const rect = panel.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left - 24 &&
      e.clientX <= rect.right + 24 &&
      e.clientY >= rect.top - 64 &&
      e.clientY <= rect.bottom + 24;
    if (!inside) onClose();
  };

  return createPortal(
    <div className="watch-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="watch-modal__backdrop"
        aria-label={t.a11y.close}
        onClick={handleBackdropClick}
      />
      <div ref={panelRef} className="watch-modal__panel">
        <div className="watch-modal__header">
          <div className="watch-modal__toolbar">
            {kodik && kodik.seasons.length > 0 &&
              menuButton("season", `${t.detail.season} ${currentSeason?.number ?? ""}`)}
            {kodik && currentSeason && currentSeason.episodes.length > 0 &&
              menuButton("episode", `${t.detail.watchEpisode} ${currentEpisode ?? ""}`)}
            {busy && <Loader2 size={16} className="watch-modal__spinner" aria-hidden="true" />}
          </div>

          <button
            type="button"
            className="watch-modal__close"
            onClick={onClose}
            aria-label={t.a11y.close}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {error && <p className="watch-modal__error" role="alert">{error}</p>}

        <div className="watch-modal__frame">
          <iframe
            src={resolvedSrc}
            title={title}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
