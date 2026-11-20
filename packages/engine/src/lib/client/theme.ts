const KEY = "nw_theme";
const osLight = matchMedia("(prefers-color-scheme: light)");

export type ThemeMode = "system" | "light" | "dark";

export function themeMode(): ThemeMode {
  const stored = localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "system";
}

export function applyTheme(): void {
  const mode = themeMode();
  const resolved = mode === "system" ? (osLight.matches ? "light" : "dark") : mode;
  document.documentElement.dataset.theme = resolved;
}

export function setThemeMode(mode: ThemeMode): void {
  if (mode === "system") localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, mode);
  applyTheme();
}

osLight.addEventListener("change", () => {
  if (themeMode() === "system") applyTheme();
});

document.addEventListener("astro:page-load", applyTheme);
