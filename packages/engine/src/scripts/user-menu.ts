import { bindEach } from "../lib/client/bind";

const canHover = matchMedia("(hover: hover)");

bindEach<HTMLElement>("[data-user-menu]", (root, signal) => {
  const trigger = root.querySelector<HTMLButtonElement>("[data-user-menu-trigger]");
  const panel = root.querySelector<HTMLElement>("[data-user-menu-panel]");
  if (!trigger || !panel) return undefined;

  const setOpen = (open: boolean): void => {
    trigger.setAttribute("aria-expanded", String(open));
    panel.dataset.open = String(open);
    panel.inert = !open;
  };

  trigger.addEventListener("click", () => setOpen(trigger.getAttribute("aria-expanded") !== "true"));

  if (canHover.matches) {
    root.addEventListener("mouseenter", () => setOpen(true));
    root.addEventListener("mouseleave", () => setOpen(false));
  }

  document.addEventListener(
    "click",
    (event) => {
      if (event.target instanceof Node && !root.contains(event.target)) setOpen(false);
    },
    { signal },
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && trigger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        trigger.focus();
      }
    },
    { signal },
  );

  return undefined;
});
