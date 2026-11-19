"use client";

import { Moon, Sun } from "lucide-react";
import { applyTheme, type ThemeMode } from "@/lib/theme";
import { setTheme, useAppDispatch, useAppSelector } from "@/store";

export default function ThemeToggle() {
  const theme = useAppSelector((state) => state.ui.theme);
  const dispatch = useAppDispatch();

  function toggleTheme() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";

    applyTheme(next);
    dispatch(setTheme(next));
  }

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
