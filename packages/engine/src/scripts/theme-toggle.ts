import { bindEach } from "../lib/client/bind";
import { applyTheme, setThemeMode, themeMode } from "../lib/client/theme";
import type { ThemeMode } from "../lib/client/theme";

const nextMode: Record<ThemeMode, ThemeMode> = { system: "dark", dark: "light", light: "system" };

bindEach<HTMLElement>("[data-theme-row]", (row) => {
  const label = row.querySelector<HTMLElement>("[data-theme-label]");
  const sw = row.querySelector<HTMLButtonElement>("[data-theme-switch]");
  if (!label || !sw) return undefined;

  const names: Record<ThemeMode, string | undefined> = {
    system: row.dataset.system,
    dark: row.dataset.dark,
    light: row.dataset.light,
  };

  const sync = (): void => {
    const mode = themeMode();
    label.textContent = `${row.dataset.label}: ${names[mode]}`;
    sw.setAttribute("aria-checked", mode === "system" ? "mixed" : String(mode === "dark"));
    applyTheme();
  };

  sync();
  sw.addEventListener("click", () => {
    setThemeMode(nextMode[themeMode()]);
    sync();
  });

  return undefined;
});
