"use client";

import { useState } from "react";
import { Icon, useLanguage } from "@/components/common";
import { useAlerts } from "@/hooks";
import {
  MUN_HOTLINES,
  MUN_LIVESTOCK_ADVISORY,
  MUN_OSM_LINK,
  MUN_SAFETY_GUIDE,
  MUN_SOURCE,
  MUN_TYPHOON,
} from "@/lib/dashboard/dashboardData";
import { consolidatedDana, evacTotals, totalAffectedHouseholds } from "@/lib/dashboard/municipalSelectors";
import { formatCount } from "@/lib/dashboard/municipalFormat";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";
import { MUN_BTN_ALERT, MUN_CHIP, MUN_TONE_CHIP } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IMunModuleTab } from "@/types";
import MunFeedback from "./MunFeedback";
import MunBar from "./MunBar";

export interface IMunEmergencyPanelProps {
  onNavigate: (tab: IMunModuleTab, anchor?: string) => void;
}

const BTN_ON_RED =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-alert hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

/**
 * Emergency mode block (v6 §12, Municipal: 15 features). Overrides the normal
 * Overview flow when the emergency protocol is active: red banner, signal +
 * wind, nearest hub, hotlines, safety steps per signal, evacuation map, crop
 * protection, livestock, DRRM checklist activation, live capacity tracker
 * (ALL centers), affected population, PDRRMC reminder, DANA auto-send,
 * municipal-wide coordination and the all-barangay evacuation overview.
 */
export default function MunEmergencyPanel({ onNavigate }: IMunEmergencyPanelProps) {
  const { t } = useLanguage();
  const { state, actions } = useMunicipalStore();
  const { state: alertState } = useAlerts();
  const [result, setResult] = useState<IMunStoreResult | null>(null);
  const [resultText, setResultText] = useState<string | undefined>(undefined);

  const live = alertState?.hasActiveHazard ? alertState.alert : null;
  const signal = live?.signalLevel ?? state.emergencyLevel;
  const evac = evacTotals(state);
  const dana = consolidatedDana(state);
  const steps = MUN_SAFETY_GUIDE.find((g) => g.id === "signal")?.steps ?? [];
  const crop = MUN_SAFETY_GUIDE.find((g) => g.id === "crop")?.steps ?? [];

  function run(r: IMunStoreResult) {
    setResult(r);
    setResultText(r.ok ? t("mun.misc.recipients", { count: r.count ?? 0 }) : undefined);
  }

  return (
    <section className="rounded-xl border-2 border-alert bg-cmd-surface shadow-sm" aria-label={t("mun.sec.emergency")}>
      <header className="flex flex-wrap items-center justify-between gap-2 gap-y-1 rounded-t-lg bg-alert px-4 py-3 text-white">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Icon name="alert-triangle" size={18} />
          {t("mun.sec.emergency")}
        </h2>
        <p className="min-w-0 break-words text-sm font-bold">
          {t("mun.misc.signal", { level: signal })} ·{" "}
          {t("mun.misc.windKph", { wind: MUN_TYPHOON.windKph, gust: MUN_TYPHOON.gustKph })}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => run(actions.triggerChecklist())} className={MUN_BTN_ALERT}>
              <Icon name="check" size={16} />
              {t("mun.action.trigger")}
            </button>
            <button type="button" onClick={() => run(actions.sendDanaForms())} className={`${BTN_ON_RED} border border-alert`}>
              <Icon name="scroll" size={16} />
              {t("mun.action.sendDana")}
            </button>
            <button type="button" onClick={() => run(actions.broadcastSitrep())} className={`${BTN_ON_RED} border border-alert`}>
              <Icon name="broadcast" size={16} />
              {t("mun.action.broadcast")}
            </button>
            <a href={MUN_OSM_LINK} target="_blank" rel="noopener noreferrer" className={`${BTN_ON_RED} border border-alert`}>
              <Icon name="map" size={16} />
              {t("mun.sec.viewEvacMap")}
            </a>
          </div>
          <MunFeedback result={result} successText={resultText} />
          <p className="rounded-lg bg-alert/10 p-3 text-xs font-semibold text-cmd-heading">
            {t("mun.sec.pdrrmcReminder")} {t("mun.misc.reporting", { count: dana.reporting, total: state.dana.length })}
          </p>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-cmd-muted">{t("mun.sec.evacOverview")}</h3>
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {state.centers.map((c) => (
                <li key={c.id} className="rounded-lg bg-cmd-tile p-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-cmd-heading">
                      {c.name}
                      <span className="block font-normal text-cmd-muted">Brgy. {c.barangay}</span>
                    </span>
                    <span
                      className={`${MUN_CHIP} shrink-0 ${MUN_TONE_CHIP[c.status === "full" ? "critical" : c.status === "near-full" ? "caution" : c.status === "standby" ? "info" : "good"]}`}
                    >
                      {t(`mun.evac.${c.status}` as const)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-cmd-muted">
                    {c.occupancy}/{c.capacity}
                  </p>
                  <MunBar
                    pct={c.capacity > 0 ? (c.occupancy / c.capacity) * 100 : 0}
                    label={c.name}
                    tone={c.status === "full" ? "alert" : "teal"}
                  />
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => onNavigate("m7", "mun-evac")} className="mt-2 min-h-[44px] text-xs font-semibold text-teal underline">
              {t("mun.action.viewAll")}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg bg-cmd-tile p-3">
            <p className="text-[11px] font-bold uppercase text-cmd-muted">{t("mun.card.affected")}</p>
            <p className="text-2xl font-bold text-alert">{formatCount(totalAffectedHouseholds(state))}</p>
            <p className="text-xs text-cmd-muted">
              {t("mun.card.households")} · {evac.occupied}/{evac.capacity} ({evac.pct}%)
            </p>
          </div>
          <div className="rounded-lg bg-cmd-tile p-3">
            <p className="text-[11px] font-bold uppercase text-cmd-muted">{t("mun.sec.nearestHub")}</p>
            <p className="text-sm font-semibold text-cmd-heading">{evac.primaryHub?.name}</p>
            <p className="text-xs text-cmd-muted">Brgy. {evac.primaryHub?.barangay}</p>
          </div>
          <div className="rounded-lg bg-cmd-tile p-3">
            <p className="text-[11px] font-bold uppercase text-cmd-muted">{t("mun.sec.safetySteps", { level: signal })}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-cmd-heading">
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-cmd-tile p-3">
            <p className="text-[11px] font-bold uppercase text-cmd-muted">{t("mun.sec.cropRisk")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-cmd-heading">
              {crop.slice(0, 2).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] font-bold uppercase text-cmd-muted">{t("mun.sec.livestock")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-cmd-heading">
              {MUN_LIVESTOCK_ADVISORY.slice(0, 2).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {MUN_HOTLINES.map((h) => (
              <li key={h.label}>
                <a
                  href={h.tel}
                  className="flex min-h-[44px] flex-col justify-center rounded-lg bg-alert px-2 py-1 text-white hover:opacity-90"
                >
                  <span className="text-[10px] font-semibold">{h.label}</span>
                  <span className="text-sm font-bold">{h.number}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="px-4 pb-3 text-right text-[11px] text-cmd-muted">
        {live ? t("mun.misc.livePagasa") : t("mun.misc.fallback")} · {MUN_SOURCE}
      </p>
    </section>
  );
}
