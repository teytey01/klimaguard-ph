import { en, type ITranslationKey } from "./en";
import { fil } from "./fil";

export type { ITranslationKey } from "./en";

/** Supported UI languages. Filipino is the default. */
export type ILanguage = "fil" | "en";

export const LANGUAGES: Record<ILanguage, Record<ITranslationKey, string>> = {
  fil,
  en,
};

/** localStorage key for the persisted language choice. */
export const LANG_STORAGE_KEY = "klimaguard-lang";

/** The default language on first visit (product rule: Filipino-first). */
export const DEFAULT_LANGUAGE: ILanguage = "fil";

/**
 * Resolve a translation key for a language, interpolating `{placeholder}`
 * tokens from `vars`. Falls back to the Filipino string, then the key itself,
 * so a missing key never renders blank.
 */
export function translate(
  lang: ILanguage,
  key: ITranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = LANGUAGES[lang] ?? fil;
  let value = dict[key] ?? fil[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${name}\\}`, "g"), String(replacement));
    }
  }
  return value;
}
