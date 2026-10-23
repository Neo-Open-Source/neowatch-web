"use client";

import { memo, useState } from "react";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { SmartImage } from "@/components/ui/SmartImage";
import { onCardKeyDown } from "@/lib/utils/keyboard";
import { cx } from "@/lib/utils/cx";
import { TrailerModal } from "@/components/TrailerModal";

interface TrailerCardProps {
  youtubeId: string;
  title?: string;
  focusKey?: string;
}

export const TrailerCard = memo(function TrailerCard({ youtubeId, title, focusKey }: TrailerCardProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { ref, focused } = useCardNavigation({ focusKey, onEnterPress: () => setOpen(true) });

  return (
    <>
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        className={cx(
          "trailer-card flex-shrink-0 w-[260px] cursor-pointer outline-none rounded-[10px] overflow-hidden bg-nw-surface border border-white/15 transition-transform duration-150",
          focused && "trailer-card--focused",
        )}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => onCardKeyDown(e, () => setOpen(true))}
      >
        <div className="relative">
          <SmartImage
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt={title ?? t.detail.watchTrailer}
            className="w-full aspect-video object-cover block transition-opacity duration-300 opacity-0"
            loadedClassName="opacity-100"
            draggable={false}
            decoding="async"
          />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/50">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          {focused && <div className="trailer-card__focus-indicator" aria-hidden="true" />}
        </div>
        {title && (
          <p className="m-0 px-2.5 py-2 text-[12px] font-medium text-nw-text truncate bg-nw-surface">
            {title}
          </p>
        )}
      </div>

      {open && <TrailerModal youtubeId={youtubeId} title={title} onClose={() => setOpen(false)} />}
    </>
  );
});
