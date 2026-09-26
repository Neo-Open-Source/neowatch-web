"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import "@/lib/utils/spatial-nav-init";
import { setFocus, doesFocusableExist } from "@noriginmedia/norigin-spatial-navigation";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/context/i18n-context";
import { InputModeProvider } from "@/lib/context/input-mode";
import { AuthProvider } from "@/lib/context/auth-context";
import { GraphQLProvider } from "@/lib/graphql/provider";
import { NAVBAR_SEARCH_FOCUS_KEY, CONTENT_FOCUS_KEY } from "@/components/Header";
import { getReturnFocusKey } from "@/lib/state/focus-return";
import { consumeHeaderNav } from "@/lib/state/navigation-source";
import { useScrollRestore } from "@/lib/hooks/use-scroll-restoration";
import type { Locale } from "@/lib/i18n";

const BACK_KEY_CODES = new Set([
  "Escape",
  "GoBack",
  "BrowserBack",
  "XF86Back",
]);

function useEscapeToNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const cameFromHeaderRef = useRef(false);
  useEffect(() => {
    pathnameRef.current = pathname;
    cameFromHeaderRef.current = consumeHeaderNav(pathname);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!BACK_KEY_CODES.has(e.key)) return;

      const active = document.activeElement;
      const navbar = document.querySelector("[data-site-header]");

      if (navbar?.contains(active)) {
        const returnKey = getReturnFocusKey();
        e.preventDefault();
        if (returnKey && doesFocusableExist(returnKey)) {
          setFocus(returnKey);
        } else {
          setFocus(CONTENT_FOCUS_KEY);
        }
        return;
      }

      if (document.querySelector('[role="dialog"]')) return;
      if (pathnameRef.current !== "/") {
        e.preventDefault();
        if (cameFromHeaderRef.current) {
          setFocus(NAVBAR_SEARCH_FOCUS_KEY);
          return;
        }
        if (window.history.length > 1) {
          router.back();
        } else {
          router.replace("/");
        }
        return;
      }

      e.preventDefault();
      setFocus(NAVBAR_SEARCH_FOCUS_KEY);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  useEscapeToNavbar();
  useScrollRestore();

  return (
    <InputModeProvider>
      <I18nProvider initialLocale={initialLocale}>
        <AuthProvider>
          <GraphQLProvider>{children}</GraphQLProvider>
        </AuthProvider>
      </I18nProvider>
      <Toaster
        theme="dark"
        richColors
        position="bottom-center"
        offset={72}
        closeButton
      />
    </InputModeProvider>
  );
}
