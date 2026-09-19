// ToS acceptance gate. Acceptance is stored per version — bump TOS_VERSION
// whenever the terms text changes so everyone has to accept the new version.
// Browsing metadata always stays available; only player actions require it.

export const TOS_STORAGE_KEY = "nw-tos-accepted";
export const TOS_DECLINED_KEY = "nw-tos-declined";
export const TOS_VERSION = "3";

export function isTosAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(TOS_STORAGE_KEY) === TOS_VERSION;
  } catch {
    return false;
  }
}

/** True once the user has either accepted or explicitly declined this version. */
export function hasSeenTosPrompt(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem(TOS_STORAGE_KEY) === TOS_VERSION ||
      localStorage.getItem(TOS_DECLINED_KEY) === TOS_VERSION
    );
  } catch {
    return false;
  }
}

export function acceptTos(): void {
  try {
    localStorage.setItem(TOS_STORAGE_KEY, TOS_VERSION);
    localStorage.removeItem(TOS_DECLINED_KEY);
  } catch {
    /* storage unavailable — gate simply stays closed */
  }
}

export function declineTos(): void {
  try {
    localStorage.setItem(TOS_DECLINED_KEY, TOS_VERSION);
  } catch {
    /* ignore */
  }
}

// ── Gate (player actions) ─────────────────────────────────────────────────

type GateListener = () => void;
const listeners = new Set<GateListener>();
let pendingAction: (() => void) | null = null;

export function subscribeToGate(listener: GateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Runs `action` immediately when the ToS are accepted. Otherwise queues the
 * action and opens the consent gate — after the user accepts, the queued
 * action runs. Returns true when the action ran right away.
 */
export function requireTosAcceptance(action: () => void): boolean {
  if (isTosAccepted()) {
    action();
    return true;
  }
  pendingAction = action;
  emit();
  return false;
}

/** The queued player action (if any) — taken by the gate dialog on accept. */
export function consumePending(): (() => void) | null {
  const action = pendingAction;
  pendingAction = null;
  return action;
}
