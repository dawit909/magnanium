"use client";

import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { safeLocalStorage } from "@/lib/storage";

export type Theme = "light" | "dark";
export const THEME_KEY = STORAGE_KEYS.THEME;

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
    const saved = safeLocalStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      initial = saved;
    } else if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      initial = "dark";
    }
    setTheme(initial);
    applyThemeToDocument(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      safeLocalStorage.setItem(THEME_KEY, next);
      applyThemeToDocument(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
