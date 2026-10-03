"use client";

import { useMemo } from "react";

import { useLanguage } from "@/components/common";
import { useWeather } from "@/hooks";
import {
  ANALYTICS_ROWS,
  manilaTime,
  percent,
  qrfSpent,
  widthClass,
} from "@/lib/barangay";
import type { ILocation } from "@/types";
import BarangayCard from "./BarangayCard";
import BarangayInfoRows from "./BarangayInfoRows";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IBarangayAnalyticsPanelProps {
  barangay: string;
  municipality: string;
  province: string;
  lat: number;
  lon: number;
}

/**
 * M10 barangay analytics (one compact panel): live 7-day rain trend for the
 * area, barangay flood risk + history, QRF utilization. Barangay scope only.
 */
export default function BarangayAnalyticsPanel({
  barangay,
  municipality,
  province,
  lat,
  lon,
}: IBarangayAnalyticsPanelProps) {
  const { t } = useLanguage();
  const { state } = useBarangayOps();
  const location = useMemo<ILocation>(
    () => ({ name: municipality, province, lat, lon }),
    [municipality, province, lat, lon],
  );
  const { data, isLoading, error, refetch } = useWeather(location);
  const qrfPct = percent(qrfSpent(state.qrf), state.qrf.allocated);
  const days = data?.forecast.slice(0, 7) ?? [];
  const wettest = days.reduce((m, d) => Math.max(m, d.rainChance), 0);

  return (
    <BarangayCard
      title={t("brgy.an.title")}
      icon="chart"
      source={t("brgy.an.weatherSource", {
        source: `${data?.source ?? "Open-Meteo"} · BDRRMC ${barangay}`,
        time: data ? `${manilaTime(data.fetchedAt)} PST` : "—",
      })}
    >
      <p className="mb-2 text-xs text-cmd-muted">{t("brgy.an.scopeNote")}</p>
      <div className="mb-2 rounded-lg bg-cmd-tile px-3 py-2 text-sm">
        <p className="text-[11px] font-semibold uppercase text-cmd-muted">{t("brgy.an.weatherTitle")}</p>
        {isLoading && !data ? (
          <div className="mt-1 h-5 animate-pulse rounded bg-cmd-surface" aria-hidden="true" />
        ) : error && !data ? (
          <p className="text-cmd-heading">
            {t("brgy.error.generic")}{" "}
            <button type="button" onClick={refetch} className="min-h-[44px] font-semibold text-teal underline">
              {t("brgy.retry")}
            </button>
          </p>
        ) : (
          <p className="text-cmd-heading">
            {t("brgy.an.rainChance")}: {days.map((d) => `${d.rainChance}%`).join(" · ")}
            {wettest >= 70 ? " ⚠" : ""}
          </p>
        )}
      </div>
      <BarangayInfoRows rows={ANALYTICS_ROWS} />
      <div className="mt-2 rounded-lg bg-cmd-tile px-3 py-2 text-sm">
        <p className="flex justify-between text-cmd-heading">
          <span>{t("brgy.an.fundTitle")}</span>
          <span className="text-cmd-muted">{t("brgy.an.qrfUsed", { pct: qrfPct })}</span>
        </p>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cmd-surface">
          <div className={`h-full rounded-full bg-teal ${widthClass(qrfPct)}`} />
        </div>
      </div>
    </BarangayCard>
  );
}
