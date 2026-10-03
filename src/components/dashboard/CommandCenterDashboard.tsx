import type { IMunicipalDashboardData } from "@/types";
import BudgetTracker from "@/components/transparency/BudgetTracker";
import ProjectTracker from "@/components/transparency/ProjectTracker";
import { toTransparencyData } from "@/lib/dashboard/municipalSelectors";
import OperationalSummaryBar from "./OperationalSummaryBar";
import ModuleNavBar from "./ModuleNavBar";
import CommandStatCard from "./CommandStatCard";
import EvacuationStatusPanel from "./EvacuationStatusPanel";
import ReliefLogisticsPanel from "./ReliefLogisticsPanel";
import AgencySyncPanel from "./AgencySyncPanel";
import CommandDirectivePanel from "./CommandDirectivePanel";

export interface ICommandCenterDashboardProps {
  data: IMunicipalDashboardData;
  /** Optional live weather snippet (e.g. "31°C · Maaraw") from useWeather. */
  weatherLine?: string;
}

/**
 * The full MDRRMO Municipal Command Center composite (Municipal Official view).
 * Assembles the operational summary bar, 11-module nav, headline stat grid,
 * and the operations panels (evacuation, relief, inter-agency, LDRRMF
 * breakdown, command directives). Dark command-center vibe from the Figma
 * design; mobile-first responsive grid.
 */
export default function CommandCenterDashboard({
  data,
  weatherLine,
}: ICommandCenterDashboardProps) {
  const transparencyData = toTransparencyData(data);

  return (
    <div className="space-y-5">
      <OperationalSummaryBar
        summary={data.summary}
        weatherLine={weatherLine}
        fetchedAt={data.fetchedAt}
      />

      <ModuleNavBar modules={data.modules} />

      {/* Headline stat grid — mobile-first: 1 col → 2 → 3. */}
      <section
        aria-label="Mga pangunahing sukatan ng munisipyo"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {data.stats.map((stat) => (
          <CommandStatCard key={stat.id} stat={stat} />
        ))}
      </section>

      {/* Operations panels. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <EvacuationStatusPanel centers={data.evacuation} />
        <div className="space-y-5">
          <ReliefLogisticsPanel relief={data.relief} />
          <AgencySyncPanel agencies={data.agencies} />
        </div>
      </div>

      {/* LDRRMF breakdown (reuses the existing official BudgetTracker) +
          command directives. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BudgetTracker data={transparencyData} context="official" />
        <CommandDirectivePanel directives={data.directives} />
      </div>

      {/* M11 per-project transparency (all barangays in the municipality). */}
      <ProjectTracker />

      <p className="pt-1 text-center text-xs text-text-muted">{data.source}</p>
    </div>
  );
}
