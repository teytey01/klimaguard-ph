"use client";

import { Icon, useLanguage } from "@/components/common";
import type { IconName } from "@/components/common/Icon";
import type { ITranslationKey } from "@/lib/i18n";
import { useMunicipalLogout } from "@/lib/dashboard/useMunicipalLogout";
import type { IMunModuleTab } from "@/types";

export interface IMunicipalSidebarProps {
  activeTab: IMunModuleTab;
  /** Switch tab; optional anchor id to scroll to after switching. */
  onNavigate: (tab: IMunModuleTab, anchor?: string) => void;
  /** Signed-in official's name (shown with the single role). */
  name?: string;
  /** BDRRMCs online. */
  bdrrmcOnline: number;
  /** BDRRMCs listed. */
  bdrrmcTotal: number;
}

interface IMunSideItem {
  id: string;
  tab: IMunModuleTab;
  anchor?: string;
  icon: IconName;
  labelKey: ITranslationKey;
}

const ITEMS: IMunSideItem[] = [
  { id: "chat", tab: "m1", icon: "broadcast", labelKey: "mun.side.chat" },
  { id: "weather", tab: "m2", icon: "cloud", labelKey: "mun.side.weather" },
  { id: "alerts", tab: "m3", icon: "alert-triangle", labelKey: "mun.side.alerts" },
  { id: "evac", tab: "m7", anchor: "mun-evac", icon: "home", labelKey: "mun.side.evac" },
  { id: "relief", tab: "m7", anchor: "mun-relief", icon: "box", labelKey: "mun.side.relief" },
  { id: "settings", tab: "settings", icon: "settings", labelKey: "mun.side.settings" },
];

/**
 * Left sidebar for the Municipal Command Center. Mirrors ResidentSidebar:
 * shows ONLY the signed-in role ("Municipal Command") with the user's name —
 * the other roles are never listed — plus Active Modules, log out, and the
 * telemetry footer. Theme-aware.
 */
export default function MunicipalSidebar({
  activeTab,
  onNavigate,
  name,
  bdrrmcOnline,
  bdrrmcTotal,
}: IMunicipalSidebarProps) {
  const { t } = useLanguage();
  const logout = useMunicipalLogout();

  return (
    <aside className="w-full shrink-0 rounded-xl bg-cmd-surface p-4 print:hidden lg:w-64">
      <p className="text-[10px] font-bold uppercase tracking-wide text-cmd-muted">
        {t("mun.side.role")}
      </p>
      <ul className="mt-2 space-y-1">
        <li>
          <div
            aria-current="page"
            className="flex w-full flex-col items-start gap-0.5 rounded-lg bg-teal px-3 py-2 text-sm text-white"
          >
            <span className="flex items-center gap-2">
              <Icon name="command" size={16} />
              {t("res.roleMunicipal")}
            </span>
            {name ? <span className="pl-6 text-[11px] font-normal text-white/80">{name}</span> : null}
          </div>
        </li>
      </ul>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-wide text-cmd-muted">
        {t("mun.side.modules")}
      </p>
      <ul className="mt-2 space-y-1">
        {ITEMS.map((m) => {
          const isActive = m.tab === activeTab && (m.tab !== "m7" || m.id === "evac");
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onNavigate(m.tab, m.anchor)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                  isActive
                    ? "bg-cmd-tile text-cmd-heading"
                    : "text-cmd-muted hover:bg-cmd-tile hover:text-cmd-heading"
                }`}
              >
                <Icon name={m.icon} size={16} />
                {t(m.labelKey)}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-cmd-muted transition-colors hover:bg-cmd-tile hover:text-cmd-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <Icon name="log-out" size={16} />
            {t("mun.side.logout")}
          </button>
        </li>
      </ul>

      <div className="mt-5 rounded-lg border border-black/10 bg-cmd-tile p-3 dark:border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-cmd-muted">
            {t("mun.side.telemetry")}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-teal">
            <span className="inline-block size-2 animate-pulse rounded-full bg-teal" />
            {t("mun.side.online")}
          </span>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-cmd-heading">{t("mun.side.unit")}</p>
        <p className="mt-1 text-[11px] text-cmd-muted">
          {t("mun.side.bdrrmcOnline", { count: bdrrmcOnline, total: bdrrmcTotal })}
        </p>
        <p className="mt-1 text-[11px] text-cmd-muted">{t("mun.side.background")}</p>
      </div>
    </aside>
  );
}
