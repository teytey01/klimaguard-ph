"use client";

import { useLanguage } from "@/components/common";
import {
  MUN_CROP_DAMAGE_TREND,
  MUN_DISASTER_HISTORY,
  MUN_PROJECTIONS,
  MUN_SOURCE,
  type IMunTrendRow,
} from "@/lib/dashboard/dashboardData";
import { complianceRanking, fundSummary, riskRanking } from "@/lib/dashboard/municipalSelectors";
import { pct } from "@/lib/dashboard/municipalFormat";
import { MUN_CHIP } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import { useMunicipalWeather } from "@/lib/dashboard/useMunicipalWeather";
import type { IMunHazard } from "@/types";
import MunSection from "./MunSection";
import MunBar from "./MunBar";
import type { IMunBarTone } from "./MunBar";

export type IMunAnalyticsPanelProps = Record<string, never>;

const ROW = "rounded-lg bg-cmd-tile p-3";
const ROW_TITLE = "text-[11px] font-bold uppercase tracking-wide text-cmd-muted";
const HAZARDS: IMunHazard[] = ["flood", "landslide", "storm-surge", "liquefaction"];

/** Render a labelled bar list (plain helper, not a component). */
function bars(rows: IMunTrendRow[], tone: IMunBarTone = "teal") {
  return (
    <ul className="mt-1 space-y-1">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-2 text-xs text-cmd-heading">
            <span>{r.label}</span>
            <span className="font-semibold">{r.value}</span>
          </div>
          <MunBar pct={r.magnitudePct} label={`${r.label}: ${r.value}`} tone={tone} />
        </li>
      ))}
    </ul>
  );
}

/**
 * M10 Analytics (municipal-wide), compact read-only panel: weather trend,
 * hazard map grid, cross-barangay risk, disaster history, projections, DRRM
 * fund utilization (municipal + barangays), crop damage, compliance ranking.
 */
export default function MunAnalyticsPanel() {
  const { t } = useLanguage();
  const { state } = useMunicipalStore();
  const weather = useMunicipalWeather();
  const fund = fundSummary();

  const weatherRows: IMunTrendRow[] = (weather.data?.daily ?? []).slice(0, 5).map((d) => ({
    label: d.date.slice(5),
    value: `${Math.round(d.highC)}° / ${Math.round(d.lowC)}° · ${d.rainMm.toFixed(0)} mm`,
    magnitudePct: Math.min(100, Math.round((d.highC / 40) * 100)),
  }));
  const riskRows: IMunTrendRow[] = riskRanking(state).map((b) => ({
    label: b.name,
    value: `${b.riskIndex.toFixed(1)}/10`,
    magnitudePct: b.riskIndex * 10,
  }));
  const fundRows: IMunTrendRow[] = [
    { label: t("mun.misc.municipalWide"), value: `${fund.pct}%`, magnitudePct: fund.pct },
    ...state.barangays.map((b) => {
      const p = pct(b.ldrrmfSpent, b.ldrrmfAllocated);
      return { label: `Brgy. ${b.name}`, value: `${p}%`, magnitudePct: p };
    }),
  ];
  const complianceRows: IMunTrendRow[] = complianceRanking(state).map((b, i) => ({
    label: `${i + 1}. ${b.name}`,
    value: String(b.complianceScore),
    magnitudePct: b.complianceScore,
  }));

  return (
    <MunSection title={t("mun.tab.m10")} icon="chart" source={`${MUN_SOURCE} · Open-Meteo`}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.trends")}</p>
          {weather.data ? (
            bars(weatherRows)
          ) : weather.error ? (
            <div className="mt-1">
              <p className="text-xs text-cmd-muted">{weather.error}</p>
              <button type="button" onClick={weather.retry} className={`${MUN_CHIP} mt-2`}>
                {t("mun.action.retry")}
              </button>
            </div>
          ) : (
            <ul className="mt-1 space-y-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="h-3 animate-pulse rounded bg-cmd-tile" />
              ))}
            </ul>
          )}
          <p className={`${ROW_TITLE} mt-3`}>{t("mun.sec.projections")}</p>
          {bars(MUN_PROJECTIONS, "accent")}
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.hazardMatrix")}</p>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full min-w-[320px] text-xs">
              <thead>
                <tr>
                  <th className="py-1 text-left text-cmd-muted">{t("mun.f.barangay")}</th>
                  {HAZARDS.map((h) => (
                    <th key={h} className="py-1 text-center text-cmd-muted">
                      {t(`mun.hazard.${h}` as const)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.barangays.map((b) => (
                  <tr key={b.id}>
                    <td className="py-1 text-cmd-heading">{b.name}</td>
                    {HAZARDS.map((h) => (
                      <td key={h} className="py-1 text-center">
                        {b.hazards.includes(h) ? (
                          <span className="inline-block size-3 rounded-full bg-alert" aria-label={t(`mun.hazard.${h}` as const)} />
                        ) : (
                          <span className="text-cmd-muted">·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`${ROW_TITLE} mt-3`}>{t("mun.sec.riskCompare")}</p>
          {bars(riskRows, "alert")}
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.fundUtil")}</p>
          {bars(fundRows, "navy")}
          <p className={`${ROW_TITLE} mt-3`}>{t("mun.sec.ranking")}</p>
          {bars(complianceRows)}
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.history")}</p>
          {bars(MUN_DISASTER_HISTORY, "alert")}
          <p className={`${ROW_TITLE} mt-3`}>{t("mun.sec.cropTrend")}</p>
          {bars(MUN_CROP_DAMAGE_TREND, "accent")}
        </div>
      </div>
    </MunSection>
  );
}
