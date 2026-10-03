"use client";

import { useLanguage } from "@/components/common";
import BarangayCard from "./BarangayCard";
import BarangayPopulationRow from "./BarangayPopulationRow";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IAffectedPopulationPanelProps {
  barangay: string;
}

/** M3/M7 affected population tracker — the official's barangay only. */
export default function AffectedPopulationPanel({ barangay }: IAffectedPopulationPanelProps) {
  const { t } = useLanguage();
  const { state } = useBarangayOps();
  const sum = (k: "individuals" | "families" | "vulnerable" | "evacuated" | "unaccounted") =>
    state.population.reduce((s, p) => s + p[k], 0);

  return (
    <BarangayCard
      title={t("brgy.pop.title")}
      icon="users"
      badge={t("brgy.badge.monitored")}
      tone={sum("unaccounted") > 0 ? "alert" : "normal"}
      source={t("brgy.source.ops", { barangay })}
    >
      <ul className="space-y-2">
        {state.population.map((p) => (
          <BarangayPopulationRow key={`${p.purok}-${p.evacuated}-${p.unaccounted}`} row={p} />
        ))}
      </ul>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        {(
          [
            ["individuals", "brgy.pop.individuals"],
            ["families", "brgy.pop.families"],
            ["vulnerable", "brgy.pop.vulnerable"],
            ["evacuated", "brgy.pop.evacuated"],
            ["unaccounted", "brgy.pop.unaccounted"],
          ] as const
        ).map(([k, label]) => (
          <div key={k} className="rounded-lg bg-cmd-tile p-2 text-center">
            <dt className="text-[11px] text-cmd-muted">
              {t("brgy.pop.total")} · {t(label)}
            </dt>
            <dd
              className={`font-semibold ${
                k === "unaccounted" && sum(k) > 0 ? "text-alert" : "text-cmd-heading"
              }`}
            >
              {sum(k).toLocaleString("en-PH")}
            </dd>
          </div>
        ))}
      </dl>
    </BarangayCard>
  );
}
