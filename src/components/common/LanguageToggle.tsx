"use client";

import { useLanguage } from "@/components/common/LanguageProvider";
import Icon from "@/components/common/Icon";
import type { ILanguage } from "@/lib/i18n";

export interface ILanguageToggleProps {
  className?: string;
}

const OPTIONS: { value: ILanguage; label: string; full: string }[] = [
  { value: "fil", label: "FIL", full: "Filipino" },
  { value: "en", label: "EN", full: "English" },
];

/**
 * Segmented FIL/EN language switch. Filipino is listed first (default).
 * The choice persists via LanguageProvider (localStorage) and also drives the
 * language KlimaChat replies in. Theme-aware, 44px touch targets.
 */
export default function LanguageToggle({ className }: ILanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
      role="radiogroup"
      aria-label={language === "en" ? "Language" : "Wika"}
    >
      <Icon name="translate" size={16} className="hidden text-cmd-muted sm:block" aria-hidden="true" />
      <div className="inline-flex overflow-hidden rounded-lg border border-black/15 bg-cmd-tile dark:border-white/15">
        {OPTIONS.map((opt) => {
          const isActive = language === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={opt.full}
              lang={opt.value === "en" ? "en" : "fil"}
              onClick={() => setLanguage(opt.value)}
              className={`min-h-[44px] min-w-[44px] px-3 font-ui text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal ${
                isActive
                  ? "bg-teal text-white"
                  : "bg-transparent text-cmd-muted hover:bg-black/5 hover:text-cmd-heading dark:hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
