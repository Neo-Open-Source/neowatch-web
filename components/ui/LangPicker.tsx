"use client";

import { useState, useRef, useEffect, useLayoutEffect, startTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFocusable, FocusContext, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { hreflangOf, type Locale } from "@/lib/i18n";
import { cx } from "@/lib/utils/cx";

const FOCUS_KEY_LANG_TRIGGER  = "NAVBAR_LANG";
const FOCUS_KEY_LANG_DROPDOWN = "NAVBAR_LANG_DROPDOWN";

function LangOption({
  code, label, flag, active, onSelect,
}: {
  code: string; label: string; flag: string; active: boolean; onSelect: () => void;
}) {
  const { ref, focused } = useFocusable({
    focusKey: `LANG_OPT_${code}`,
    onEnterPress: onSelect,
  });
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-current={active ? "true" : undefined}
      className={cx(
        "lang-picker__option",
        active && "lang-picker__option--active",
        focused && "lang-picker__option--focused",
      )}
      onClick={onSelect}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flag} alt="" className="lang-picker__flag" width={18} height={18} draggable={false} />
      <span>{label}</span>
    </button>
  );
}

function LangDropdown({
  onClose,
  onSelect,
  anchor,
}: {
  onClose: () => void;
  onSelect: (code: Locale) => void;
  anchor: DOMRect;
}) {
  const { locale, languages } = useI18n();
  const { ref, focusKey } = useFocusable({
    focusKey: FOCUS_KEY_LANG_DROPDOWN,
    trackChildren: true,
    onBlur: () => onClose(),
  });

  const minWidth = 120;
  const left = Math.min(
    Math.max(8, anchor.right - minWidth),
    typeof window !== "undefined" ? window.innerWidth - minWidth - 8 : 8,
  );
  const top = anchor.bottom + 6;

  useEffect(() => {
    const active =
      document.querySelector<HTMLElement>(".lang-picker__dropdown .lang-picker__option--active") ??
      document.querySelector<HTMLElement>(".lang-picker__dropdown .lang-picker__option");
    active?.focus();
  }, []);

  return (
    <FocusContext.Provider value={focusKey}>
      <ul
        ref={ref as React.RefObject<HTMLUListElement>}
        className="lang-picker__dropdown lang-picker__dropdown--portal"
        style={{ top, left, minWidth }}
      >
        {languages.map((lang) => (
          <li key={lang.code}>
            <LangOption
              code={lang.code}
              label={lang.label}
              flag={lang.flag}
              active={lang.code === locale}
              onSelect={() => onSelect(lang.code as Locale)}
            />
          </li>
        ))}
      </ul>
    </FocusContext.Provider>
  );
}

export function LangPicker() {
  const { locale, t, languages, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { startTransition(() => setMounted(true)); }, []);

  const syncAnchor = () => {
    const el = rootRef.current;
    if (el) setAnchor(el.getBoundingClientRect());
  };

  useLayoutEffect(() => {
    if (!open) return;
    syncAnchor();
    const onReposition = () => syncAnchor();
    window.addEventListener("resize", onReposition);
    const root = document.querySelector("[data-scroll-root]");
    root?.addEventListener("scroll", onReposition, { passive: true });
    window.addEventListener("scroll", onReposition, { passive: true });
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition);
      root?.removeEventListener("scroll", onReposition);
    };
  }, [open]);

  const { ref: triggerRef, focused: triggerFocused } = useFocusable({
    focusKey: FOCUS_KEY_LANG_TRIGGER,
    onEnterPress: () => {
      setOpen((v) => {
        if (!v) setTimeout(() => setFocus(`LANG_OPT_${locale}`), 50);
        return !v;
      });
    },
    onArrowPress: (dir) => {
      if (dir === "down" && !open) {
        setOpen(true);
        setTimeout(() => setFocus(`LANG_OPT_${locale}`), 50);
        return false;
      }
      return true;
    },
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((e.target as HTMLElement | null)?.closest?.(".lang-picker__dropdown")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setFocus(FOCUS_KEY_LANG_TRIGGER);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, triggerRef]);

  const current = languages.find((l) => l.code === locale) ?? languages[0];

  const handleSelect = (code: Locale) => {
    setOpen(false);
    setFocus(FOCUS_KEY_LANG_TRIGGER);
    triggerRef.current?.focus();
    // Switch instantly, then put the language into the URL (?lang=xx-XX) so
    // the server renders (and crawlers index) each language at its own URL.
    setLocale(code);
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", hreflangOf(code));
    // Keep the current scroll position — a language switch shouldn't jump
    // the page back to the top.
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openMenu = () => {
    syncAnchor();
    setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} className={`lang-picker${open ? " lang-picker--open" : ""}`}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        className={cx("lang-picker__trigger", triggerFocused && "lang-picker__trigger--focused")}
        aria-label={t.a11y.langPicker}
        aria-expanded={open}
        onClick={openMenu}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.flag}
          alt=""
          className="lang-picker__flag"
          width={22}
          height={22}
          draggable={false}
        />
        <span className="lang-picker__label">{current.label}</span>
        <ChevronDown size={13} className={`lang-picker__chevron${open ? " lang-picker__chevron--open" : ""}`} />
      </button>

      {open && mounted && anchor && createPortal(
        <LangDropdown
          anchor={anchor}
          onClose={() => { setOpen(false); setFocus(FOCUS_KEY_LANG_TRIGGER); }}
          onSelect={handleSelect}
        />,
        document.body,
      )}
    </div>
  );
}
