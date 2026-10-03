"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AppHeader, HotlineFooter, useLanguage } from "@/components/common";
import type { ITranslationKey } from "@/lib/i18n";
import { bdrrmcOnlineCount } from "@/lib/dashboard/municipalSelectors";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IModuleNavItem, IMunModuleTab, IMunPrintMode } from "@/types";
import ModuleNavBar from "./ModuleNavBar";
import MunicipalSidebar from "./MunicipalSidebar";
import MunicipalOverrideBar from "./MunicipalOverrideBar";
import MunicipalHeaderPills from "./MunicipalHeaderPills";
import MunicipalTitleBar from "./MunicipalTitleBar";
import MunicipalPrintSheet from "./MunicipalPrintSheet";
import MunOverviewPanel from "./MunOverviewPanel";
import MunChatPanel from "./MunChatPanel";
import MunWeatherPanel from "./MunWeatherPanel";
import MunHazardPanel from "./MunHazardPanel";
import MunSafetyPanel from "./MunSafetyPanel";
import MunAgriculturePanel from "./MunAgriculturePanel";
import MunPlanningPanel from "./MunPlanningPanel";
import MunDrrmOpsPanel from "./MunDrrmOpsPanel";
import MunLocationPanel from "./MunLocationPanel";
import MunKnowledgePanel from "./MunKnowledgePanel";
import MunAnalyticsPanel from "./MunAnalyticsPanel";
import MunTransparencyPanel from "./MunTransparencyPanel";
import MunSettingsPanel from "./MunSettingsPanel";

export interface IMunicipalCommandViewProps {
  /** Signed-in official's name (sidebar + audit WHO). */
  name?: string;
}

interface ITabDef {
  id: Exclude<IMunModuleTab, "settings">;
  prefix: string;
  labelKey: ITranslationKey;
  icon: IModuleNavItem["icon"];
  kind: IModuleNavItem["kind"];
}

const TABS: ITabDef[] = [
  { id: "overview", prefix: "", labelKey: "mun.tab.overview", icon: "command", kind: "operations" },
  { id: "m1", prefix: "M1", labelKey: "mun.tab.m1", icon: "broadcast", kind: "operations" },
  { id: "m2", prefix: "M2", labelKey: "mun.tab.m2", icon: "cloud", kind: "operations" },
  { id: "m3", prefix: "M3", labelKey: "mun.tab.m3", icon: "alert-triangle", kind: "operations" },
  { id: "m4", prefix: "M4", labelKey: "mun.tab.m4", icon: "shield", kind: "operations" },
  { id: "m5", prefix: "M5", labelKey: "mun.tab.m5", icon: "sprout", kind: "operations" },
  { id: "m6", prefix: "M6", labelKey: "mun.tab.m6", icon: "building", kind: "planning" },
  { id: "m7", prefix: "M7", labelKey: "mun.tab.m7", icon: "radio", kind: "planning" },
  { id: "m8", prefix: "M8", labelKey: "mun.tab.m8", icon: "location", kind: "operations" },
  { id: "m9", prefix: "M9", labelKey: "mun.tab.m9", icon: "scroll", kind: "operations" },
  { id: "m10", prefix: "M10", labelKey: "mun.tab.m10", icon: "chart", kind: "planning" },
  { id: "m11", prefix: "M11", labelKey: "mun.tab.m11", icon: "box", kind: "operations" },
];

/**
 * MDRRMO Municipal Command Center (role "lgu") — Calamba, Laguna. Light by
 * default (theme tokens; the header toggle flips to dark). Red override bar
 * while the emergency protocol is active. Sidebar shows ONLY the signed-in
 * role. Every module tab renders a working panel.
 */
export default function MunicipalCommandView({ name }: IMunicipalCommandViewProps) {
  const { t } = useLanguage();
  const { state } = useMunicipalStore();
  const [tab, setTab] = useState<IMunModuleTab>("overview");
  const [printMode, setPrintMode] = useState<IMunPrintMode>("none");
  const pendingAnchor = useRef<string | null>(null);

  // Drop the print sheet once the dialog closes so a later Ctrl+P prints the
  // normal page, not the last DANA/TOC sheet.
  useEffect(() => {
    const reset = () => setPrintMode("none");
    window.addEventListener("afterprint", reset);
    return () => window.removeEventListener("afterprint", reset);
  }, []);

  useEffect(() => {
    const anchor = pendingAnchor.current;
    if (!anchor) {
      return;
    }
    pendingAnchor.current = null;
    const id = window.requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [tab]);

  function navigate(next: IMunModuleTab, anchor?: string) {
    pendingAnchor.current = anchor ?? null;
    if (next === tab && anchor) {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      pendingAnchor.current = null;
      return;
    }
    setTab(next);
  }

  function print(mode: Exclude<IMunPrintMode, "none">) {
    // Render the print sheet synchronously, then open the print dialog.
    flushSync(() => setPrintMode(mode));
    window.print();
  }

  const modules: IModuleNavItem[] = TABS.map((d) => ({
    id: d.id,
    label: d.prefix ? `${d.prefix} ${t(d.labelKey)}` : t(d.labelKey),
    icon: d.icon,
    kind: d.kind,
  }));

  let panel: React.ReactNode;
  switch (tab) {
    case "m1":
      panel = <MunChatPanel />;
      break;
    case "m2":
      panel = <MunWeatherPanel />;
      break;
    case "m3":
      panel = <MunHazardPanel onNavigate={navigate} />;
      break;
    case "m4":
      panel = <MunSafetyPanel />;
      break;
    case "m5":
      panel = <MunAgriculturePanel />;
      break;
    case "m6":
      panel = <MunPlanningPanel />;
      break;
    case "m7":
      panel = <MunDrrmOpsPanel />;
      break;
    case "m8":
      panel = <MunLocationPanel />;
      break;
    case "m9":
      panel = <MunKnowledgePanel onNavigate={navigate} />;
      break;
    case "m10":
      panel = <MunAnalyticsPanel />;
      break;
    case "m11":
      panel = <MunTransparencyPanel />;
      break;
    case "settings":
      panel = <MunSettingsPanel />;
      break;
    default:
      panel = <MunOverviewPanel onNavigate={navigate} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-2">
      <div className="print:hidden">
        {state.emergencyActive ? <MunicipalOverrideBar level={state.emergencyLevel} /> : null}
        <AppHeader>
          <MunicipalHeaderPills emergencyActive={state.emergencyActive} level={state.emergencyLevel} />
        </AppHeader>
      </div>

      <main className="flex-1 px-4 py-6 print:hidden sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 lg:flex-row">
          <MunicipalSidebar
            activeTab={tab}
            onNavigate={navigate}
            name={name}
            bdrrmcOnline={bdrrmcOnlineCount(state)}
            bdrrmcTotal={state.barangays.length}
          />
          <div className="min-w-0 flex-1 space-y-4">
            <MunicipalTitleBar onPrint={print} />
            <ModuleNavBar
              modules={modules}
              activeId={tab === "settings" ? "" : tab}
              onSelect={(id) => navigate(id as IMunModuleTab)}
              hideIds
              ariaLabel={t("mun.tabs.label")}
            />
            <div role="region" aria-label={tab === "settings" ? t("mun.tab.settings") : modules.find((m) => m.id === tab)?.label}>
              {panel}
            </div>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <HotlineFooter />
      </div>

      <MunicipalPrintSheet mode={printMode} />
    </div>
  );
}
