"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { useCardNavigation } from "@/lib/hooks/use-card-navigation";
import { CastCardSkeleton } from "@/components/skeletons/CastCardSkeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { onCardKeyDown } from "@/lib/utils/keyboard";
import { cx } from "@/lib/utils/cx";
import type { CastMember } from "@/lib/api/types";

interface CastCardProps {
  member?: CastMember;
  focusKey?: string;
}

function CastCardReal({ member, focusKey }: { member: CastMember; focusKey?: string }) {
  const router = useRouter();
  const { ref, focused } = useCardNavigation({
    focusKey,
    onEnterPress: () => router.push(`/person/${member.id}`),
  });
  const href = `/person/${member.id}`;

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={cx("cast-card", focused && "cast-card--focused")}
      onClick={() => router.push(href)}
      onKeyDown={(e) => onCardKeyDown(e, () => router.push(href))}
      style={{ cursor: "pointer" }}
    >
      <div className="cast-card__avatar">
        <SmartImage
          src={member.profile}
          alt={member.name}
          className="cast-card__avatar-img"
          loadedClassName="cast-card__avatar-img--loaded"
          fallback={
            <div className="cast-card__avatar-fallback" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          }
          draggable={false}
          decoding="async"
        />
      </div>

      <p className="cast-card__name">{member.name}</p>
      {member.character && (
        <p className="cast-card__role">{member.character}</p>
      )}
    </div>
  );
}

export const CastCard = memo(function CastCard({ member, focusKey }: CastCardProps) {
  if (!member) return <CastCardSkeleton />;
  return <CastCardReal member={member} focusKey={focusKey} />;
});
