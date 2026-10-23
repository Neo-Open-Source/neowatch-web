"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, LogIn, LogOut, User } from "lucide-react";
import { FocusContext, useFocusable, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { SearchBar } from "@/components/ui/SearchBar";
import { LangPicker } from "@/components/ui/LangPicker";
import { CategoriesNavItem } from "@/components/ui/CategoriesNavItem";
import { useI18n } from "@/lib/context/i18n-context";
import { useAuth } from "@/lib/context/auth-context";
import { markHeaderNav } from "@/lib/state/navigation-source";
import { cx, isActivePath } from "@/lib/utils/cx";

export const NAVBAR_FOCUS_KEY   = "NAVBAR";
export const NAVBAR_SEARCH_FOCUS_KEY = "NAVBAR_SEARCH";
export const CONTENT_FOCUS_KEY  = "CONTENT";

function FocusableLink({
  href,
  className,
  children,
  focusKey,
  active = false,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  focusKey?: string;
  active?: boolean;
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onArrowPress: (dir) => {
      if (dir === "down") { setFocus(CONTENT_FOCUS_KEY); return false; }
      return true;
    },
    onEnterPress: () => {
      markHeaderNav(href);
      (ref.current as HTMLAnchorElement | null)?.click();
    },
  });
  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={href}
      onClick={() => markHeaderNav(href)}
      aria-current={active ? "page" : undefined}
      className={cx(className, focused && `${className}--focused`, active && `${className}--active`)}
    >
      {children}
    </Link>
  );
}

function FocusableButton({
  className,
  onClick,
  children,
  focusKey,
  "aria-label": ariaLabel,
}: {
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
  focusKey?: string;
  "aria-label"?: string;
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onArrowPress: (dir) => {
      if (dir === "down") { setFocus(CONTENT_FOCUS_KEY); return false; }
      return true;
    },
    onEnterPress: onClick,
  });
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={cx(className, focused && `${className}--focused`)}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function ProfileMenu() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = user?.displayName || user?.email || t.nav.profile;

  return (
    <div className="site-header__profile" ref={wrapRef}>
      <FocusableButton
        className="site-header__sign-in-btn site-header__sign-in-btn--avatar"
        focusKey="NAVBAR_PROFILE"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {user?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="site-header__avatar" draggable={false} />
        ) : (
          <User size={18} className="site-header__action-icon site-header__action-icon--sign-in" aria-hidden="true" />
        )}
      </FocusableButton>

      {open && (
        <div className="site-header__profile-menu nw-dropdown-anim">
          <p className="site-header__profile-name">{label}</p>
          <a
            href="https://id.neome.uk/profile"
            className="site-header__profile-item"
            onClick={() => setOpen(false)}
          >
            <User size={16} aria-hidden="true" />
            {t.nav.profile}
          </a>
          <button
            type="button"
            className="site-header__profile-item"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            <LogOut size={16} aria-hidden="true" />
            {t.nav.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { isAuthenticated, signIn, loading } = useAuth();

  const { ref, focusKey } = useFocusable({
    focusKey: NAVBAR_FOCUS_KEY,
    trackChildren: true,
    isFocusBoundary: true,
    focusBoundaryDirections: ["left", "right", "up"],
  });

  const isActive = (href: string) => isActivePath(pathname, href);

  const navLinks = [
    { label: t.nav.home,     href: "/",          focusKey: "NAVBAR_HOME" },
    { label: t.nav.popular,  href: "/popular",   focusKey: "NAVBAR_POPULAR" },
    { label: t.nav.topRated, href: "/top-rated", focusKey: "NAVBAR_TOP_RATED" },
  ];

  return (
    <FocusContext.Provider value={focusKey}>
      <header ref={ref} className="site-header" data-site-header>
        <div className="site-header__inner">

          <Link href="/" className="site-header__logo-link" onClick={() => markHeaderNav("/")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/neo-icon.png" alt="NeoWatch" draggable={false} className="neo-logo" />
          </Link>

          <SearchBar />

          <nav className="site-header__nav" aria-label={t.a11y.mainNav}>
            {navLinks.map(({ label, href, focusKey: fk }) => (
              <FocusableLink key={href} href={href} className="site-header__nav-link" focusKey={fk} active={isActive(href)}>
                {label}
              </FocusableLink>
            ))}
            <CategoriesNavItem active={isActive("/categories")} />
          </nav>

          <div className="site-header__actions">
            <LangPicker />
            <FocusableLink href="/watchlist" className="site-header__watchlist-btn" focusKey="NAVBAR_WATCHLIST" active={isActive("/watchlist")}>
              <Bookmark size={18} className="site-header__action-icon" fill={isActive("/watchlist") ? "currentColor" : "none"} />
              <span className="site-header__action-label">{t.nav.watchlist}</span>
            </FocusableLink>
            {isAuthenticated ? (
              <ProfileMenu />
            ) : (
              <FocusableButton
                className="site-header__sign-in-btn"
                focusKey="NAVBAR_SIGN_IN"
                aria-label={t.nav.signIn}
                onClick={() => { if (!loading) void signIn(); }}
              >
                <LogIn size={18} className="site-header__action-icon site-header__action-icon--sign-in" aria-hidden="true" />
                <span className="site-header__action-label">{t.nav.signIn}</span>
              </FocusableButton>
            )}
          </div>

        </div>
      </header>
      <div className="site-header-spacer" aria-hidden="true" />
    </FocusContext.Provider>
  );
}
