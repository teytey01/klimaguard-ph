"use client";

import { useState } from "react";
import { Icon, useLanguage } from "@/components/common";
import SmsBroadcastLog from "@/components/common/SmsBroadcastLog";
import BudgetTracker from "@/components/transparency/BudgetTracker";
import { MUN_SOURCE, getMunicipalDashboardData } from "@/lib/dashboard/dashboardData";
import {
  barangayName,
  consolidatedDana,
  evacTotals,
  toTransparencyData,
  totalAffectedHouseholds,
} from "@/lib/dashboard/municipalSelectors";
import { formatCount, formatDateTimeManila, formatPhpShort } from "@/lib/dashboard/municipalFormat";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";
import {
  MUN_BTN_ALERT,
  MUN_BTN_PRIMARY,
  MUN_BTN_SMALL,
  MUN_CHIP,
  MUN_FIELD,
  MUN_LABEL,
  MUN_TABLE_WRAP,
  MUN_TD,
  MUN_TH,
  MUN_TONE_CHIP,
} from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IMunDanaStatus } from "@/types";
import MunSection from "./MunSection";
import MunFeedback from "./MunFeedback";

export type IMunDrrmOpsPanelProps = Record<string, never>;

const DANA_TONE: Record<IMunDanaStatus, keyof typeof MUN_TONE_CHIP> = {
  "not-submitted": "info",
  submitted: "caution",
  approved: "good",
  returned: "critical",
};

/**
 * M7 DRRM Operations (municipal-wide): pre-disaster checklist + BDRRMC acks,
 * all evacuation centers (edit occupancy / open-standby), consolidated DANA
 * (approve / return), warehouse + barangay inventories + relief dispatch,
 * SitReps up/down, LDRRMF 70/30 tracker, BDRRMC directives, SMS log.
 */
export default function MunDrrmOpsPanel() {
  const { t } = useLanguage();
  const { state, actions } = useMunicipalStore();
  const [result, setResult] = useState<IMunStoreResult | null>(null);
  const [occ, setOcc] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reliefBrgy, setReliefBrgy] = useState(state.barangays[0]?.id ?? "");
  const [food, setFood] = useState("");
  const [water, setWater] = useState("");
  const [directive, setDirective] = useState("");
  const [directiveTo, setDirectiveTo] = useState("all");
  const [sitrepText, setSitrepText] = useState<string | undefined>(undefined);

  const evac = evacTotals(state);
  const dana = consolidatedDana(state);
  const acked = state.barangays.filter((b) => b.checklistAck).length;
  const fundData = toTransparencyData(getMunicipalDashboardData());

  function run(r: IMunStoreResult) {
    setResult(r);
    setSitrepText(undefined);
  }

  return (
    <div className="space-y-5">
      <MunFeedback result={result} successText={sitrepText} />

      <MunSection
        title={t("mun.sec.checklist")}
        icon="check"
        source={MUN_SOURCE}
        action={
          <button type="button" onClick={() => run(actions.triggerChecklist())} className={MUN_BTN_ALERT}>
            {t("mun.action.trigger")}
          </button>
        }
      >
        <ul className="space-y-1">
          {state.checklist.map((c) => (
            <li key={c.id}>
              <label className="flex min-h-[44px] items-center gap-2 text-sm text-cmd-heading">
                <input type="checkbox" checked={c.done} onChange={() => run(actions.toggleChecklist(c.id))} className="size-5 accent-teal" />
                <span className={`${MUN_CHIP} ${MUN_TONE_CHIP.info}`}>{t(`mun.phase.${c.phase}` as const)}</span>
                {c.label}
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-semibold text-cmd-muted">
          {t("mun.sec.ackGrid")} · {t("mun.misc.ackCount", { count: acked, total: state.barangays.length })}
        </p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {state.barangays.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                disabled={b.checklistAck}
                onClick={() => run(actions.ackChecklist(b.id))}
                className={MUN_BTN_SMALL}
              >
                {b.checklistAck ? "✓" : t("mun.action.ack")} {b.name}
              </button>
            </li>
          ))}
        </ul>
      </MunSection>

      <MunSection id="mun-evac" title={t("mun.sec.evac")} icon="home" source={MUN_SOURCE}>
        <p className="mb-2 text-sm text-cmd-heading">
          {evac.occupied}/{evac.capacity} ({evac.pct}%) · {evac.openCount}/{evac.total} {t("mun.evac.open")} ·{" "}
          {formatCount(totalAffectedHouseholds(state))} {t("mun.card.households")}
        </p>
        <div className={MUN_TABLE_WRAP}>
          <table className="w-full min-w-[560px]">
            <thead className="bg-cmd-tile">
              <tr>
                <th className={MUN_TH}>{t("mun.col.center")}</th>
                <th className={MUN_TH}>{t("mun.col.occ")}</th>
                <th className={MUN_TH}>{t("mun.f.status")}</th>
                <th className={MUN_TH}>{t("mun.f.occupancy")}</th>
              </tr>
            </thead>
            <tbody>
              {state.centers.map((c) => (
                <tr key={c.id} className="border-t border-black/5 dark:border-white/5">
                  <td className={MUN_TD}>
                    {c.name}
                    <span className="block text-[11px] text-cmd-muted">Brgy. {c.barangay}</span>
                  </td>
                  <td className={MUN_TD}>
                    {c.occupancy}/{c.capacity}
                  </td>
                  <td className={MUN_TD}>{t(`mun.evac.${c.status}` as const)}</td>
                  <td className={MUN_TD}>
                    <form
                      noValidate
                      className="flex flex-wrap gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(actions.updateEvacOccupancy(c.id, Number(occ[c.id] ?? c.occupancy)));
                      }}
                    >
                      <input
                        type="number"
                        min={0}
                        max={c.capacity}
                        aria-label={`${t("mun.f.occupancy")}: ${c.name}`}
                        value={occ[c.id] ?? String(c.occupancy)}
                        onChange={(e) => setOcc((o) => ({ ...o, [c.id]: e.target.value }))}
                        className={`${MUN_FIELD} w-20`}
                      />
                      <button type="submit" className={MUN_BTN_SMALL}>
                        {t("mun.action.save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => run(actions.setEvacStatus(c.id, c.status === "standby"))}
                        className={MUN_BTN_SMALL}
                      >
                        {c.status === "standby" ? t("mun.action.open") : t("mun.action.standby")}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MunSection>

      <MunSection id="mun-dana" title={t("mun.sec.dana")} icon="scroll" source={MUN_SOURCE}>
        <p className="mb-2 text-sm text-cmd-heading">
          {t("mun.misc.totals")}: {formatCount(dana.affectedFamilies)} {t("mun.col.families")} · {dana.housesDamaged}{" "}
          {t("mun.col.houses")} · {formatPhpShort(dana.infraDamagePhp + dana.agriDamagePhp)} {t("mun.col.damage")} ·{" "}
          {t("mun.misc.reporting", { count: dana.reporting, total: state.dana.length })}
        </p>
        <ul className="space-y-2">
          {state.dana.map((d) => (
            <li key={d.barangayId} className="rounded-lg bg-cmd-tile p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-cmd-heading">
                  Brgy. {barangayName(state, d.barangayId)}
                  <span className="ml-2 text-xs font-normal text-cmd-muted">
                    {d.affectedFamilies} {t("mun.col.families")} · {d.housesDamaged} {t("mun.col.houses")}
                    {d.submittedAt ? ` · ${formatDateTimeManila(d.submittedAt)}` : ""}
                  </span>
                </p>
                <span className={`${MUN_CHIP} ${MUN_TONE_CHIP[DANA_TONE[d.status]]}`}>{t(`mun.dana.${d.status}` as const)}</span>
              </div>
              {d.reviewNote ? <p className="mt-1 text-xs text-cmd-muted">{t("mun.misc.reviewNote", { note: d.reviewNote })}</p> : null}
              {d.status === "submitted" ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    aria-label={t("mun.f.note")}
                    placeholder={t("mun.f.note")}
                    value={notes[d.barangayId] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [d.barangayId]: e.target.value }))}
                    className={`${MUN_FIELD} min-w-40 flex-1`}
                  />
                  <button type="button" onClick={() => run(actions.reviewDana(d.barangayId, "approved", notes[d.barangayId] ?? ""))} className={MUN_BTN_PRIMARY}>
                    {t("mun.action.approve")}
                  </button>
                  <button type="button" onClick={() => run(actions.reviewDana(d.barangayId, "returned", notes[d.barangayId] ?? ""))} className={MUN_BTN_SMALL}>
                    {t("mun.action.return")}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </MunSection>

      <MunSection id="mun-relief" title={t("mun.sec.relief")} icon="box" source={MUN_SOURCE}>
        <p className="text-sm text-cmd-heading">
          <span className="font-semibold">{t("mun.misc.depot")}:</span> {formatCount(state.depot.foodPacks)} {t("mun.f.foodPacks")} ·{" "}
          {state.depot.waterKits} {t("mun.f.waterKits")} · {state.depot.rescueTrucks + state.depot.rubberBoats} {t("mun.stat.assetsUnit")}
        </p>
        <ul className="mt-2 space-y-1">
          {state.barangays.map((b) => (
            <li key={b.id} className="flex justify-between gap-2 text-xs text-cmd-heading">
              <span>Brgy. {b.name}</span>
              <span>
                {t("mun.col.inventory")}: {b.inventoryFoodPacks} · {t("mun.col.delivered")}: {b.reliefDelivered}/{b.reliefNeeded}
              </span>
            </li>
          ))}
        </ul>
        <form
          noValidate
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const r = actions.dispatchRelief(reliefBrgy, Number(food || 0), Number(water || 0));
            run(r);
            if (r.ok) {
              setFood("");
              setWater("");
            }
          }}
        >
          <label className={`${MUN_LABEL} min-w-36 flex-1`}>
            {t("mun.f.barangay")}
            <select value={reliefBrgy} onChange={(e) => setReliefBrgy(e.target.value)} className={`${MUN_FIELD} mt-1`}>
              {state.barangays.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className={`${MUN_LABEL} w-24`}>
            {t("mun.f.foodPacks")}
            <input type="number" min={0} value={food} onChange={(e) => setFood(e.target.value)} className={`${MUN_FIELD} mt-1`} />
          </label>
          <label className={`${MUN_LABEL} w-24`}>
            {t("mun.f.waterKits")}
            <input type="number" min={0} value={water} onChange={(e) => setWater(e.target.value)} className={`${MUN_FIELD} mt-1`} />
          </label>
          <button type="submit" className={MUN_BTN_PRIMARY}>
            <Icon name="truck" size={16} />
            {t("mun.action.dispatch")}
          </button>
        </form>
      </MunSection>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MunSection title={t("mun.sec.sitreps")} icon="broadcast" source={MUN_SOURCE}>
          <button
            type="button"
            onClick={() => {
              const r = actions.broadcastSitrep();
              setResult(r);
              setSitrepText(r.ok ? t("mun.status.broadcastSent", { count: r.count ?? 0, time: r.info ?? "" }) : undefined);
            }}
            className={`${MUN_BTN_PRIMARY} w-full`}
          >
            <Icon name="broadcast" size={16} />
            {t("mun.action.broadcast")}
          </button>
          <ul className="mt-3 space-y-2">
            {state.sitreps.slice(0, 4).map((s) => (
              <li key={s.id} className={`rounded-lg border-l-2 bg-cmd-tile p-2 text-xs ${s.direction === "up" ? "border-teal" : "border-cmd-accent"}`}>
                <p className="font-semibold text-cmd-heading">
                  {s.direction === "up" ? "▲" : "▼"} {s.from} → {s.to} · {formatDateTimeManila(s.at)}
                </p>
                <p className="text-cmd-muted">{s.summary}</p>
              </li>
            ))}
          </ul>
        </MunSection>

        <MunSection title={t("mun.sec.bdrrmc")} icon="radio" source={MUN_SOURCE}>
          <ul className="flex flex-wrap gap-2">
            {state.barangays.map((b) => (
              <li key={b.id} className="flex items-center gap-1 rounded bg-cmd-tile px-2 py-1 text-xs text-cmd-heading">
                <span className={`inline-block size-2 rounded-full ${b.bdrrmcOnline ? "bg-teal" : "bg-alert"}`} />
                {b.name} · {b.bdrrmcOnline ? t("mun.side.online") : t("mun.misc.offline")}
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const r = actions.sendBdrrmcDirective(directiveTo === "all" ? "all" : [directiveTo], directive);
              run(r);
              if (r.ok) {
                setDirective("");
              }
            }}
          >
            <label className={MUN_LABEL}>
              {t("mun.misc.directiveTo")}
              <select value={directiveTo} onChange={(e) => setDirectiveTo(e.target.value)} className={`${MUN_FIELD} mt-1`}>
                <option value="all">{t("mun.f.all")}</option>
                {state.barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={MUN_LABEL}>
              {t("mun.f.message")}
              <textarea value={directive} onChange={(e) => setDirective(e.target.value)} rows={2} maxLength={320} className={`${MUN_FIELD} mt-1`} />
            </label>
            <button type="submit" className={MUN_BTN_PRIMARY}>
              {t("mun.action.send")}
            </button>
          </form>
        </MunSection>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-cmd-heading">{t("mun.sec.ldrrmf")}</h2>
          <BudgetTracker data={fundData} context="official" />
        </div>
        <SmsBroadcastLog />
      </div>
    </div>
  );
}
