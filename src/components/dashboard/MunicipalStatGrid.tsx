"use client";

import { useLanguage } from "@/components/common";
import {
  MUN_AGENCIES,
  MUN_BARANGAY_COUNT,
  MUN_CDRA,
  MUN_FLOOD_PROJECT_IDS,
  MUN_HYDRO,
  MUN_SOURCE,
} from "@/lib/dashboard/dashboardData";
import { evacTotals, fundSummary, totalAffectedHouseholds } from "@/lib/dashboard/municipalSelectors";
import { formatCount, formatPhpShort } from "@/lib/dashboard/municipalFormat";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { ICommandStat } from "@/types";
import CommandStatCard from "./CommandStatCard";

export type IMunicipalStatGridProps = Record<string, never>;

/** The 9 Stitch stat cards, every number derived from the live store. */
export default function MunicipalStatGrid() {
  const { t } = useLanguage();
  const { state } = useMunicipalStore();
  const evac = evacTotals(state);
  const fund = fundSummary();
  const hub = evac.primaryHub;
  const floodProjects = state.projects.filter((p) => MUN_FLOOD_PROJECT_IDS.includes(p.id));
  const synced = MUN_AGENCIES.filter((a) => a.status === "synced").length;

  const stats: ICommandStat[] = [
    {
      id: "affected",
      label: t("mun.stat.affected"),
      value: formatCount(totalAffectedHouseholds(state)),
      unit: t("mun.card.households"),
      detail: t("mun.stat.affectedDetail", { count: MUN_BARANGAY_COUNT }),
      badge: t("mun.stat.affectedBadge"),
      tone: "caution",
      trend: "up",
      icon: "users",
    },
    {
      id: "shelters",
      label: t("mun.stat.shelters"),
      value: `${evac.openCount}/${evac.total}`,
      unit: t("mun.stat.sheltersUnit"),
      detail: t("mun.stat.sheltersDetail", {
        pct: evac.pct,
        beds: formatCount(evac.bedsRemaining),
        occ: formatCount(evac.occupied),
        cap: formatCount(evac.capacity),
        hub: hub?.name ?? "—",
        hubStatus: hub ? t(`mun.evac.${hub.status}` as const).toUpperCase() : "",
      }),
      badge: `${evac.pct}%`,
      tone: evac.pct >= 85 ? "critical" : "caution",
      trend: "up",
      icon: "home",
    },
    {
      id: "ldrrmf",
      label: t("mun.stat.ldrrmf"),
      value: `${fund.pct}%`,
      unit: t("mun.stat.ldrrmfUnit"),
      detail: t("mun.stat.ldrrmfDetail", {
        spent: formatPhpShort(fund.spent),
        alloc: formatPhpShort(fund.allocated),
        qrf: formatPhpShort(fund.qrf),
        mit: formatPhpShort(fund.mitigation),
      }),
      badge: "COA TIER-1",
      tone: "good",
      trend: "flat",
      icon: "chart",
    },
    {
      id: "cdra",
      label: t("mun.stat.cdra"),
      value: t("mun.stat.cdraValue"),
      unit: t("mun.stat.cdraUnit"),
      detail: t("mun.stat.cdraDetail", { score: MUN_CDRA.score, pct: MUN_CDRA.thresholdPct }),
      badge: `${MUN_CDRA.score}/10`,
      tone: "good",
      trend: "down",
      icon: "shield",
    },
    {
      id: "hydro",
      label: t("mun.stat.hydro"),
      value: MUN_HYDRO.levelM.toFixed(2),
      unit: "m",
      detail: t("mun.stat.hydroDetail", {
        crit: MUN_HYDRO.criticalM.toFixed(2),
        margin: MUN_HYDRO.marginM.toFixed(2),
        tide: MUN_HYDRO.tidePeakM.toFixed(2),
        at: MUN_HYDRO.tidePeakAt,
        rate: MUN_HYDRO.rateMPerHr.toFixed(2),
      }),
      badge: t("mun.stat.badgeLink"),
      tone: "good",
      trend: "down",
      icon: "water",
    },
    {
      id: "depo",
      label: t("mun.stat.depo"),
      value: formatCount(state.depot.foodPacks),
      unit: t("mun.stat.depoUnit"),
      detail: t("mun.stat.depoDetail", { kits: formatCount(state.depot.waterKits) }),
      badge: "DEPO A",
      tone: "info",
      trend: "flat",
      icon: "box",
    },
    {
      id: "flood",
      label: t("mun.stat.flood"),
      value: String(floodProjects.filter((p) => p.status !== "completed").length),
      unit: t("mun.stat.floodUnit"),
      detail: floodProjects.map((p) => `${p.name} ${p.completionPct}%`).join(" · "),
      badge: t("mun.stat.badgeActive"),
      tone: "caution",
      trend: "up",
      icon: "building",
    },
    {
      id: "assets",
      label: t("mun.stat.assets"),
      value: String(state.depot.rescueTrucks + state.depot.rubberBoats),
      unit: t("mun.stat.assetsUnit"),
      detail: t("mun.stat.assetsDetail", {
        trucks: state.depot.rescueTrucks,
        boats: state.depot.rubberBoats,
      }),
      badge: t("mun.stat.badgeActive"),
      tone: "info",
      trend: "flat",
      icon: "truck",
    },
    {
      id: "uplink",
      label: t("mun.stat.uplink"),
      value: t("mun.stat.uplinkValue"),
      detail: t("mun.stat.uplinkDetail", { synced, total: MUN_AGENCIES.length }),
      badge: t("mun.stat.badgeLink"),
      tone: "good",
      trend: "flat",
      icon: "link",
    },
  ];

  return (
    <section aria-label={t("mun.sec.stats")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <CommandStatCard key={stat.id} stat={stat} />
        ))}
      </div>
      <p className="mt-2 text-right text-[11px] text-cmd-muted">{MUN_SOURCE}</p>
    </section>
  );
}
