interface PopoverOptions {
  trigger: HTMLElement;
  panel: HTMLElement;
  signal: AbortSignal;
  align?: "left" | "right";
  items?: () => HTMLElement[];
  beforeOpen?: () => void;
}

export interface Popover {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  reposition: () => void;
}

export function attachPopover({
  trigger,
  panel,
  signal,
  align = "left",
  items,
  beforeOpen,
}: PopoverOptions): Popover {
  let open = false;

  const place = (): void => {
    const rect = trigger.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const flip = rect.bottom + height + 6 > window.innerHeight - 8 && rect.top - height - 6 > 8;
    const left = align === "right" ? rect.right - width : rect.left;
    panel.style.top = `${flip ? rect.top - height - 6 : rect.bottom + 6}px`;
    panel.style.left = `${Math.max(8, Math.min(left, window.innerWidth - width - 8))}px`;
  };

  const close = (): void => {
    if (!open) return;
    open = false;
    trigger.setAttribute("aria-expanded", "false");
    panel.classList.remove("animate-pop-in");
    panel.hidePopover();
  };

  const show = (): void => {
    if (open) return;
    open = true;
    trigger.setAttribute("aria-expanded", "true");
    panel.showPopover();
    beforeOpen?.();
    place();
    panel.classList.add("animate-pop-in");
  };

  panel.addEventListener("toggle", (event) => {
    if ((event as ToggleEvent).newState === "closed" && open) {
      open = false;
      trigger.setAttribute("aria-expanded", "false");
      panel.classList.remove("animate-pop-in");
    }
  });

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (open) {
      close();
      return;
    }
    document.dispatchEvent(new Event("nw:close-menus"));
    show();
  });

  document.addEventListener("nw:close-menus", close, { signal });

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!open || !(event.target instanceof Node)) return;
      if (trigger.contains(event.target) || panel.contains(event.target)) return;
      close();
    },
    { signal },
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        trigger.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const list = items?.() ?? [];
      if (list.length === 0) return;
      event.preventDefault();
      const current = list.indexOf(document.activeElement as HTMLElement);
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next =
        current < 0 ? (step > 0 ? 0 : list.length - 1) : (current + step + list.length) % list.length;
      list[next]?.focus();
    },
    { signal },
  );

  window.addEventListener(
    "resize",
    () => {
      if (open) place();
    },
    { signal },
  );

  return { open: show, close, isOpen: () => open, reposition: place };
}
