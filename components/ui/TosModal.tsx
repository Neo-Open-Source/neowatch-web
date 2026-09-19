"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import { FocusContext, useFocusable, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { NAVBAR_SEARCH_FOCUS_KEY } from "@/components/Header";
import { cx } from "@/lib/utils/cx";
import {
  acceptTos,
  consumePending,
  declineTos,
  hasSeenTosPrompt,
  subscribeToGate,
} from "@/lib/state/tos";

const FOCUS_KEY_MODAL   = "TOS_MODAL";
const FOCUS_KEY_ACCEPT  = "TOS_ACCEPT";
const FOCUS_KEY_DECLINE = "TOS_DECLINE";

function TosButton({
  focusKey,
  className,
  onClick,
  children,
}: {
  focusKey: string;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onClick,
    // Block up/down leaving modal, allow left/right between buttons
    onArrowPress: (dir) => {
      if (dir === "up" || dir === "down") return false;
      return true;
    },
  });

  return (
    <button
      ref={ref}
      className={cx(className, focused && "tos-modal__btn--focused")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TosModalDialog({
  gate,
  onAccept,
  onDecline,
}: {
  gate: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { t } = useI18n();

  // When modal opens, trap focus on Accept
  const { ref: modalRef, focusKey: modalFocusKey } = useFocusable({
    focusKey: FOCUS_KEY_MODAL,
    trackChildren: true,
    isFocusBoundary: true,       // trap focus inside while open
    focusBoundaryDirections: ["up", "down", "left", "right"],
  });

  useEffect(() => {
    const id = setTimeout(() => setFocus(FOCUS_KEY_ACCEPT), 120);
    return () => clearTimeout(id);
  }, []);

  return (
    <FocusContext.Provider value={modalFocusKey}>
      <aside
        ref={modalRef}
        className="tos-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t.terms.title}
      >
        <h2 className="tos-modal__title">{t.terms.title}</h2>
        <p className="tos-modal__text">
          {gate ? t.terms.gateNotice : t.terms.notice}{" "}
          <a className="tos-modal__link" href={t.terms.url} target="_blank" rel="noreferrer">
            {t.terms.link}
          </a>
        </p>
        <div className="tos-modal__actions">
          <TosButton
            focusKey={FOCUS_KEY_ACCEPT}
            className="tos-modal__btn tos-modal__btn--primary"
            onClick={onAccept}
          >
            {t.terms.accept}
          </TosButton>
          <TosButton
            focusKey={FOCUS_KEY_DECLINE}
            className="tos-modal__btn tos-modal__btn--ghost"
            onClick={onDecline}
          >
            {t.terms.decline}
          </TosButton>
        </div>
      </aside>
    </FocusContext.Provider>
  );
}

type Mode = "hidden" | "first-visit" | "gate";

export function TosModal() {
  const [mode, setMode] = useState<Mode>("hidden");
  const pendingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // First visit: offer the terms up front (only when this version hasn't
    // been accepted or explicitly declined yet).
    if (!hasSeenTosPrompt()) {
      startTransition(() => setMode("first-visit"));
    }

    // Player gate: a video action requested ToS acceptance.
    const unsubscribe = subscribeToGate(() => {
      pendingRef.current = consumePending();
      startTransition(() => setMode("gate"));
    });
    return unsubscribe;
  }, []);

  if (mode === "hidden") return null;

  const handleAccept = () => {
    acceptTos();
    const action = pendingRef.current;
    pendingRef.current = null;
    setMode("hidden");
    setFocus(NAVBAR_SEARCH_FOCUS_KEY);
    // Run the queued player action after the modal unmounts.
    if (action) setTimeout(action, 0);
  };

  const handleDecline = () => {
    declineTos();
    pendingRef.current = null;
    setMode("hidden");
    setFocus(NAVBAR_SEARCH_FOCUS_KEY);
  };

  return (
    <TosModalDialog
      gate={mode === "gate"}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
}
