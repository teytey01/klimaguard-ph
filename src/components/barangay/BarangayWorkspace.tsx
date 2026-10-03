"use client";

import { useEffect, useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import { useAlerts } from "@/hooks";
import {
  activateChecklist,
  BARANGAY_TABS,
  DEFAULT_BARANGAY_CENTER,
} from "@/lib/barangay";
import { PH_REGIONS } from "@/lib/onboarding/onboardingData";
import type { IBarangayView } from "@/types";
import AgricultureAreaPanel from "./AgricultureAreaPanel";
import AuditLogPanel from "./AuditLogPanel";
import BarangayAnalyticsPanel from "./BarangayAnalyticsPanel";
import BarangayChatPanel from "./BarangayChatPanel";
import BarangayCommandHeader from "./BarangayCommandHeader";
import { useBarangayOps } from "./BarangayOpsProvider";
import BarangayPlanningPanel from "./BarangayPlanningPanel";
import BarangaySidebar from "./BarangaySidebar";
import BarangayTransparencyPanel from "./BarangayTransparencyPanel";
import BarangayWeatherPanel from "./BarangayWeatherPanel";
import DispatchTanodDialog from "./DispatchTanodDialog";
import DrrmOpsView from "./DrrmOpsView";
import EvacuationCentersPanel from "./EvacuationCentersPanel";
import IncidentReportsPanel from "./IncidentReportsPanel";
import OperationsGridPanel from "./OperationsGridPanel";
import ReliefGoodsPanel from "./ReliefGoodsPanel";
import RiverSensorsPanel from "./RiverSensorsPanel";
import SafetyCommunityPanel from "./SafetyCommunityPanel";
import TanodPatrolsPanel from "./TanodPatrolsPanel";

export interface IBarangayWorkspaceProps {
  /** The official's OWN barangay (from the server session). */
  barangay: string;
  municipality: string;
  province: string;
  /** Signed-in official's name (sidebar + audit WHO). */
  name?: string;
}

/** Municipality center from the onboarding dataset (weather + map). */
function municipalityCenter(province: string, municipality: string) {
  for (const region of PH_REGIONS) {
    const p = region.provinces.find((x) => x.name === province);
    const m = p?.municipalities.find((x) => x.name === municipality);
    if (m) {
      return { lat: m.lat, lon: m.lon };
    }
  }
  return DEFAULT_BARANGAY_CENTER;
}

/**
 * Barangay Official workspace (must render inside BarangayOpsProvider).
 * Sidebar with the official's own role only + barangay-scope modules; the
 * Stitch tab bar (Operations Grid, Evacuation, Tanod, River, Relief,
 * Incident Reports); and working panels for M1, M2, M3/M7, M4, M5, M6, M10,
 * M11 + audit log. Emergency state comes from useAlerts.
 */
export default function BarangayWorkspace({
  barangay,
  municipality,
  province,
  name,
}: IBarangayWorkspaceProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const { state: alertState } = useAlerts();
  const [view, setView] = useState<IBarangayView>("ops");
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchTeam, setDispatchTeam] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);

  const alert = alertState?.hasActiveHazard ? alertState.alert : null;
  const center = municipalityCenter(province, municipality);

  // Safety overrides normal flow: a raised signal (≥2) auto-activates the
  // barangay pre-disaster checklist (audited once).
  const needsActivation = Boolean(alert && alert.signalLevel >= 2 && !state.checklistActivatedAt);
  const signal = alert?.signalLevel ?? 0;
  useEffect(() => {
    if (!needsActivation) {
      return;
    }
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        update((s, now) => activateChecklist(s, now), {
          what: t("brgy.audit.checklistAuto", { signal }),
          category: "drrm",
        });
      }
    });
    return () => {
      active = false;
    };
  }, [needsActivation, signal, update, t]);

  // Auto-hide the dispatch confirmation.
  useEffect(() => {
    if (!toast) {
      return;
    }
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  function openDispatch(teamId?: string) {
    setDispatchTeam(teamId);
    setDispatchOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <BarangaySidebar activeView={view} onSelectView={setView} barangay={barangay} name={name} />

      <div className="min-w-0 flex-1 space-y-4">
        <BarangayCommandHeader
          barangay={barangay}
          municipality={municipality}
          province={province}
          alert={alert}
          alertSource={alertState?.source}
          onDispatch={() => openDispatch()}
        />

        {toast ? (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white">
            <Icon name="check" size={16} />
            {toast}
          </p>
        ) : null}

        <div
          role="tablist"
          aria-label={t("brgy.tabsLabel")}
          className="flex gap-1 overflow-x-auto rounded-xl bg-cmd-surface p-1.5"
        >
          {BARANGAY_TABS.map((tab) => {
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setView(tab.id)}
                className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  isActive ? "bg-teal text-white" : "text-cmd-muted hover:bg-cmd-tile hover:text-cmd-heading"
                }`}
              >
                <Icon name={tab.icon} size={16} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-label={t("brgy.tabsLabel")}>
          {view === "ops" ? (
            <OperationsGridPanel barangay={barangay} municipality={municipality} onSelectView={setView} />
          ) : view === "evacuation" ? (
            <EvacuationCentersPanel barangay={barangay} />
          ) : view === "tanod" ? (
            <TanodPatrolsPanel barangay={barangay} onDispatch={openDispatch} />
          ) : view === "river" ? (
            <RiverSensorsPanel barangay={barangay} />
          ) : view === "relief" ? (
            <ReliefGoodsPanel barangay={barangay} />
          ) : view === "reports" ? (
            <IncidentReportsPanel barangay={barangay} />
          ) : view === "chat" ? (
            <BarangayChatPanel />
          ) : view === "weather" ? (
            <BarangayWeatherPanel municipality={municipality} province={province} lat={center.lat} lon={center.lon} />
          ) : view === "drrm" ? (
            <DrrmOpsView barangay={barangay} municipality={municipality} emergency={Boolean(alert)} />
          ) : view === "safety" ? (
            <SafetyCommunityPanel barangay={barangay} alert={alert} onSelectView={setView} />
          ) : view === "agriculture" ? (
            <AgricultureAreaPanel barangay={barangay} />
          ) : view === "planning" ? (
            <BarangayPlanningPanel barangay={barangay} />
          ) : view === "analytics" ? (
            <BarangayAnalyticsPanel
              barangay={barangay}
              municipality={municipality}
              province={province}
              lat={center.lat}
              lon={center.lon}
            />
          ) : view === "transparency" ? (
            <BarangayTransparencyPanel barangay={barangay} municipality={municipality} onSelectView={setView} />
          ) : (
            <AuditLogPanel barangay={barangay} />
          )}
        </div>
      </div>

      {dispatchOpen ? (
        <DispatchTanodDialog
          key={dispatchTeam ?? "any"}
          open={dispatchOpen}
          initialTeamId={dispatchTeam}
          onClose={() => setDispatchOpen(false)}
          onDispatched={(msg) => {
            setToast(msg);
            setView("tanod");
          }}
        />
      ) : null}
    </div>
  );
}
