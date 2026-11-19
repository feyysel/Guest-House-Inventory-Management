export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "havenstay-theme";

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    return;
  }
}

export function readTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
