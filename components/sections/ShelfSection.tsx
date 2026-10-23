import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { Skeleton } from "@/components/ui/Skeleton";

interface ShelfSectionProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  visible?: boolean;
  href?: string;
  subtitle?: string;
  focusKey?: string;
  /** When false the section is not a spatial-navigation target (e.g. 0 items). */
  navigable?: boolean;
}

export function ShelfSection({
  title,
  children,
  loading = false,
  visible = true,
  href,
  subtitle,
  focusKey,
  navigable = true,
}: ShelfSectionProps) {
  if (!visible) return null;

  return (
    <section className="shelf-section" data-shelf>
      <div className="shelf-section__header">
        {loading && !title ? (
          <Skeleton className="shelf-section__title-skeleton" />
        ) : href && !loading ? (
          <Link href={href} className="shelf-section__title-link">
            <h2 className="shelf-section__title">{title}</h2>
            <ChevronRight size={18} className="shelf-section__title-arrow" />
          </Link>
        ) : (
          <h2 className="shelf-section__title">{title}</h2>
        )}
        {subtitle && !loading && (
          <p className="shelf-section__subtitle">{subtitle}</p>
        )}
      </div>
      <ScrollRow focusKey={focusKey} navigable={!loading && navigable}>{children}</ScrollRow>
    </section>
  );
}
