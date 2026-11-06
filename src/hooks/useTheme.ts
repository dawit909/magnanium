"use client";

import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark";
const THEME_KEY = "magnanium_theme";

function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let initial: Theme = "light";
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") {
        initial = saved;
      } else if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        initial = "dark";
      }
    } catch {}
    setTheme(initial);
    applyThemeToDocument(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
      applyThemeToDocument(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
