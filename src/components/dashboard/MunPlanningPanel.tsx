"use client";

import { useState } from "react";
import { useLanguage } from "@/components/common";
import { MUN_COMPLIANCE_INDICATORS, MUN_PROJECTIONS, MUN_SOURCE } from "@/lib/dashboard/dashboardData";
import { ccetTotals, complianceRanking, pendingDeadlines } from "@/lib/dashboard/municipalSelectors";
import { formatPhpShort } from "@/lib/dashboard/municipalFormat";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";
import { MUN_BTN_SMALL, MUN_CHIP, MUN_FIELD, MUN_TONE_CHIP } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IMunCcetTag } from "@/types";
import MunSection from "./MunSection";
import MunBar from "./MunBar";
import MunFeedback from "./MunFeedback";

export type IMunPlanningPanelProps = Record<string, never>;

const ROW = "rounded-lg bg-cmd-tile p-3";
const ROW_TITLE = "text-[11px] font-bold uppercase tracking-wide text-cmd-muted";
const TAGS: IMunCcetTag[] = ["adaptation", "mitigation", "none"];

/**
 * M6 LGU Planning Toolkit (municipal scope), compact: CDRA steps, LCCAP,
 * projections, compliance scorecard, deadlines (30/15/7), CLUP Integration and
 * CCET tagging — the last two are municipal-exclusive and editable.
 */
export default function MunPlanningPanel() {
  const { t } = useLanguage();
  const { state, actions } = useMunicipalStore();
  const [result, setResult] = useState<IMunStoreResult | null>(null);
  const deadlines = pendingDeadlines(state);
  const totals = ccetTotals(state);
  const ranking = complianceRanking(state);
  const passed = MUN_COMPLIANCE_INDICATORS.filter((i) => i.pass).length;

  return (
    <MunSection title={t("mun.tab.m6")} icon="building" source={`${MUN_SOURCE} · CCC-HLURB · DILG`}>
      <MunFeedback result={result} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.cdra")}</p>
          <ul className="mt-1 space-y-1">
            {state.cdra.map((s) => (
              <li key={s.id}>
                <label className="flex min-h-[44px] items-center gap-2 text-sm text-cmd-heading">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => setResult(actions.toggleCdraStep(s.id))}
                    className="size-5 accent-teal"
                  />
                  <span className="flex-1">{s.title}</span>
                  <span className="text-xs text-cmd-muted">{s.barangaysDone}/54</span>
                </label>
              </li>
            ))}
          </ul>
          <p className={`${ROW_TITLE} mt-2`}>{t("mun.sec.lccap")}</p>
          <ul className="mt-1 space-y-1">
            {state.lccap.map((l) => (
              <li key={l.id}>
                <div className="flex justify-between text-xs text-cmd-heading">
                  <span>{l.title}</span>
                  <span>
                    {l.progressPct}% · {t(`mun.lccap.${l.status}` as const)}
                  </span>
                </div>
                <MunBar pct={l.progressPct} label={l.title} />
              </li>
            ))}
          </ul>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>
            {t("mun.sec.scorecard")} · {t("mun.card.passed", { pass: passed, total: MUN_COMPLIANCE_INDICATORS.length })}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-cmd-heading">
            {MUN_COMPLIANCE_INDICATORS.map((i) => (
              <li key={i.id}>
                {i.pass ? "✅" : "⚠️"} {i.label}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-cmd-muted">
            {ranking.map((b) => `${b.name} ${b.complianceScore}`).join(" · ")}
          </p>
          <p className={`${ROW_TITLE} mt-2`}>{t("mun.sec.deadlines")}</p>
          <ul className="mt-1 space-y-1">
            {deadlines.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 text-xs text-cmd-heading">
                <span>
                  {d.title} · {d.scope === "municipal" ? t("mun.deadline.municipal") : `Brgy. ${d.scope}`}
                </span>
                <span className={`${MUN_CHIP} shrink-0 ${MUN_TONE_CHIP[d.badge === "overdue" || d.badge === "7" ? "critical" : "caution"]}`}>
                  {t(`mun.deadline.${d.badge}` as const)}
                </span>
              </li>
            ))}
          </ul>
          <p className={`${ROW_TITLE} mt-2`}>{t("mun.sec.projections")}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-cmd-heading">
            {MUN_PROJECTIONS.map((p) => (
              <li key={p.label}>
                {p.label}: <span className="font-semibold">{p.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.clup")}</p>
          <ul className="mt-1 space-y-1">
            {state.clup.map((z) => (
              <li key={z.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-cmd-heading">
                <span>
                  {z.zone} · {z.areaHa} {t("mun.misc.ha")} · {z.hazardOverlap.map((h) => t(`mun.hazard.${h}` as const)).join(", ")}
                </span>
                <button type="button" onClick={() => setResult(actions.toggleClupClimate(z.id))} className={MUN_BTN_SMALL}>
                  {z.climateInformed ? `✓ ${t("mun.misc.climateInformed")}` : t("mun.misc.notClimate")}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>
            {t("mun.sec.ccet")} · {t("mun.ccet.adaptation")} {formatPhpShort(totals.adaptation)} ·{" "}
            {t("mun.ccet.mitigation")} {formatPhpShort(totals.mitigation)}
          </p>
          <ul className="mt-1 space-y-1">
            {state.budget.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-cmd-heading">
                <span>
                  {l.item} · {formatPhpShort(l.amountPhp)}
                  {l.ccetCode ? ` · ${l.ccetCode}` : ""}
                </span>
                <select
                  aria-label={`${t("mun.sec.ccet")}: ${l.item}`}
                  value={l.ccet}
                  onChange={(e) =>
                    setResult(actions.tagCcet(l.id, e.target.value as IMunCcetTag, l.ccetCode ?? (e.target.value === "none" ? undefined : "CC-TAG")))
                  }
                  className={`${MUN_FIELD} w-36`}
                >
                  {TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {t(`mun.ccet.${tag}` as const)}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MunSection>
  );
}
