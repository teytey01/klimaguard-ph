"use client";

import { useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import { useNow } from "@/hooks";
import {
  agoKey,
  logRiverReading,
  manilaTime,
  percent,
  riverStatus,
  sparklinePoints,
  trendPerHour,
  widthClass,
} from "@/lib/barangay";
import BarangayCard from "./BarangayCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IRiverSensorsPanelProps {
  barangay: string;
}

/**
 * River gauge vs thresholds, 6-hour trend + sparkline, history, and a manual
 * gauge reading input. Alert/critical levels switch to emergency styling
 * with an evacuation instruction (safety overrides the normal flow).
 */
export default function RiverSensorsPanel({ barangay }: IRiverSensorsPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const now = useNow(5000);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);

  const river = state.river;
  const status = riverStatus(river);
  const isAlert = status === "alert" || status === "critical";
  const rate = trendPerHour(river.history.slice(-7));
  const ping = agoKey(river.lastPingAt, now);
  const levelPct = percent(river.levelM, river.criticalM);
  const markers = [
    { m: river.normalMaxM, cls: "bg-cmd-accent" },
    { m: river.alertM, cls: "bg-alert/70" },
  ];

  function logReading(e: React.FormEvent) {
    e.preventDefault();
    const level = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(level) || level < 0 || level > 10) {
      setError(true);
      return;
    }
    setError(false);
    setDraft("");
    update((s, at) => logRiverReading(s, level, at), {
      what: t("brgy.audit.river", { level: level.toFixed(2) }),
      category: "river",
    });
  }

  return (
    <div className="space-y-4">
      {isAlert ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-alert p-4 text-white">
          <span className="mt-0.5 shrink-0">
            <Icon name="alert-triangle" size={18} />
          </span>
          <p className="text-sm font-semibold">
            {t("brgy.river.evacAdvice", { level: river.levelM.toFixed(2) })}
          </p>
        </div>
      ) : status === "watch" ? (
        <p role="status" className="rounded-xl bg-cmd-accent p-4 text-sm font-semibold text-cmd-accent-text">
          {t("brgy.river.watchAdvice")}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarangayCard
          title={`${t("brgy.river.title")} · ${river.id}`}
          icon="water"
          badge={t("brgy.river.live", { id: river.id })}
          tone={isAlert ? "alert" : "normal"}
          source={t("brgy.source.ops", { barangay })}
        >
          <p className="text-xs text-cmd-muted">{t("brgy.river.level")}</p>
          <p className={`text-4xl font-bold ${isAlert ? "text-alert" : "text-cmd-heading"}`}>
            {river.levelM.toFixed(2)}m
          </p>
          <p className={`mt-1 text-sm font-semibold ${isAlert ? "text-alert" : status === "watch" ? "text-cmd-heading" : "text-teal"}`}>
            {t(`brgy.river.status.${status}`)}
          </p>

          {/* Level vs thresholds */}
          <div className="relative mt-4 h-3 w-full overflow-hidden rounded-full bg-cmd-tile">
            <div
              role="meter"
              aria-valuenow={river.levelM}
              aria-valuemin={0}
              aria-valuemax={river.criticalM}
              aria-label={t("brgy.river.level")}
              className={`h-full rounded-full ${
                isAlert ? "bg-alert" : status === "watch" ? "bg-cmd-accent" : "bg-teal"
              } ${widthClass(levelPct)}`}
            />
            {markers.map((mk) => (
              <span
                key={mk.m}
                aria-hidden="true"
                className={`absolute top-0 h-full w-0.5 ${mk.cls} ${markerLeft(percent(mk.m, river.criticalM))}`}
              />
            ))}
          </div>
          <div className="mt-1 flex flex-wrap justify-between gap-1 text-[11px] text-cmd-muted">
            <span>{t("brgy.river.thrNormal", { m: river.normalMaxM.toFixed(2) })}</span>
            <span>{t("brgy.river.thrAlert", { m: river.alertM.toFixed(2) })}</span>
            <span>{t("brgy.river.thrCritical", { m: river.criticalM.toFixed(2) })}</span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-cmd-tile px-3 py-2">
            <span className="text-sm text-cmd-heading">
              {t("brgy.river.trend", { rate: `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}` })}
            </span>
            <svg viewBox="0 0 120 32" className="h-8 w-28 shrink-0" aria-hidden="true">
              <polyline
                points={sparklinePoints(river.history, 120, 30)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isAlert ? "text-alert" : "text-teal"}
              />
            </svg>
          </div>
          <p className="mt-2 text-xs text-cmd-muted">
            {t("brgy.river.station")}: {river.station} ·{" "}
            {t("brgy.river.ping", { ago: t(ping.key, { n: ping.n }) })}
          </p>

          <form onSubmit={logReading} className="mt-4 flex flex-wrap items-end gap-2" noValidate>
            <label className="min-w-[160px] flex-1 text-xs font-medium text-cmd-muted">
              {t("brgy.river.logLabel")}
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                max={10}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-invalid={error}
                className="mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
              />
            </label>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              {t("brgy.river.logButton")}
            </button>
          </form>
          {error ? (
            <p role="alert" className="mt-1 text-xs text-alert">
              {t("brgy.river.logError")}
            </p>
          ) : null}
        </BarangayCard>

        <BarangayCard
          title={t("brgy.river.history")}
          icon="chart"
          source={t("brgy.source.ops", { barangay })}
        >
          <ol className="space-y-1.5 text-sm">
            {[...river.history].reverse().slice(0, 3).map((r) => {
              const s = riverStatus({ ...river, levelM: r.levelM });
              const alertRow = s === "alert" || s === "critical";
              return (
                <li
                  key={r.at}
                  className="flex items-center justify-between gap-2 rounded-lg bg-cmd-tile px-3 py-2"
                >
                  <span className="text-cmd-muted">{manilaTime(r.at)} PST</span>
                  <span className={`font-semibold ${alertRow ? "text-alert" : "text-cmd-heading"}`}>
                    {r.levelM.toFixed(2)} m
                  </span>
                </li>
              );
            })}
          </ol>
        </BarangayCard>
      </div>
    </div>
  );
}

/**
 * Snap a threshold marker position to a static left-offset class (listed so
 * Tailwind generates them): left-[0%] left-[10%] left-[20%] left-[30%]
 * left-[40%] left-[50%] left-[60%] left-[70%] left-[80%] left-[90%] left-[100%]
 * left-[55%] left-[65%] left-[75%] left-[85%] left-[95%] left-[5%] left-[15%]
 * left-[25%] left-[35%] left-[45%]
 */
function markerLeft(pct: number): string {
  const snapped = Math.min(100, Math.max(0, Math.round(pct / 5) * 5));
  return `left-[${snapped}%]`;
}
