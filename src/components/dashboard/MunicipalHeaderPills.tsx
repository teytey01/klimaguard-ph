"use client";

import { Icon, useLanguage } from "@/components/common";

export interface IMunicipalHeaderPillsProps {
  emergencyActive: boolean;
  level: number;
}

/** Header pills: location, role, and the alert status (red when active). */
export default function MunicipalHeaderPills({ emergencyActive, level }: IMunicipalHeaderPillsProps) {
  const { t } = useLanguage();
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
      <span className="hidden items-center gap-1 rounded-full bg-cmd-tile px-3 py-1 text-[11px] font-semibold text-cmd-heading sm:inline-flex">
        <Icon name="location" size={12} />
        {t("mun.pill.location")}
      </span>
      <span className="hidden rounded-full bg-cmd-tile px-3 py-1 text-[11px] font-semibold text-cmd-heading md:inline-flex">
        {t("mun.pill.role")}
      </span>
      {emergencyActive ? (
        <span className="inline-flex rounded-full bg-alert px-3 py-1 text-[11px] font-bold text-white">
          {t("mun.pill.status", { level })}
        </span>
      ) : (
        <span className="inline-flex rounded-full bg-teal px-3 py-1 text-[11px] font-bold text-white">
          {t("mun.pill.normal")}
        </span>
      )}
    </div>
  );
}
