import { bindEach } from "../lib/client/bind";

bindEach<HTMLElement>("[data-expand]", (block) => {
  const text = block.querySelector<HTMLElement>("[data-description]");
  const button = block.querySelector<HTMLButtonElement>("[data-read-more]");
  if (!text || !button) return undefined;

  const more = button.dataset.labelMore ?? "";
  const less = button.dataset.labelLess ?? "";

  const sync = (): void => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.hidden = open ? false : text.scrollHeight <= text.clientHeight + 1;
    button.textContent = open ? less : more;
  };

  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    text.classList.toggle("line-clamp-4", open);
    sync();
  });

  const observer = new ResizeObserver(sync);
  observer.observe(text);
  sync();

  return () => observer.disconnect();
});

bindEach<HTMLElement>("[data-chips]", (list) => {
  const more = list.querySelector<HTMLButtonElement>("[data-chips-more]");
  if (!more) return undefined;
  more.addEventListener("click", () => {
    for (const item of list.querySelectorAll<HTMLElement>("[data-extra]")) {
      item.removeAttribute("hidden");
    }
    more.closest("li")?.remove();
  });
  return undefined;
});
