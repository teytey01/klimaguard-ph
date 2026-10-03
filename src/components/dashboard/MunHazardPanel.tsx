"use client";

import { useState } from "react";
import { Icon, useLanguage } from "@/components/common";
import { useAlerts } from "@/hooks";
import {
  MUN_HOTLINES,
  MUN_LIVESTOCK_ADVISORY,
  MUN_SOURCE,
  MUN_TYPHOON,
} from "@/lib/dashboard/dashboardData";
import {
  consolidatedDana,
  evacTotals,
  totalAffectedHouseholds,
  totalAtRiskResidents,
} from "@/lib/dashboard/municipalSelectors";
import { formatCount, formatDateTimeManila, formatPhpShort } from "@/lib/dashboard/municipalFormat";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";
import {
  MUN_BTN_ALERT,
  MUN_BTN_OUTLINE,
  MUN_BTN_PRIMARY,
  MUN_CHIP,
  MUN_FIELD,
  MUN_LABEL,
  MUN_TABLE_WRAP,
  MUN_TD,
  MUN_TH,
  MUN_TONE_CHIP,
} from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IMunEmergencyLevel, IMunHazard, IMunModuleTab } from "@/types";
import MunSection from "./MunSection";
import MunBar from "./MunBar";
import MunFeedback from "./MunFeedback";

export interface IMunHazardPanelProps {
  onNavigate: (tab: IMunModuleTab, anchor?: string) => void;
}

const HAZARDS: IMunHazard[] = ["flood", "landslide", "storm-surge", "liquefaction"];
const LEVELS: IMunEmergencyLevel[] = [1, 2, 3, 4, 5];

/**
 * M3 Hazard & Alerts — municipal-wide. Signal/track/wind (live NDRRMC/PAGASA
 * when active, demo track otherwise), "Ligtas ba?", hazard warnings, affected
 * barangays (filterable), population triage, consolidated reporting, all
 * centers, crop + livestock risk, hotlines, checklist trigger + protocol.
 */
export default function MunHazardPanel({ onNavigate }: IMunHazardPanelProps) {
  const { t } = useLanguage();
  const { state, actions } = useMunicipalStore();
  const { state: alertState, loading, error, refetch } = useAlerts();
  const [hazard, setHazard] = useState<IMunHazard | "all">("all");
  const [level, setLevel] = useState<IMunEmergencyLevel>(state.emergencyLevel);
  const [result, setResult] = useState<IMunStoreResult | null>(null);
  const [resultText, setResultText] = useState<string | undefined>(undefined);

  const live = alertState?.hasActiveHazard ? alertState.alert : null;
  const signal = live?.signalLevel ?? (state.emergencyActive ? state.emergencyLevel : 0);
  const dana = consolidatedDana(state);
  const evac = evacTotals(state);
  const affected = state.barangays
    .filter((b) => b.affectedHouseholds > 0 && (hazard === "all" || b.hazards.includes(hazard)))
    .sort((a, b) => b.affectedHouseholds - a.affectedHouseholds);
  const received = state.sitreps.filter((s) => s.direction === "up" && s.to !== "PDRRMC Laguna");
  const highPest = state.barangays.filter((b) => b.pestRisk === "high" || b.cropDamagePhp >= 700_000);

  function run(r: IMunStoreResult, text?: string) {
    setResult(r);
    setResultText(r.ok ? text : undefined);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MunSection
          title={t("mun.sec.typhoon")}
          icon="cloud"
          source={live ? alertState?.source ?? MUN_SOURCE : `${t("mun.misc.fallback")} · ${MUN_SOURCE}`}
        >
          {loading && !alertState ? (
            <div className="h-24 animate-pulse rounded-lg bg-cmd-tile" aria-hidden="true" />
          ) : (
            <>
              {error ? (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-cmd-muted">
                  <span>{error}</span>
                  <button type="button" onClick={refetch} className={MUN_BTN_OUTLINE}>
                    {t("mun.action.retry")}
                  </button>
                </div>
              ) : null}
              <p className={`text-2xl font-bold ${signal > 0 ? "text-alert" : "text-teal"}`}>
                {signal > 0 ? t("mun.misc.signal", { level: signal }) : t("mun.card.noAlerts")}
              </p>
              <p className="text-sm text-cmd-heading">{live?.typhoonName ?? MUN_TYPHOON.name}</p>
              <p className="mt-1 text-sm text-cmd-muted">
                {t("mun.misc.windKph", { wind: MUN_TYPHOON.windKph, gust: MUN_TYPHOON.gustKph })}
              </p>
              <ol className="mt-3 space-y-1 border-l-2 border-alert/40 pl-3">
                {MUN_TYPHOON.track.map((p) => (
                  <li key={p.time} className="text-xs text-cmd-heading">
                    <span className="font-semibold">{p.time}</span> — {p.label}
                  </li>
                ))}
              </ol>
              {live ? (
                <p className="mt-2 text-xs text-cmd-muted">{live.affectedAreas.join(", ")}</p>
              ) : null}
            </>
          )}
        </MunSection>

        <MunSection title={t("mun.sec.safe")} icon="shield" source={MUN_SOURCE}>
          <p
            className={`rounded-lg p-3 text-sm font-semibold ${signal >= 2 ? "bg-alert text-white" : "bg-teal/15 text-cmd-heading"}`}
          >
            {signal >= 2 ? t("mun.misc.safeNo", { level: signal }) : t("mun.misc.safeYes")}
          </p>
          <h3 className="mt-4 text-xs font-bold uppercase text-cmd-muted">{t("mun.sec.warnings")}</h3>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {HAZARDS.map((h) => {
              const count = state.barangays.filter((b) => b.hazards.includes(h) && b.riskIndex >= 5).length;
              return (
                <li key={h} className="rounded-lg bg-cmd-tile p-2">
                  <p className="text-xs font-semibold text-cmd-heading">{t(`mun.hazard.${h}` as const)}</p>
                  <p className={`text-lg font-bold ${count > 0 ? "text-alert" : "text-teal"}`}>{count}</p>
                  <p className="text-[10px] text-cmd-muted">{t("mun.f.barangay")} · {t("mun.col.risk")} ≥5</p>
                </li>
              );
            })}
          </ul>
        </MunSection>
      </div>

      <MunSection title={t("mun.sec.protocol")} icon="alert-triangle" source={MUN_SOURCE}>
        <div className="flex flex-wrap items-end gap-3">
          <label className={MUN_LABEL}>
            {t("mun.f.level")}
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) as IMunEmergencyLevel)}
              className={`${MUN_FIELD} mt-1 w-28`}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => run(actions.setEmergency(true, level))} className={MUN_BTN_ALERT}>
            <Icon name="alert-triangle" size={16} />
            {t("mun.action.activate")}
          </button>
          <button
            type="button"
            onClick={() => run(actions.setEmergency(false, level))}
            disabled={!state.emergencyActive}
            className={MUN_BTN_OUTLINE}
          >
            {t("mun.action.deactivate")}
          </button>
          <button
            type="button"
            onClick={() => {
              const r = actions.triggerChecklist();
              run(r, r.ok ? t("mun.misc.recipients", { count: r.count ?? 0 }) : undefined);
            }}
            className={MUN_BTN_PRIMARY}
          >
            <Icon name="check" size={16} />
            {t("mun.action.trigger")}
          </button>
        </div>
        <p className="mt-2 text-xs text-cmd-muted">{t("mun.misc.signalTrigger")}</p>
        {!state.emergencyActive ? <p className="mt-1 text-xs text-cmd-muted">{t("mun.misc.emergencyOff")}</p> : null}
        <MunFeedback result={result} successText={resultText} />
      </MunSection>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MunSection
          title={t("mun.sec.affectedList")}
          icon="users"
          source={MUN_SOURCE}
          action={
            <select
              aria-label={t("mun.f.hazard")}
              value={hazard}
              onChange={(e) => setHazard(e.target.value as IMunHazard | "all")}
              className={`${MUN_FIELD} w-40`}
            >
              <option value="all">{t("mun.f.all")}</option>
              {HAZARDS.map((h) => (
                <option key={h} value={h}>
                  {t(`mun.hazard.${h}` as const)}
                </option>
              ))}
            </select>
          }
        >
          <p className="text-sm text-cmd-heading">
            <span className="text-2xl font-bold text-alert">{formatCount(totalAffectedHouseholds(state))}</span>{" "}
            {t("mun.card.households")} · {formatCount(totalAtRiskResidents(state))} {t("mun.misc.residentsAtRisk")}
          </p>
          {affected.length === 0 ? (
            <p className="mt-3 text-sm text-cmd-muted">{t("mun.empty.reports")}</p>
          ) : (
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {affected.map((b) => (
                <li key={b.id} className="rounded-lg bg-cmd-tile p-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-cmd-heading">
                    <span className="font-semibold">Brgy. {b.name}</span>
                    <span>
                      {b.affectedHouseholds} {t("mun.card.households")} · {b.atRiskResidents} {t("mun.misc.residentsAtRisk")}
                      {b.atRiskNote ? ` (${b.atRiskNote})` : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-cmd-muted">
                    {b.hazards.map((h) => t(`mun.hazard.${h}` as const)).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </MunSection>

        <MunSection title={t("mun.sec.consolidated")} icon="scroll" source={MUN_SOURCE}>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["submitted", "approved", "returned", "not-submitted"] as const).map((s) => (
              <div key={s} className="rounded-lg bg-cmd-tile p-2 text-center">
                <dt className="text-[10px] text-cmd-muted">{t(`mun.dana.${s}` as const)}</dt>
                <dd className="text-lg font-bold text-cmd-heading">
                  {s === "submitted" ? dana.submitted : s === "approved" ? dana.approved : s === "returned" ? dana.returned : dana.notSubmitted}
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-3 text-xs font-bold uppercase text-cmd-muted">{t("mun.misc.received")}</h3>
          <ul className="mt-2 space-y-2">
            {received.slice(0, 5).map((s) => (
              <li key={s.id} className="rounded-lg border-l-2 border-teal bg-cmd-tile p-2 text-xs">
                <p className="font-semibold text-cmd-heading">
                  {s.from} · {formatDateTimeManila(s.at)}
                </p>
                <p className="text-cmd-muted">{s.summary}</p>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onNavigate("m7", "mun-dana")} className={`${MUN_BTN_OUTLINE} mt-3`}>
            {t("mun.sec.dana")}
          </button>
        </MunSection>
      </div>

      <MunSection title={t("mun.sec.triage")} icon="users" source={MUN_SOURCE}>
        <div className={MUN_TABLE_WRAP}>
          <table className="w-full min-w-[520px]">
            <thead className="bg-cmd-tile">
              <tr>
                <th className={MUN_TH}>{t("mun.f.barangay")}</th>
                <th className={MUN_TH}>{t("mun.col.population")}</th>
                <th className={MUN_TH}>{t("mun.misc.residentsAtRisk")}</th>
                <th className={MUN_TH}>{t("mun.col.households")}</th>
                <th className={MUN_TH}>{t("mun.col.risk")}</th>
              </tr>
            </thead>
            <tbody>
              {[...state.barangays]
                .sort((a, b) => b.riskIndex - a.riskIndex)
                .map((b) => (
                  <tr key={b.id} className="border-t border-black/5 dark:border-white/5">
                    <td className={MUN_TD}>{b.name}</td>
                    <td className={MUN_TD}>{formatCount(b.population)}</td>
                    <td className={MUN_TD}>
                      {formatCount(b.atRiskResidents)}
                      {b.atRiskNote ? <span className="block text-[10px] text-cmd-muted">{b.atRiskNote}</span> : null}
                    </td>
                    <td className={MUN_TD}>{b.affectedHouseholds}</td>
                    <td className={MUN_TD}>
                      <span className={`${MUN_CHIP} ${MUN_TONE_CHIP[b.riskIndex >= 7 ? "critical" : b.riskIndex >= 5 ? "caution" : "good"]}`}>
                        {b.riskIndex.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </MunSection>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MunSection
          title={t("mun.sec.capacity")}
          icon="home"
          source={MUN_SOURCE}
          action={
            <button type="button" onClick={() => onNavigate("m7", "mun-evac")} className={MUN_BTN_OUTLINE}>
              <Icon name="chevron-right" size={14} />
              {t("mun.tab.m7")}
            </button>
          }
        >
          <p className="text-sm text-cmd-heading">
            {evac.occupied}/{evac.capacity} ({evac.pct}%) · {evac.openCount}/{evac.total} {t("mun.evac.open")}
          </p>
          <ul className="mt-2 space-y-2">
            {state.centers.map((c) => (
              <li key={c.id}>
                <div className="flex justify-between text-xs text-cmd-heading">
                  <span>
                    {c.name} · Brgy. {c.barangay}
                  </span>
                  <span>
                    {c.occupancy}/{c.capacity} · {t(`mun.evac.${c.status}` as const)}
                  </span>
                </div>
                <MunBar pct={c.capacity ? (c.occupancy / c.capacity) * 100 : 0} label={c.name} tone={c.status === "full" ? "alert" : "teal"} />
              </li>
            ))}
          </ul>
        </MunSection>

        <div className="space-y-5">
          <MunSection title={t("mun.sec.cropRisk")} icon="sprout" source="DA / MAO Calamba (demo)">
            <ul className="space-y-1 text-xs text-cmd-heading">
              {highPest.map((b) => (
                <li key={b.id} className="flex justify-between gap-2">
                  <span>Brgy. {b.name}</span>
                  <span className="font-semibold">{formatPhpShort(b.cropDamagePhp)}</span>
                </li>
              ))}
            </ul>
          </MunSection>
          <MunSection title={t("mun.sec.livestock")} icon="leaf" source="DA / MAO Calamba (demo)">
            <ul className="list-disc space-y-1 pl-4 text-xs text-cmd-heading">
              {MUN_LIVESTOCK_ADVISORY.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </MunSection>
        </div>
      </div>

      <section className="rounded-xl bg-alert p-5 text-white">
        <h2 className="text-base font-bold">{t("mun.sec.hotlines")}</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MUN_HOTLINES.map((h) => (
            <li key={h.label}>
              <a href={h.tel} className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg bg-white px-4 py-3 text-alert">
                <span className="text-sm font-bold">{h.label}</span>
                <span className="text-sm font-semibold">{h.number}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-right text-[11px] text-white/90">NDRRMC · PAGASA · PRC</p>
      </section>
    </div>
  );
}
