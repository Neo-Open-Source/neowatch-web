import { actions } from "astro:actions";
import { bindEach } from "../lib/client/bind";
import { attachPopover } from "../lib/client/popover";
import type { EntryStatus } from "../lib/api/account-types";
import { addRecent } from "../lib/search/history";

type ActionData = { signedIn: boolean } | undefined;

function redirectIfSignedOut(data: ActionData): boolean {
  if (!data || data.signedIn) return false;
  window.location.href = "/auth/login";
  return true;
}

function rememberCard(card: HTMLElement): void {
  const { key, kind, title, english, original } = card.dataset;
  if (!key || !kind || !title) return;
  addRecent({
    key,
    kind,
    title,
    titleEnglish: english ?? null,
    titleOriginal: original ?? null,
    poster: card.querySelector<HTMLImageElement>("[data-card-poster]")?.src ?? null,
  });
}

bindEach<HTMLElement>("[data-key]", (card, signal) => {
  const titleLink = card.querySelector<HTMLAnchorElement>("[data-card-title]");

  card.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest("button")) return;
    const link = event.target.closest("a");
    if (link && link.href !== titleLink?.href) return;
    rememberCard(card);
    if (link || !titleLink) return;
    window.location.href = titleLink.href;
  });

  const entryButton = card.querySelector<HTMLButtonElement>("[data-entry-button]");
  const entryMenu = card.querySelector<HTMLElement>("[data-entry-menu]");
  if (entryButton && entryMenu) {
    attachPopover({
      trigger: entryButton,
      panel: entryMenu,
      signal,
      align: "right",
      items: () => [...entryMenu.querySelectorAll<HTMLElement>('[role="menuitem"]')],
    });
  }

  for (const item of card.querySelectorAll<HTMLButtonElement>("[data-entry-status]")) {
    item.addEventListener("click", async () => {
      const status = item.dataset.entryStatus as EntryStatus | undefined;
      const { key, kind, title, poster } = card.dataset;
      if (item.disabled || !key || !kind || !status) return;
      item.disabled = true;
      try {
        const { data } = await actions.catalog.setEntryStatus({
          key,
          kind,
          title: title ?? "",
          poster: poster || undefined,
          status,
        });
        if (!data || redirectIfSignedOut(data)) return;
        document.dispatchEvent(new Event("nw:close-menus"));
      } finally {
        item.disabled = false;
      }
    });
  }

  const favorite = card.querySelector<HTMLButtonElement>("[data-favorite-button]");
  favorite?.addEventListener("click", async () => {
    if (favorite.disabled || !favorite.dataset.key) return;
    favorite.disabled = true;
    try {
      const { data } = await actions.catalog.toggleFavorite({
        key: favorite.dataset.key,
        title: favorite.dataset.title ?? "",
        poster: favorite.dataset.poster || undefined,
        subtitle: favorite.dataset.subtitle || undefined,
      });
      if (!data || redirectIfSignedOut(data)) return;
      favorite.setAttribute("aria-pressed", String(data.favorite));
    } finally {
      favorite.disabled = false;
    }
  });

  return undefined;
});
