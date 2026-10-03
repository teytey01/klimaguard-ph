"use client";

import { useState } from "react";

import { useLanguage } from "@/components/common";
import { setPopulation } from "@/lib/barangay";
import type { IBarangayPopulation } from "@/types";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IBarangayPopulationRowProps {
  row: IBarangayPopulation;
}

const FIELD_CLASS =
  "mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-surface px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15";

/** One purok row: fixed counts plus editable evacuated / unaccounted. */
export default function BarangayPopulationRow({ row }: IBarangayPopulationRowProps) {
  const { t } = useLanguage();
  const { update } = useBarangayOps();
  const [evacuated, setEvacuated] = useState(String(row.evacuated));
  const [unaccounted, setUnaccounted] = useState(String(row.unaccounted));

  function save(e: React.FormEvent) {
    e.preventDefault();
    const ev = Math.min(row.individuals, Math.max(0, Math.round(Number(evacuated) || 0)));
    const un = Math.min(row.individuals, Math.max(0, Math.round(Number(unaccounted) || 0)));
    if (ev === row.evacuated && un === row.unaccounted) {
      return;
    }
    update((s) => setPopulation(s, row.purok, { evacuated: ev, unaccounted: un }), {
      what: t("brgy.audit.population", { purok: row.purok, evacuated: ev, unaccounted: un }),
      category: "drrm",
    });
  }

  return (
    <li className="rounded-lg bg-cmd-tile p-3">
      <p className="text-sm font-semibold text-cmd-heading">
        {row.purok} ({row.label})
      </p>
      <p className="text-xs text-cmd-muted">
        {t("brgy.ops.individuals", { count: row.individuals, families: row.families })} ·{" "}
        {t("brgy.pop.vulnerable")}: {row.vulnerable}
      </p>
      <form onSubmit={save} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="text-[11px] font-medium text-cmd-muted">
          {t("brgy.pop.evacuated")}
          <input
            type="number"
            min={0}
            max={row.individuals}
            value={evacuated}
            onChange={(e) => setEvacuated(e.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <label className="text-[11px] font-medium text-cmd-muted">
          {t("brgy.pop.unaccounted")}
          <input
            type="number"
            min={0}
            max={row.individuals}
            value={unaccounted}
            onChange={(e) => setUnaccounted(e.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <button
          type="submit"
          className="col-span-2 min-h-[44px] self-end rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90 sm:col-span-1"
        >
          {t("brgy.save")}
        </button>
      </form>
    </li>
  );
}
