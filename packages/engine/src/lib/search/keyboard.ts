const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled])";

export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (node) => !node.hasAttribute("hidden") && node.offsetParent !== null,
  );
}

export function trapTab(event: KeyboardEvent, root: HTMLElement): void {
  const items = focusableWithin(root);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function moveResultFocus(rows: HTMLAnchorElement[], current: HTMLAnchorElement | null, offset: number): void {
  if (rows.length === 0) return;
  const index = current ? rows.indexOf(current) : -1;
  const next = rows[Math.min(rows.length - 1, Math.max(0, index + offset))];
  next?.focus();
}
