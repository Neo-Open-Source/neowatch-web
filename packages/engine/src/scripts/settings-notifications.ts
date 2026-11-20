import { bindEach } from "../lib/client/bind";
import { text } from "../lib/text";

const defaults: Record<string, boolean> = { finished: true, episode: true, replies: false };

const key = (id: string): string => `nw_notify_${id}`;

bindEach<HTMLElement>("[data-settings-notifications]", (root, signal) => {
  const inputs = [...root.querySelectorAll<HTMLInputElement>("[data-notify-option]")];
  const state = root.querySelector<HTMLElement>("[data-notification-state]");
  const enable = root.querySelector<HTMLButtonElement>("[data-notification-enable]");

  for (const input of inputs) {
    const id = input.dataset.notifyOption;
    if (!id) continue;
    const stored = localStorage.getItem(key(id));
    input.checked = stored === null ? (defaults[id] ?? false) : stored === "1";
    input.addEventListener(
      "change",
      () => {
        localStorage.setItem(key(id), input.checked ? "1" : "0");
      },
      { signal },
    );
  }

  const syncPermission = (): void => {
    if (!("Notification" in window)) {
      if (state) state.textContent = text.settings.unavailable;
      if (enable) enable.disabled = true;
      return;
    }
    const granted = Notification.permission === "granted";
    if (state) state.textContent = granted ? text.settings.enabled : text.settings.disabled;
    if (enable) enable.disabled = granted;
  };

  syncPermission();
  enable?.addEventListener(
    "click",
    () => {
      if (!("Notification" in window)) return;
      void Notification.requestPermission().then(syncPermission);
    },
    { signal },
  );
});
