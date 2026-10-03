"use client";

import { useState } from "react";
import { Icon, useLanguage } from "@/components/common";
import { DEMO_ENSO_PHASE } from "@/lib/agriculture/cropData";
import {
  MUN_CROP_CALENDAR,
  MUN_ENSO_STRATEGY,
  MUN_HARVEST_TIMING,
  MUN_LIVESTOCK_ADVISORY,
} from "@/lib/dashboard/dashboardData";
import { barangayName, municipalCropDamage, pcicTotals } from "@/lib/dashboard/municipalSelectors";
import { formatCount, formatPhp } from "@/lib/dashboard/municipalFormat";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";
import { MUN_BTN_PRIMARY, MUN_CHIP, MUN_FIELD, MUN_LABEL, MUN_TONE_CHIP } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import { useMunicipalWeather } from "@/lib/dashboard/useMunicipalWeather";
import { formatFilipinoShortDay } from "@/lib/utils/dateFilipino";
import MunSection from "./MunSection";
import MunFeedback from "./MunFeedback";

export type IMunAgriculturePanelProps = Record<string, never>;

const AGRI_SRC = "Pinagmulan: DA / PhilRice / PCIC / MAO Calamba · Open-Meteo (demo data)";
const ROW = "rounded-lg bg-cmd-tile p-3";
const ROW_TITLE = "text-[11px] font-bold uppercase tracking-wide text-cmd-muted";

/**
 * M5 Agricultural Advisory (municipal-wide), compact: crop calendar + harvest
 * timing (view only), pest warnings + municipal crop damage, crop-climate
 * stress, ENSO strategy + PCIC stats + livestock, and the working DA/RCEF
 * seed allocation action.
 */
export default function MunAgriculturePanel() {
  const { t } = useLanguage();
  const { state, actions } = useMunicipalStore();
  const weather = useMunicipalWeather();
  const [brgy, setBrgy] = useState(state.barangays[0]?.id ?? "");
  const [bags, setBags] = useState("");
  const [result, setResult] = useState<IMunStoreResult | null>(null);

  const pcic = pcicTotals(state);
  const livestock = state.barangays.reduce((s, b) => s + b.livestockHeads, 0);
  const stressDay = weather.data?.daily.find((d) => d.rainMm >= 50 || d.highC >= 35);
  const stress = !weather.data
    ? ""
    : !stressDay
      ? t("mun.misc.stressNone")
      : stressDay.rainMm >= 50
        ? t("mun.misc.stressRain", { mm: Math.round(stressDay.rainMm), day: formatFilipinoShortDay(stressDay.date) })
        : t("mun.misc.stressHeat", { temp: Math.round(stressDay.highC), day: formatFilipinoShortDay(stressDay.date) });

  return (
    <MunSection title={t("mun.tab.m5")} icon="sprout" source={AGRI_SRC}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={ROW}>
          <p className={ROW_TITLE}>
            {t("mun.sec.cropCalendar")} · {t("mun.sec.harvest")}
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-cmd-heading">
            {MUN_CROP_CALENDAR.map((c) => (
              <li key={c}>{c}</li>
            ))}
            <li>{MUN_HARVEST_TIMING}</li>
          </ul>
          <div className="mt-2 text-xs text-cmd-heading">
            <span className="font-semibold">{t("mun.sec.stress")}:</span>{" "}
            {weather.isLoading && !weather.data ? (
              <span className="inline-block h-3 w-32 animate-pulse rounded bg-cmd-tile align-middle" aria-hidden="true" />
            ) : weather.error ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="text-cmd-muted">{weather.error}</span>
                <button type="button" onClick={weather.retry} className={MUN_CHIP}>
                  {t("mun.action.retry")}
                </button>
              </span>
            ) : (
              stress
            )}
          </div>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>
            {t("mun.sec.pest")} · {t("mun.sec.cropDamage")}: {formatPhp(municipalCropDamage(state))}
          </p>
          <ul className="mt-1 space-y-1">
            {state.barangays.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 text-xs text-cmd-heading">
                <span>
                  {b.name} — {b.pestNote}
                </span>
                <span
                  className={`${MUN_CHIP} shrink-0 ${MUN_TONE_CHIP[b.pestRisk === "high" ? "critical" : b.pestRisk === "medium" ? "caution" : "good"]}`}
                >
                  {t(`mun.pest.${b.pestRisk}` as const)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>
            {t("mun.sec.ensoStrategy")} · {t(`mun.enso.${DEMO_ENSO_PHASE}` as const)}
          </p>
          <p className="mt-1 text-sm text-cmd-heading">{MUN_ENSO_STRATEGY[DEMO_ENSO_PHASE]}</p>
          <p className="mt-2 text-xs text-cmd-heading">
            <span className="font-semibold">{t("mun.sec.pcic")}:</span>{" "}
            {t("mun.misc.pcicSummary", {
              enrolled: formatCount(pcic.enrolled),
              farmers: formatCount(pcic.farmers),
              pct: pcic.pct,
            })}
          </p>
          <p className="mt-1 text-xs text-cmd-heading">
            <span className="font-semibold">{t("mun.sec.livestockMun")}:</span> {formatCount(livestock)}{" "}
            {t("mun.misc.heads")} — {MUN_LIVESTOCK_ADVISORY[0]}
          </p>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.rcef")}</p>
          <form
            noValidate
            className="mt-2 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const r = actions.allocateRcef(brgy, Number(bags));
              setResult(r);
              if (r.ok) {
                setBags("");
              }
            }}
          >
            <label className={`${MUN_LABEL} min-w-36 flex-1`}>
              {t("mun.f.barangay")}
              <select value={brgy} onChange={(e) => setBrgy(e.target.value)} className={`${MUN_FIELD} mt-1`}>
                {state.barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${MUN_LABEL} w-24`}>
              {t("mun.f.seedBags")}
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={bags}
                onChange={(e) => setBags(e.target.value)}
                className={`${MUN_FIELD} mt-1`}
              />
            </label>
            <button type="submit" className={MUN_BTN_PRIMARY}>
              <Icon name="check" size={16} />
              {t("mun.action.allocate")}
            </button>
          </form>
          <MunFeedback result={result} />
          <p className="mt-2 text-xs text-cmd-muted">
            {state.rcef.map((r) => `${barangayName(state, r.barangayId)}: ${r.seedBags}`).join(" · ")}
          </p>
        </div>
      </div>
    </MunSection>
  );
}
