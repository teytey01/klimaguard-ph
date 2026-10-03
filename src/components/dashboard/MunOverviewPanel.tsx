"use client";

import { useLanguage } from "@/components/common";
import { MUN_AGENCIES, MUN_SITE_TILES } from "@/lib/dashboard/dashboardData";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IMunModuleTab } from "@/types";
import AgencySyncPanel from "./AgencySyncPanel";
import MunCollapsibleSection from "./MunCollapsibleSection";
import MunEmergencyPanel from "./MunEmergencyPanel";
import MunicipalDashboardCards from "./MunicipalDashboardCards";
import MunicipalDirectivePanel from "./MunicipalDirectivePanel";
import MunicipalRiverMonitor from "./MunicipalRiverMonitor";
import MunicipalSiteTile from "./MunicipalSiteTile";
import MunicipalStatGrid from "./MunicipalStatGrid";

export interface IMunOverviewPanelProps {
  onNavigate: (tab: IMunModuleTab, anchor?: string) => void;
}

/**
 * Overview tab. Emergency coordination renders FIRST when the protocol is
 * active (safety overrides normal flow), then the dashboard cards, the 3
 * field tiles, the 9 Stitch stat cards, river monitor, directives, uplink.
 */
export default function MunOverviewPanel({ onNavigate }: IMunOverviewPanelProps) {
  const { t } = useLanguage();
  const { state } = useMunicipalStore();

  return (
    <div className="space-y-5">
      {/* Safety overrides: emergency coordination stays first and uncollapsed. */}
      {state.emergencyActive ? <MunEmergencyPanel onNavigate={onNavigate} /> : null}

      {/* At-a-glance KPI summary stays directly visible. */}
      <MunicipalDashboardCards onNavigate={onNavigate} />

      {/* Secondary detail collapsed by default to reduce cognitive load. */}
      <MunCollapsibleSection title={t("mun.sec.tiles")} icon="radio">
        <section
          aria-label={t("mun.sec.tiles")}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {MUN_SITE_TILES.map((tile) => (
            <MunicipalSiteTile key={tile.id} tile={tile} />
          ))}
        </section>
      </MunCollapsibleSection>

      <MunCollapsibleSection title={t("mun.sec.stats")} icon="chart">
        <MunicipalStatGrid />
      </MunCollapsibleSection>

      <MunCollapsibleSection title={t("mun.sec.river")} icon="water">
        <MunicipalRiverMonitor />
      </MunCollapsibleSection>

      <MunCollapsibleSection title={t("mun.sec.directivesGroup")} icon="scroll">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <MunicipalDirectivePanel />
          <AgencySyncPanel agencies={MUN_AGENCIES} />
        </div>
      </MunCollapsibleSection>
    </div>
  );
}
