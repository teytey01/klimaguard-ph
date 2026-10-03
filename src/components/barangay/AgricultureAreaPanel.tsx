"use client";

import { useState } from "react";

import { useLanguage } from "@/components/common";
import { AGRI_ROWS, formatPeso, riverStatus, setCropDamage } from "@/lib/barangay";
import BarangayCard from "./BarangayCard";
import BarangayInfoRows from "./BarangayInfoRows";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IAgricultureAreaPanelProps {
  barangay: string;
}

/**
 * M5 area-wide advisory (one compact panel): barangay pest warning, ENSO
 * strategy, harvest timing (view only), area crop-stress (flood when the
 * river is at alert). Action: barangay crop-damage total (feeds DANA).
 */
export default function AgricultureAreaPanel({ barangay }: IAgricultureAreaPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const [damage, setDamage] = useState(String(state.cropDamagePhp));
  const [saved, setSaved] = useState(false);
  const rStatus = riverStatus(state.river);
  const floodStress = rStatus === "alert" || rStatus === "critical";

  function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Math.max(0, Math.round(Number(damage) || 0));
    setDamage(String(n));
    update((s) => setCropDamage(s, n), {
      what: t("brgy.audit.cropDamage", { amount: formatPeso(n) }),
      category: "agriculture",
    });
    setSaved(true);
  }

  return (
    <BarangayCard
      title={t("brgy.agri.title")}
      icon="sprout"
      tone={floodStress ? "alert" : "normal"}
      source={t("brgy.agri.source")}
    >
      <p className={`mb-2 text-sm ${floodStress ? "font-semibold text-alert" : "text-cmd-heading"}`}>
        {floodStress
          ? t("brgy.agri.stressFlood", { level: state.river.levelM.toFixed(2) })
          : t("brgy.agri.stressNormal")}
      </p>
      <BarangayInfoRows rows={AGRI_ROWS} />
      <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-[160px] flex-1 text-xs font-medium text-cmd-muted">
          {t("brgy.agri.damageTitle")}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={damage}
            onChange={(e) => {
              setSaved(false);
              setDamage(e.target.value);
            }}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
          />
        </label>
        <button type="submit" className="min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white">
          {t("brgy.save")}
        </button>
      </form>
      <p className="mt-1 text-xs text-cmd-muted" role="status">
        {saved ? t("brgy.saved") : t("brgy.agri.damageNote")} · {barangay}
      </p>
    </BarangayCard>
  );
}
