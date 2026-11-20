import { bindEach } from "../lib/client/bind";
import { attachPopover } from "../lib/client/popover";
import { lockScroll, unlockScroll } from "../lib/client/scroll-lock";
import { text, type EntryStatus } from "../lib/text";
import { statusColor } from "../lib/entry-status";
import "./detail/steppers";

interface Entry {
  status: EntryStatus | null;
  eps: number;
  score: number;
  rewatch: number;
  started: string;
  finished: string;
  notes: string;
  favorite: boolean;
}

bindEach<HTMLElement>("[data-detail-entry]", (scope, signal) => {
  const q = <T extends HTMLElement>(name: string): T | null =>
    scope.querySelector<T>(`[data-${name}]`);
  const byId = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

  const total = Number(scope.dataset.total ?? 0);
  const status = scope.dataset.entryStatus ?? "";

  const entry: Entry = {
    status: status ? (status as EntryStatus) : null,
    eps: Number(scope.dataset.entryEps ?? 0),
    score: Number(scope.dataset.entryScore ?? 0),
    rewatch: 0,
    started: "",
    finished: "",
    notes: "",
    favorite: false,
  };

  const menu = q<HTMLElement>("plans-menu");
  const plansButton = q<HTMLButtonElement>("plans-button");
  const buttonLabel = q<HTMLElement>("plans-label");
  const watchProgress = q<HTMLElement>("watch-progress");
  const iconAdd = q<HTMLElement>("icon-add");
  const iconBookmark = q<HTMLElement>("icon-bookmark");
  const removeMenuButton = q<HTMLButtonElement>("entry-remove-menu");
  const dialog = q<HTMLDialogElement>("entry-dialog");
  const namesDialog = q<HTMLDialogElement>("names-dialog");
  const commentsDialog = q<HTMLDialogElement>("comments-dialog");

  const statusSelect = scope.querySelector<HTMLElement>("[data-status-select]");
  const scoreInput = byId<HTMLInputElement>("entry-score-input");
  const epsInput = byId<HTMLInputElement>("entry-eps-input");
  const rewatchInput = byId<HTMLInputElement>("entry-rewatch-input");
  const startInput = byId<HTMLInputElement>("entry-start-input");
  const finishInput = byId<HTMLInputElement>("entry-finish-input");
  const notesInput = byId<HTMLTextAreaElement>("entry-notes-input");
  const likeButton = q<HTMLButtonElement>("entry-like");
  const favoriteButton = q<HTMLButtonElement>("entry-favorite");
  let draftFavorite = false;

  const setLikePressed = (button: HTMLButtonElement | null): void => {
    if (!button) return;
    const on = button === favoriteButton ? draftFavorite : entry.favorite;
    button.setAttribute("aria-pressed", String(on));
    button.classList.toggle("text-danger", on);
  };

  if (!menu || !plansButton || !buttonLabel || !watchProgress || !iconAdd || !iconBookmark || !dialog)
    return undefined;

  const planLabel = buttonLabel.textContent ?? "";
  let menuOpen = false;

  const renderEntry = (): void => {
    const has = entry.status !== null;
    iconAdd.classList.toggle("hidden", has);
    iconBookmark.classList.toggle("hidden", !has);
    for (const color of Object.values(statusColor)) iconBookmark.classList.remove(color);
    if (entry.status) iconBookmark.classList.add(statusColor[entry.status]);
    buttonLabel.textContent = has
      ? (menu.querySelector<HTMLElement>(`[data-status="${entry.status}"]`)?.textContent?.trim() ?? "")
      : planLabel;
    for (const color of Object.values(statusColor)) buttonLabel.classList.remove(color);
    if (has && entry.status) buttonLabel.classList.add(statusColor[entry.status]);
    watchProgress.textContent = `${entry.eps} / ${total}`;
    removeMenuButton?.classList.toggle("hidden", !has);
    removeMenuButton?.classList.toggle("flex", has);
    for (const item of menu.querySelectorAll<HTMLElement>("[data-status]")) {
      item.classList.toggle("text-ink", item.dataset.status === entry.status);
    }
  };

  const statusTrigger = statusSelect?.querySelector<HTMLButtonElement>("[data-status-trigger]");
  const statusLabel = statusSelect?.querySelector<HTMLElement>("[data-status-label]");
  const statusList = statusSelect?.querySelector<HTMLElement>("[data-status-list]");
  const statusOptions = statusList
    ? [...statusList.querySelectorAll<HTMLButtonElement>("[data-status-option]")]
    : [];

  const syncStatus = (): void => {
    if (!statusSelect || !statusLabel) return;
    const active = statusOptions.find(
      (option) => (option.dataset.statusOption || null) === entry.status,
    );
    statusLabel.textContent =
      active?.textContent?.replace(/\s+/g, " ").trim() ?? text.detail.choose;
    for (const option of statusOptions) {
      const isActive = (option.dataset.statusOption || null) === entry.status;
      option.setAttribute("aria-selected", String(isActive));
      option.classList.toggle("text-ink", isActive);
      option.querySelector<HTMLElement>("[data-check]")?.classList.toggle("hidden", !isActive);
    }
    statusSelect.dataset.value = entry.status ?? "";
  };

  const syncStatusWidth = (): void => {
    if (!statusTrigger || !statusList) return;
    statusList.style.setProperty(
      "--nw-select-w",
      `${Math.round(statusTrigger.getBoundingClientRect().width)}px`,
    );
  };

  const statusPopover =
    statusTrigger && statusList
      ? attachPopover({
          trigger: statusTrigger,
          panel: statusList,
          signal,
          items: () => statusOptions,
          beforeOpen: syncStatusWidth,
        })
      : null;

  window.addEventListener(
    "resize",
    () => {
      if (statusPopover?.isOpen()) {
        syncStatusWidth();
        statusPopover.reposition();
      }
    },
    { signal },
  );

  for (const option of statusOptions) {
    option.addEventListener("click", () => {
      entry.status = (option.dataset.statusOption || null) as EntryStatus | null;
      syncStatus();
      statusPopover?.close();
    });
  }

  const syncControls = (): void => {
    if (statusSelect) syncStatus();
    if (scoreInput) scoreInput.value = String(entry.score);
    if (epsInput) epsInput.value = String(entry.eps);
    if (rewatchInput) rewatchInput.value = String(entry.rewatch);
    if (startInput) startInput.value = entry.started;
    if (finishInput) finishInput.value = entry.finished;
    if (notesInput) {
      notesInput.value = entry.notes;
      notesInput.dataset.filled = String(entry.notes.length > 0);
    }
    setLikePressed(likeButton);
    setLikePressed(favoriteButton);
  };

  const setMenuOpen = (next: boolean): void => {
    menuOpen = next;
    menu.dataset.open = String(next);
    plansButton.setAttribute("aria-expanded", String(next));
  };

  const openDialog = (target: HTMLDialogElement | null): void => {
    if (!target) return;
    if (target === dialog) {
      draftFavorite = entry.favorite;
      syncControls();
    }
    lockScroll();
    target.showModal();
    target.scrollTop = 0;
  };

  const clearEntry = (): void => {
    entry.status = null;
    entry.eps = 0;
    entry.score = 0;
    renderEntry();
  };

  for (const target of [dialog, namesDialog, commentsDialog]) {
    if (!target) continue;
    target.addEventListener("close", unlockScroll);
    target.addEventListener("click", (event) => {
      if (event.target === target) target.close();
    });
  }

  plansButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(!menuOpen);
  });

  for (const item of menu.querySelectorAll<HTMLElement>("[data-status]")) {
    item.addEventListener("click", () => {
      entry.status = item.dataset.status as EntryStatus;
      renderEntry();
      setMenuOpen(false);
    });
  }

  q("entry-edit-menu")?.addEventListener("click", () => {
    setMenuOpen(false);
    openDialog(dialog);
  });
  removeMenuButton?.addEventListener("click", () => {
    clearEntry();
    setMenuOpen(false);
  });

  q("edit-button")?.addEventListener("click", () => openDialog(dialog));
  likeButton?.addEventListener("click", () => {
    entry.favorite = !entry.favorite;
    draftFavorite = entry.favorite;
    syncControls();
  });
  q("notify-button")?.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLElement;
    const on = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!on));
    button.classList.toggle("text-accent", !on);
  });
  q("comments-button")?.addEventListener("click", () => openDialog(commentsDialog));
  q("comments-close")?.addEventListener("click", () => commentsDialog?.close());
  q("names-button")?.addEventListener("click", () => openDialog(namesDialog));
  q("names-close")?.addEventListener("click", () => namesDialog?.close());

  favoriteButton?.addEventListener("click", () => {
    draftFavorite = !draftFavorite;
    setLikePressed(favoriteButton);
  });

  q("entry-save")?.addEventListener("click", () => {
    entry.status = (statusSelect?.dataset.value || null) as EntryStatus | null;
    entry.score = Math.min(10, Math.max(0, Number(scoreInput?.value) || 0));
    entry.eps = Math.max(0, Number(epsInput?.value) || 0);
    if (total) entry.eps = Math.min(entry.eps, total);
    entry.rewatch = Math.max(0, Number(rewatchInput?.value) || 0);
    entry.started = startInput?.value ?? "";
    entry.finished = finishInput?.value ?? "";
    entry.notes = notesInput?.value ?? "";
    entry.favorite = draftFavorite;
    renderEntry();
    setLikePressed(likeButton);
    dialog.close();
  });
  q("entry-remove")?.addEventListener("click", () => {
    clearEntry();
    dialog.close();
  });
  q("entry-close")?.addEventListener("click", () => dialog.close());
  notesInput?.addEventListener("input", () => {
    notesInput.dataset.filled = String(notesInput.value.length > 0);
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!menuOpen || !(event.target instanceof Node)) return;
      if (menu.contains(event.target) || plansButton.contains(event.target)) return;
      setMenuOpen(false);
    },
    { signal },
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (!menuOpen) return;
      if (event.key === "Escape") {
        setMenuOpen(false);
        plansButton.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].filter(
        (item) => !item.classList.contains("hidden"),
      );
      if (items.length === 0) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLButtonElement);
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next =
        current < 0 ? (step > 0 ? 0 : items.length - 1) : (current + step + items.length) % items.length;
      items[next]?.focus();
    },
    { signal },
  );

  renderEntry();
  return undefined;
});
