"use client";

import { useState } from "react";
import { Icon, useLanguage } from "@/components/common";
import { MUN_SAFETY_GUIDE, MUN_SOURCE } from "@/lib/dashboard/dashboardData";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";
import { MUN_BTN_PRIMARY, MUN_FIELD, MUN_LABEL } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import MunSection from "./MunSection";
import MunFeedback from "./MunFeedback";

export type IMunSafetyPanelProps = Record<string, never>;

/** Build the default resident alert for the current signal (Filipino). */
function templateFor(level: number, active: boolean): string {
  if (!active) {
    return "MDRRMO Calamba: Walang aktibong bagyo. Ihanda pa rin ang go-bag at makinig sa PAGASA. Tumawag 911 kung may emergency.";
  }
  return `MDRRMO Calamba: SIGNAL #${level}. Lumikas na ang mga nasa riverbank at lakeshore papunta sa pinakamalapit na evacuation center. Dalhin ang go-bag. Tumawag 911.`;
}

/**
 * M4 Safety Advisor (Municipal: all) — the full safety guide (signal 1–5,
 * go-bag, routes, health, eye of the storm, crops, livestock, equipment,
 * community evacuation management, DANA guide) + the resident alert
 * broadcast template (one barangay or all; logged to SMS + audit).
 */
export default function MunSafetyPanel() {
  const { t } = useLanguage();
  const { state, actions } = useMunicipalStore();
  const [target, setTarget] = useState<string>("all");
  const [message, setMessage] = useState(() => templateFor(state.emergencyLevel, state.emergencyActive));
  const [result, setResult] = useState<IMunStoreResult | null>(null);

  const success =
    result && result.ok ? t("mun.misc.recipients", { count: result.count ?? 0 }) : undefined;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <MunSection title={t("mun.sec.guide")} icon="shield" source={`${MUN_SOURCE} · OCD / DOH`} className="lg:col-span-3">
        <ul className="space-y-2">
          {MUN_SAFETY_GUIDE.map((g) => (
            <li key={g.id}>
              <details
                className="group rounded-lg bg-cmd-tile p-3"
                open={g.id === "signal"}
              >
                <summary className="flex min-h-[32px] cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-cmd-heading">
                  {g.title}
                  <span className="text-cmd-muted transition-transform group-open:rotate-90">
                    <Icon name="chevron-right" size={16} />
                  </span>
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cmd-heading">
                  {g.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </MunSection>

      <MunSection title={t("mun.sec.alertTemplate")} icon="broadcast" source={MUN_SOURCE} className="lg:col-span-2">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setResult(actions.broadcastResidentAlert(target, message));
          }}
          className="space-y-3"
        >
          <label className={MUN_LABEL}>
            {t("mun.f.barangay")}
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${MUN_FIELD} mt-1`}>
              <option value="all">{t("mun.f.all")}</option>
              {state.barangays.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className={MUN_LABEL}>
            {t("mun.f.message")}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={480}
              className={`${MUN_FIELD} mt-1`}
            />
          </label>
          <p className="text-[11px] text-cmd-muted">
            {t("mun.misc.prefilled")} ({message.length}/480)
          </p>
          <button type="submit" className={`${MUN_BTN_PRIMARY} w-full`}>
            <Icon name="broadcast" size={16} />
            {t("mun.action.send")}
          </button>
          <MunFeedback result={result} successText={success} />
        </form>
      </MunSection>
    </div>
  );
}
