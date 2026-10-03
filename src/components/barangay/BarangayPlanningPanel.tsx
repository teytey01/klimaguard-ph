"use client";

import { useState } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";

import { useLanguage } from "@/components/common";
import {
  advanceCdra,
  CDRA_TOTAL_STEPS,
  LCCAP_TOTAL_SECTIONS,
  NEXT_DEADLINE,
  percent,
  PLANNING_ROWS,
  widthClass,
} from "@/lib/barangay";
import BarangayCard from "./BarangayCard";
import BarangayInfoRows from "./BarangayInfoRows";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IBarangayPlanningPanelProps {
  barangay: string;
}

/**
 * M6 barangay-scope planning (one compact panel): hazard profile,
 * projections, own SGLG score, CDRA + LCCAP progress rows, next deadline.
 * Action: mark the next CDRA step done (audited). No CLUP / CCET (municipal).
 */
export default function BarangayPlanningPanel({ barangay }: IBarangayPlanningPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const [today] = useState(() => new Date());
  const days = differenceInCalendarDays(addDays(today, NEXT_DEADLINE.daysFromNow), today);
  const reminder = days <= 7 ? 7 : days <= 15 ? 15 : 30;

  const progress = [
    { label: t("brgy.plan.cdraTitle"), done: state.cdraStepsDone, total: CDRA_TOTAL_STEPS },
    { label: t("brgy.plan.lccapTitle"), done: state.lccapSectionsDone, total: LCCAP_TOTAL_SECTIONS },
  ];

  return (
    <BarangayCard
      title={t("brgy.plan.title")}
      icon="map"
      badge={t("brgy.plan.reminder", { days: reminder })}
      source={t("brgy.source.ops", { barangay })}
    >
      <p className="mb-2 text-xs text-cmd-muted">{t("brgy.plan.scopeNote")}</p>
      <BarangayInfoRows rows={PLANNING_ROWS} />
      <ul className="mt-2 space-y-1.5">
        {progress.map((p) => (
          <li key={p.label} className="rounded-lg bg-cmd-tile px-3 py-2 text-sm">
            <p className="flex justify-between gap-2 text-cmd-heading">
              <span>{p.label}</span>
              <span className="text-cmd-muted">
                {p.done}/{p.total}
              </span>
            </p>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cmd-surface">
              <div className={`h-full rounded-full bg-teal ${widthClass(percent(p.done, p.total))}`} />
            </div>
          </li>
        ))}
        <li className="rounded-lg bg-cmd-tile px-3 py-2 text-sm text-cmd-heading">
          {NEXT_DEADLINE.label} · {t("brgy.plan.daysLeft", { days })}
        </li>
      </ul>
      <button
        type="button"
        disabled={state.cdraStepsDone >= CDRA_TOTAL_STEPS}
        onClick={() =>
          update((s) => advanceCdra(s), {
            what: t("brgy.audit.cdra", { step: state.cdraStepsDone + 1, state: t("brgy.done") }),
            category: "planning",
          })
        }
        className="mt-3 min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {t("brgy.plan.cdraNext")}
      </button>
    </BarangayCard>
  );
}
