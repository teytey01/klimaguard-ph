"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_LANGUAGE,
  LANG_STORAGE_KEY,
  translate,
  type ILanguage,
  type ITranslationKey,
} from "@/lib/i18n";

export interface ILanguageProviderProps {
  children: React.ReactNode;
}

interface ILanguageContextValue {
  language: ILanguage;
  setLanguage: (next: ILanguage) => void;
  /** Translate a key in the active language, interpolating `{vars}`. */
  t: (key: ITranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<ILanguageContextValue | undefined>(
  undefined,
);

function readDocumentLanguage(): ILanguage {
  if (typeof document === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  return document.documentElement.getAttribute("data-lang") === "en"
    ? "en"
    : "fil";
}

function applyLanguage(language: ILanguage): void {
  const root = document.documentElement;
  root.setAttribute("data-lang", language);
  // Keep the html lang attribute meaningful for a11y / screen readers.
  root.setAttribute("lang", language === "en" ? "en" : "fil");
}

export default function LanguageProvider({
  children,
}: ILanguageProviderProps) {
  const [language, setLanguageState] = useState<ILanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    let resolved: ILanguage = DEFAULT_LANGUAGE;
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "fil") {
      resolved = stored;
    } else {
      // Respect the browser preference only when it is explicitly English;
      // otherwise default to Filipino per product rules.
      const prefersEnglish = navigator.language
        ?.toLowerCase()
        .startsWith("en");
      resolved = prefersEnglish ? "en" : "fil";
    }
    applyLanguage(resolved);
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        setLanguageState(resolved);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((next: ILanguage) => {
    applyLanguage(next);
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: ITranslationKey, vars?: Record<string, string | number>) =>
      translate(language, key, vars),
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Read the language context. Throws (in Filipino) if used outside provider. */
export function useLanguage(): ILanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error(
      "Kailangang gamitin ang useLanguage sa loob ng LanguageProvider.",
    );
  }
  return context;
}

export { readDocumentLanguage };
