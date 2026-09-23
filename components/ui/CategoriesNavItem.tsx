"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useFocusable, FocusContext, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { CategoryItem, CategorySection } from "@/lib/api/types";
import { getHomeCategories, setHomeCategories } from "@/lib/state/home-bootstrap";
import { CONTENT_FOCUS_KEY } from "@/components/Header";
import { markHeaderNav } from "@/lib/state/navigation-source";
import { cx } from "@/lib/utils/cx";

const TRIGGER_KEY   = "NAVBAR_CATEGORIES";
const DROPDOWN_KEY  = "NAVBAR_CATEGORIES_DROPDOWN";
const GENRES_SECTION = "Genres";

// Prefix for each genre item focusKey
const genreKey = (id: string) => `CAT_GENRE_${id}`;

function CategoryLink({
  id, label, onSelect, isLast,
}: {
  id: string; label: string; onSelect: () => void; isLast: boolean;
}) {
  const { ref, focused } = useFocusable({
    focusKey: genreKey(id),
    onEnterPress: () => {
      markHeaderNav(`/categories/${id}`);
      (ref.current as HTMLAnchorElement | null)?.click();
      onSelect();
    },    onArrowPress: (dir) => {
      // Bottom row + down → go to content
      if (dir === "down" && isLast) {
        setFocus(CONTENT_FOCUS_KEY);
        onSelect();
        return false;
      }
      return true;
    },
  });

  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={`/categories/${id}`}
      className={`categories-nav__item${focused ? " categories-nav__item--focused" : ""}`}
      onClick={() => {
        markHeaderNav(`/categories/${id}`);
        onSelect();
      }}
    >
      {label}
    </Link>
  );
}

function DropdownContent({ genres, onClose }: { genres: CategoryItem[]; onClose: () => void }) {
  const half = Math.ceil(genres.length / 2);
  const { ref, focusKey } = useFocusable({
    focusKey: DROPDOWN_KEY,
    trackChildren: true,
    isFocusBoundary: false,
    onBlur: () => {
      // Focus left the dropdown entirely — close it
      onClose();
    },
  });
  const { t } = useI18n();

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="categories-nav__dropdown">
        <p className="categories-nav__heading">{t.nav.categories}</p>
        <div className="categories-nav__grid">
          {[genres.slice(0, half), genres.slice(half)].map((col, ci) => (
            <ul key={ci} className="categories-nav__col">
              {col.map((g, i) => (
                <li key={g.id}>
                  <CategoryLink id={g.id} label={g.name} onSelect={onClose} isLast={i === col.length - 1} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </FocusContext.Provider>
  );
}

export function CategoriesNavItem({ active = false }: { active?: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const language = toApiLanguage(locale);

  // Lazy: only hit the API when the menu opens, and prefer the home bootstrap
  // snapshot so the first open after landing on / is free.
  const [sections, setSections] = useState<CategorySection[] | null>(
    () => getHomeCategories(language),
  );
  const genres = useMemo(
    () => sections?.find((s) => s.section === GENRES_SECTION)?.items ?? [],
    [sections],
  );

  useEffect(() => {
    if (!open) return;
    if (getHomeCategories(language) || sections) return;
    let cancelled = false;
    api.categories.list(language)
      .then((next) => {
        if (cancelled) return;
        setHomeCategories(language, next);
        setSections(next);
      })
      .catch(() => { /* keep empty */ });
    return () => { cancelled = true; };
  }, [open, language, sections]);

  const { ref: triggerRef, focused: triggerFocused } = useFocusable({
    focusKey: TRIGGER_KEY,
    // Enter → open the categories page (like a plain nav link).
    onEnterPress: () => {
      markHeaderNav("/categories");
      router.push("/categories");
    },
    // Down → open the dropdown and focus the first genre.
    onArrowPress: (dir) => {
      if (dir === "down") {
        setOpen(true);
        return false;
      }
      return true;
    },
  });

  // Focus the first genre once the dropdown is open and the list is loaded.
  useEffect(() => {
    if (open && genres.length > 0) {
      const timer = setTimeout(() => setFocus(genreKey(genres[0].id)), 40);
      return () => clearTimeout(timer);
    }
  }, [open, genres]);

  const close = () => {
    setOpen(false);
    setFocus(TRIGGER_KEY);
  };

  const show = () => { if (timerRef.current) clearTimeout(timerRef.current); setOpen(true); };
  const hide = () => { timerRef.current = setTimeout(() => setOpen(false), 120); };

  return (
    <div className="categories-nav" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        className={cx(
          "site-header__nav-link",
          "categories-nav__trigger",
          active && "site-header__nav-link--active",
          open && "categories-nav__trigger--open",
          triggerFocused && "site-header__nav-link--focused",
        )}
        onClick={() => {
          // Mouse click → open the categories page.
          setOpen(false);
          markHeaderNav("/categories");
          router.push("/categories");
        }}
      >
        {t.nav.categories}
        <ChevronDown size={13} className={`categories-nav__chevron${open ? " categories-nav__chevron--open" : ""}`} />
      </button>

      {open && genres.length > 0 && <DropdownContent genres={genres} onClose={close} />}
    </div>
  );
}
