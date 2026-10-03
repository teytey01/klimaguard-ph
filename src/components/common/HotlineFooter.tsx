"use client";

import { useLanguage } from "@/components/common/LanguageProvider";

/**
 * The red NDRRMC/PAGASA hotline footer strip from the Stitch design. Always
 * shows emergency contact numbers (safety priority) plus the early-warning
 * node status. One-tap `tel:` links with 44px touch targets.
 */
export default function HotlineFooter() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-black/10 bg-cmd-surface dark:border-white/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-cmd-muted">
          <span className="font-bold text-alert">{t("shell.hotline")}</span>
          <a
            href="tel:911"
            aria-label="Tawagan ang 911"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-bold text-alert hover:underline"
          >
            911
          </a>
          <span className="opacity-50">|</span>
          <span className="font-semibold">PAGASA:</span>
          <a
            href="tel:+6328284080"
            className="inline-flex min-h-[32px] items-center hover:underline"
          >
            (02) 8284-0800
          </a>
        </div>
        <div className="flex items-center gap-2 text-cmd-muted">
          <span
            className="inline-block size-2 animate-pulse rounded-full bg-teal"
            aria-hidden="true"
          />
          <span>{t("shell.earlyWarningOnline")}</span>
          <span className="opacity-50">·</span>
          <span>{t("shell.republic")}</span>
        </div>
      </div>
    </footer>
  );
}
