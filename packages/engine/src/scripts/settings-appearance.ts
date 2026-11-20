import { bindEach } from "../lib/client/bind";
import { setThemeMode, themeMode } from "../lib/client/theme";

bindEach<HTMLElement>("[data-settings-appearance]", (root, signal) => {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-theme-mode]")];

  const sync = (): void => {
    const current = themeMode();
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.themeMode === current));
    }
  };

  sync();
  for (const button of buttons) {
    button.addEventListener(
      "click",
      () => {
        const mode = button.dataset.themeMode;
        if (mode !== "system" && mode !== "light" && mode !== "dark") return;
        setThemeMode(mode);
        sync();
      },
      { signal },
    );
  }
});
