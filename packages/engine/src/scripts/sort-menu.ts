import { bindEach } from "../lib/client/bind";
import { attachPopover } from "../lib/client/popover";

bindEach<HTMLElement>("[data-sort]", (root, signal) => {
  const trigger = root.querySelector<HTMLButtonElement>("[data-sort-button]");
  const panel = root.querySelector<HTMLElement>("[data-sort-menu]");
  if (!trigger || !panel) return undefined;

  attachPopover({
    trigger,
    panel,
    signal,
    align: "right",
    items: () => [...panel.querySelectorAll<HTMLElement>('[role="menuitem"]')],
  });

  return undefined;
});
