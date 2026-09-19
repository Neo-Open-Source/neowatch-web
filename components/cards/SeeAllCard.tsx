"use client";

import { memo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { getConfig } from "@/lib/constants/config";
import { cx } from "@/lib/utils/cx";

interface SeeAllCardProps {
  href: string;
  focusKey?: string;
  /** Match the row's card shape: poster rows (2/3) or square studio rows. */
  variant?: "poster" | "studio";
}

export const SeeAllCard = memo(function SeeAllCard({ href, focusKey, variant = "poster" }: SeeAllCardProps) {
  const { t } = useI18n();
  const { showHitboxes } = getConfig();

  const { ref, focused } = useCardNavigation({
    focusKey,
    onEnterPress: () => {
      (ref.current as HTMLAnchorElement | null)?.click();
    },
  });

  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={href}
      className={cx(
        "see-all-card",
        variant === "studio" ? "see-all-card--studio" : "see-all-card--poster",
        focused && "see-all-card--focused",
        showHitboxes && "see-all-card--hitbox",
      )}
    >
      <div className="see-all-card__box">
        <ChevronRight size={26} className="see-all-card__arrow" aria-hidden="true" />
        <span className="see-all-card__label">{t.home.seeAll}</span>
        {focused && <div className="see-all-card__focus-indicator" aria-hidden="true" />}
      </div>
    </Link>
  );
});
