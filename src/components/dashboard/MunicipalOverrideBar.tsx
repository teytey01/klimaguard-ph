"use client";

import { Icon, useLanguage } from "@/components/common";

export interface IMunicipalOverrideBarProps {
  level: number;
}

/**
 * Red emergency override strip (safety overrides theme: legible in both).
 * Not dismissible — it clears only when the official turns the protocol off.
 * Always carries a one-tap 911 call button (44px target).
 */
export default function MunicipalOverrideBar({ level }: IMunicipalOverrideBarProps) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="relative z-50 w-full bg-alert text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-wide">
          <Icon name="alert-triangle" size={16} />
          <span className="min-w-0 break-words leading-snug">{t("mun.override", { level })}</span>
        </p>
        <a
          href="tel:911"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg bg-white px-3 text-xs font-bold text-alert focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Icon name="phone" size={14} />
          {t("mun.call911")}
        </a>
      </div>
    </div>
  );
}
