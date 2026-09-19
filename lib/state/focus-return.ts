let returnFocusKey: string | null = null;

export function setReturnFocusKey(key: string | null) {
  returnFocusKey = key;
}

export function getReturnFocusKey() {
  return returnFocusKey;
}

// Last card focused on each pathname. On back-navigation the page restores the
// focus that was active when the user left it (matching the restored scroll
// position) instead of the page's default initial focus (e.g. the hero Play
// button). Keyed by pathname so multi-level back (A → B → C) still returns to
// the right card on each step.
const pathFocus = new Map<string, string>();

export function recordPathFocus(pathname: string, key: string) {
  pathFocus.set(pathname, key);
}

export function getPathFocus(pathname: string): string | undefined {
  return pathFocus.get(pathname);
}
