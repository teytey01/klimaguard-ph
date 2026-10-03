"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface IThemeProviderProps {
  children: React.ReactNode;
}

type Theme = "light" | "dark";

interface IThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (next: Theme) => void;
}

const STORAGE_KEY = "klimaguard-theme";

const ThemeContext = createContext<IThemeContextValue | undefined>(undefined);

/** Resolve the active class on <html> into a Theme (set by the no-flash script). */
function readDocumentTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export default function ThemeProvider({ children }: IThemeProviderProps) {
  // Default to light for SSR; the no-flash head script and this effect
  // reconcile to the stored/OS preference before the user interacts.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    let resolved: Theme = "light";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      resolved = stored;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      resolved = "dark";
    }
    // External DOM sync runs immediately; the no-flash script already applied
    // the class, so this is idempotent.
    applyTheme(resolved);
    // Reconcile React state outside the effect body to avoid a cascading
    // render during mount.
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        setThemeState(resolved);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = readDocumentTheme() === "dark" ? "light" : "dark";
    setTheme(next);
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Read the theme context. Throws (in Filipino) if used outside the provider. */
export function useTheme(): IThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      "Kailangang gamitin ang useTheme sa loob ng ThemeProvider.",
    );
  }
  return context;
}
