"use client";

import { useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import {
  evacStatus,
  percent,
  setOccupancy,
  toggleCenterActive,
  widthClass,
} from "@/lib/barangay";
import type { IBarangayEvacCenter, IBarangayEvacStatus } from "@/types";
import BarangayCard from "./BarangayCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IBarangayEvacCenterCardProps {
  center: IBarangayEvacCenter;
  barangay: string;
}

const STATUS_TONE: Record<IBarangayEvacStatus, string> = {
  standby: "bg-cmd-tile text-cmd-muted",
  open: "bg-teal/15 text-teal",
  "near-full": "bg-cmd-accent text-cmd-accent-text",
  full: "bg-alert text-white",
};

const BAR_TONE: Record<IBarangayEvacStatus, string> = {
  standby: "bg-cmd-muted",
  open: "bg-teal",
  "near-full": "bg-cmd-accent",
  full: "bg-alert",
};

const STEP_BUTTON =
  "min-h-[44px] rounded-lg border border-black/10 px-3 text-sm font-semibold text-cmd-heading hover:bg-cmd-tile dark:border-white/15";

/**
 * One own evacuation center: open / near-full / full / standby status,
 * editable occupancy (clamped to capacity), and open/standby toggle. Audited.
 */
export default function BarangayEvacCenterCard({
  center,
  barangay,
}: IBarangayEvacCenterCardProps) {
  const { t } = useLanguage();
  const { update } = useBarangayOps();
  const [draft, setDraft] = useState(String(center.occupancy));
  const [blocked, setBlocked] = useState(false);
  const status = evacStatus(center);
  const pct = percent(center.occupancy, center.capacity);

  function commit(value: number) {
    if (!Number.isFinite(value)) {
      setDraft(String(center.occupancy));
      return;
    }
    const next = Math.min(center.capacity, Math.max(0, Math.round(value)));
    setDraft(String(next));
    if (next === center.occupancy) {
      return;
    }
    update((s) => setOccupancy(s, center.id, next), {
      what: t("brgy.audit.occupancy", { name: center.name, occ: next, cap: center.capacity }),
      category: "evacuation",
    });
  }

  function toggle() {
    if (center.active && center.occupancy > 0) {
      setBlocked(true);
      return;
    }
    setBlocked(false);
    update((s) => toggleCenterActive(s, center.id), {
      what: t(center.active ? "brgy.audit.centerStandby" : "brgy.audit.centerOpen", {
        name: center.name,
      }),
      category: "evacuation",
    });
  }

  return (
    <BarangayCard
      title={center.name}
      icon="home"
      badge={t(`brgy.evac.status.${status}`)}
      tone={status === "full" ? "alert" : "normal"}
      source={t("brgy.source.ops", { barangay })}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-bold text-cmd-heading">
          {center.occupancy}/{center.capacity}
        </p>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[status]}`}>
          {pct}%
        </span>
      </div>
      <p className="text-xs text-cmd-muted">
        {center.purok} · {t("brgy.evac.capacity", { cap: center.capacity })}
      </p>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cmd-tile">
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${center.name} ${t("brgy.evac.occupancy")}`}
          className={`h-full rounded-full ${BAR_TONE[status]} ${widthClass(pct)}`}
        />
      </div>

      {status === "full" ? (
        <p role="alert" className="mt-3 rounded-lg bg-alert/10 p-2 text-sm font-semibold text-alert">
          {t("brgy.evac.fullWarning", { name: center.name })}
        </p>
      ) : null}

      {center.active ? (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            commit(Number(draft));
          }}
        >
          <button type="button" onClick={() => commit(center.occupancy - 10)} className={STEP_BUTTON}>
            −10
          </button>
          <label className="min-w-[96px] flex-1 text-xs font-medium text-cmd-muted">
            {t("brgy.evac.occupancy")}
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={center.capacity}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
            />
          </label>
          <button type="button" onClick={() => commit(center.occupancy + 10)} className={STEP_BUTTON}>
            +10
          </button>
          <button
            type="submit"
            className="min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("brgy.save")}
          </button>
        </form>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-teal/40 px-3 py-2 text-sm font-semibold text-teal hover:bg-teal/10"
      >
        <Icon name={center.active ? "lock" : "home"} size={16} />
        {center.active ? t("brgy.evac.close") : t("brgy.evac.open")}
      </button>
      {blocked ? (
        <p className="mt-2 text-xs text-cmd-muted" role="status">
          {t("brgy.evac.closeBlocked")}
        </p>
      ) : null}
    </BarangayCard>
  );
}
