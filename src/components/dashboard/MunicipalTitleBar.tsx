"use client";

import { Icon, useLanguage } from "@/components/common";
import { MUN_BTN_OUTLINE, MUN_BTN_PRIMARY } from "@/lib/dashboard/munUi";
import type { IMunPrintMode } from "@/types";

export interface IMunicipalTitleBarProps {
  onPrint: (mode: Exclude<IMunPrintMode, "none">) => void;
}

/** Command-center title, subtitle and the two print actions. */
export default function MunicipalTitleBar({ onPrint }: IMunicipalTitleBarProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-cmd-surface p-4 shadow-sm sm:p-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-cmd-heading sm:text-xl">{t("mun.title")}</h1>
        <p className="mt-1 text-sm text-cmd-muted">{t("mun.subtitle")}</p>
      </div>
      <div className="shrink-0">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onPrint("dana")} className={MUN_BTN_PRIMARY}>
            <Icon name="scroll" size={16} />
            {t("mun.btn.danaPdf")}
          </button>
          <button type="button" onClick={() => onPrint("toc")} className={MUN_BTN_OUTLINE}>
            <Icon name="printer" size={16} />
            {t("mun.btn.toc")}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-cmd-muted">{t("mun.printHint")}</p>
      </div>
    </div>
  );
}
