"use client";

import { useState } from "react";
import { Icon, useLanguage } from "@/components/common";
import { MUN_SOURCE } from "@/lib/dashboard/dashboardData";
import { reportCounts } from "@/lib/dashboard/municipalSelectors";
import { formatDateTimeManila, formatPhp } from "@/lib/dashboard/municipalFormat";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";
import {
  MUN_BTN_PRIMARY,
  MUN_BTN_SMALL,
  MUN_CHIP,
  MUN_FIELD,
  MUN_LABEL,
  MUN_TONE_CHIP,
} from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IMunProjectStatus } from "@/types";
import MunSection from "./MunSection";
import MunFeedback from "./MunFeedback";

export type IMunTransparencyPanelProps = Record<string, never>;

const ROW = "rounded-lg bg-cmd-tile p-3";
const ROW_TITLE = "text-[11px] font-bold uppercase tracking-wide text-cmd-muted";
const STATUSES: IMunProjectStatus[] = ["planned", "ongoing", "delayed", "completed"];

/**
 * M11 Transparency (Municipal: full, Calamba only): municipal budget +
 * upload a line, edit project status for ANY barangay, respond/resolve and
 * submit reports for ANY barangay, and the WHO/WHEN/WHAT audit log.
 */
export default function MunTransparencyPanel() {
  const { t } = useLanguage();
  const { state, actions } = useMunicipalStore();
  const [result, setResult] = useState<IMunStoreResult | null>(null);
  const [item, setItem] = useState("");
  const [office, setOffice] = useState("");
  const [amount, setAmount] = useState("");
  // Id of the budget line being edited (null = adding a new line).
  const [editId, setEditId] = useState<string | null>(null);
  const [prog, setProg] = useState<Record<string, { pct: string; status: IMunProjectStatus }>>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [rBrgy, setRBrgy] = useState(state.barangays[0]?.name ?? "");
  const [rTitle, setRTitle] = useState("");
  const [rBody, setRBody] = useState("");
  const counts = reportCounts(state);
  const total = state.budget.reduce((s, l) => s + l.amountPhp, 0);
  const editing = editId ? state.budget.find((l) => l.id === editId) : undefined;

  function resetBudgetForm() {
    setEditId(null);
    setItem("");
    setOffice("");
    setAmount("");
  }

  return (
    <MunSection title={t("mun.tab.m11")} icon="chart" source={`${MUN_SOURCE} · COA/DBM/DILG`}>
      <p className="mb-2 text-xs font-semibold text-teal">{t("mun.misc.scopeNote")}</p>
      <MunFeedback result={result} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className={ROW}>
          <p className={ROW_TITLE}>
            {t("mun.sec.budget")} · {formatPhp(total)}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-cmd-heading">
            {state.budget.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1">
                  {l.item} · {l.office}
                </span>
                <span className="font-semibold">{formatPhp(l.amountPhp)}</span>
                <button
                  type="button"
                  aria-label={`${t("mun.action.edit")}: ${l.item}`}
                  aria-pressed={editId === l.id}
                  onClick={() => {
                    setEditId(l.id);
                    setItem(l.item);
                    setOffice(l.office);
                    setAmount(String(l.amountPhp));
                    setResult(null);
                  }}
                  className={MUN_BTN_SMALL}
                >
                  {t("mun.action.edit")}
                </button>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              // Editing keeps the line's id and its CCET tag/code; a new line starts untagged.
              const r = actions.upsertBudgetLine({
                id: editing?.id,
                item,
                office,
                amountPhp: Number(amount),
                ccet: editing?.ccet ?? "none",
                ccetCode: editing?.ccetCode,
              });
              setResult(r);
              if (r.ok) {
                resetBudgetForm();
              }
            }}
          >
            <input aria-label={t("mun.f.item")} placeholder={t("mun.f.item")} value={item} onChange={(e) => setItem(e.target.value)} className={`${MUN_FIELD} sm:col-span-2`} />
            <input aria-label={t("mun.f.office")} placeholder={t("mun.f.office")} value={office} onChange={(e) => setOffice(e.target.value)} className={MUN_FIELD} />
            <input aria-label={t("mun.f.amount")} placeholder={t("mun.f.amount")} type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={MUN_FIELD} />
            <button type="submit" className={`${MUN_BTN_PRIMARY} ${editing ? "sm:col-span-3" : "sm:col-span-4"}`}>
              <Icon name="box" size={16} />
              {editing ? `${t("mun.action.save")}: ${editing.item}` : t("mun.sec.budgetUpload")}
            </button>
            {editing ? (
              <button type="button" onClick={resetBudgetForm} className={MUN_BTN_SMALL}>
                {t("mun.action.cancel")}
              </button>
            ) : null}
          </form>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.projects")}</p>
          <ul className="mt-1 space-y-2">
            {state.projects.map((p) => {
              const draft = prog[p.id] ?? { pct: String(p.completionPct), status: p.status };
              return (
                <li key={p.id} className="text-xs text-cmd-heading">
                  <p>
                    <span className="font-semibold">{p.name}</span> · {p.barangay === "Munisipyo" ? t("mun.misc.municipalWide") : `Brgy. ${p.barangay}`} ·{" "}
                    {p.completionPct}% · {t(`mun.proj.${p.status}` as const)}
                  </p>
                  <form
                    noValidate
                    className="mt-1 flex flex-wrap gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setResult(actions.setProjectProgress(p.id, Number(draft.pct), draft.status));
                    }}
                  >
                    <input
                      type="number"
                      min={0}
                      max={100}
                      aria-label={`${t("mun.f.progress")}: ${p.name}`}
                      value={draft.pct}
                      onChange={(e) => setProg((s) => ({ ...s, [p.id]: { ...draft, pct: e.target.value } }))}
                      className={`${MUN_FIELD} w-20`}
                    />
                    <select
                      aria-label={`${t("mun.f.status")}: ${p.name}`}
                      value={draft.status}
                      onChange={(e) => setProg((s) => ({ ...s, [p.id]: { ...draft, status: e.target.value as IMunProjectStatus } }))}
                      className={`${MUN_FIELD} w-32`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`mun.proj.${s}` as const)}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={MUN_BTN_SMALL}>
                      {t("mun.action.save")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>
            {t("mun.sec.reports")} · {t("mun.report.open")} {counts.pending} · {t("mun.report.resolved")} {counts.resolved}
          </p>
          <ul className="mt-1 space-y-2">
            {state.reports.map((r) => (
              <li key={r.id} className="text-xs text-cmd-heading">
                <div className="flex items-start justify-between gap-2">
                  <span>
                    <span className="font-semibold">Brgy. {r.barangay}:</span> {r.title}
                  </span>
                  <span className={`${MUN_CHIP} shrink-0 ${MUN_TONE_CHIP[r.status === "open" ? "caution" : "good"]}`}>
                    {t(`mun.report.${r.status}` as const)}
                  </span>
                </div>
                {r.response ? <p className="text-cmd-muted">↳ {r.response}</p> : null}
                {r.status !== "resolved" ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    <input
                      aria-label={t("mun.f.response")}
                      placeholder={t("mun.f.response")}
                      value={responses[r.id] ?? ""}
                      onChange={(e) => setResponses((s) => ({ ...s, [r.id]: e.target.value }))}
                      className={`${MUN_FIELD} min-w-32 flex-1`}
                    />
                    <button type="button" onClick={() => setResult(actions.respondReport(r.id, responses[r.id] ?? "", false))} className={MUN_BTN_SMALL}>
                      {t("mun.action.respond")}
                    </button>
                    <button type="button" onClick={() => setResult(actions.respondReport(r.id, responses[r.id] ?? "", true))} className={MUN_BTN_SMALL}>
                      {t("mun.action.resolve")}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="mt-3 space-y-1 border-t border-black/10 pt-2 dark:border-white/10"
            onSubmit={(e) => {
              e.preventDefault();
              const res = actions.submitReport(rBrgy, rTitle, rBody);
              setResult(res);
              if (res.ok) {
                setRTitle("");
                setRBody("");
              }
            }}
          >
            <p className={ROW_TITLE}>{t("mun.sec.submitReport")}</p>
            <label className={MUN_LABEL}>
              {t("mun.f.barangay")}
              <select value={rBrgy} onChange={(e) => setRBrgy(e.target.value)} className={`${MUN_FIELD} mt-1`}>
                {state.barangays.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <input aria-label={t("mun.f.title")} placeholder={t("mun.f.title")} value={rTitle} onChange={(e) => setRTitle(e.target.value)} className={MUN_FIELD} />
            <textarea aria-label={t("mun.f.body")} placeholder={t("mun.f.body")} rows={2} value={rBody} onChange={(e) => setRBody(e.target.value)} className={MUN_FIELD} />
            <button type="submit" className={MUN_BTN_PRIMARY}>
              {t("mun.action.submit")}
            </button>
          </form>
        </div>

        <div className={ROW}>
          <p className={ROW_TITLE}>{t("mun.sec.audit")}</p>
          {state.audit.length === 0 ? (
            <p className="mt-1 text-xs text-cmd-muted">{t("mun.empty.audit")}</p>
          ) : (
            <ul className="mt-1 max-h-72 space-y-1 overflow-y-auto pr-1">
              {state.audit.map((a) => (
                <li key={a.id} className="rounded bg-cmd-surface p-2 text-xs text-cmd-heading">
                  <p className="font-semibold">
                    {a.action} — {a.target}
                  </p>
                  <p className="text-cmd-muted">
                    {t("mun.col.who")}: {a.actor} · {t("mun.col.when")}: {formatDateTimeManila(a.at)} · {t("mun.col.what")}: {a.detail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MunSection>
  );
}
