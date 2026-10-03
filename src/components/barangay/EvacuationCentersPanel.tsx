"use client";

import { useLanguage } from "@/components/common";
import BarangayEvacCenterCard from "./BarangayEvacCenterCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IEvacuationCentersPanelProps {
  barangay: string;
}

/** M3/M7: the barangay's OWN evacuation centers, with live occupancy edits. */
export default function EvacuationCentersPanel({ barangay }: IEvacuationCentersPanelProps) {
  const { t } = useLanguage();
  const { state } = useBarangayOps();

  const active = state.centers.filter((c) => c.active);
  const occ = active.reduce((s, c) => s + c.occupancy, 0);
  const cap = active.reduce((s, c) => s + c.capacity, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-cmd-heading">{t("brgy.evac.title")}</h2>
        <p className="text-sm text-cmd-muted">{t("brgy.evac.subtitle")}</p>
        <p className="mt-1 text-sm font-medium text-teal">
          {t("brgy.evac.total", { occ, cap, remaining: cap - occ })}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {state.centers.map((center) => (
          // Keyed on occupancy so the edit field resyncs after outside changes.
          <BarangayEvacCenterCard
            key={`${center.id}-${center.occupancy}`}
            center={center}
            barangay={barangay}
          />
        ))}
      </div>
    </div>
  );
}
