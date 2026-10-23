"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clapperboard, Flame, Star } from "lucide-react";
import { useI18n } from "@/lib/context/i18n-context";
import { markHeaderNav } from "@/lib/state/navigation-source";
import { isActivePath } from "@/lib/utils/cx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function MobileNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  const isActive = (href: string) => isActivePath(pathname, href);

  // Mirrors desktop nav — watchlist / auth stay in the header.
  const navItems: NavItem[] = [
    { label: t.nav.home, href: "/", icon: <Home size={22} strokeWidth={1.75} /> },
    { label: t.nav.categories, href: "/categories", icon: <Clapperboard size={22} strokeWidth={1.75} /> },
    { label: t.nav.popular, href: "/popular", icon: <Flame size={22} strokeWidth={1.75} /> },
    { label: t.nav.topRated, href: "/top-rated", icon: <Star size={22} strokeWidth={1.75} /> },
  ];

  return (
    <nav className="mobile-nav" aria-label={t.a11y.mobileNav}>
      <div className="mobile-nav__inner">
        {navItems.map(({ label, href, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => markHeaderNav(href)}
              className={`mobile-nav__item${active ? " mobile-nav__item--active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <span className="mobile-nav__icon">{icon}</span>
              <span className="mobile-nav__label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
