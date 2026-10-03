"use client";

import { useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import { useNow } from "@/hooks";
import {
  agoKey,
  danaRemainingMs,
  formatCountdown,
  formatPeso,
  resetDana,
  startDana,
  submitDana,
  updateDana,
  type IDanaPatch,
} from "@/lib/barangay";
import type { IBarangayDanaForm } from "@/types";
import type { ITranslationKey } from "@/lib/i18n";
import BarangayCard from "./BarangayCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IDanaFormPanelProps {
  barangay: string;
  municipality: string;
}

type INumberField =
  | "affectedFamilies"
  | "affectedPersons"
  | "dead"
  | "injured"
  | "missing"
  | "housesDamaged";

// Short form (scope-reduced). Agriculture damage auto-fills from M5.
const NUMBER_FIELDS: { key: INumberField; label: ITranslationKey }[] = [
  { key: "affectedFamilies", label: "brgy.dana.families" },
  { key: "affectedPersons", label: "brgy.dana.persons" },
  { key: "dead", label: "brgy.dana.dead" },
  { key: "injured", label: "brgy.dana.injured" },
  { key: "missing", label: "brgy.dana.missing" },
  { key: "housesDamaged", label: "brgy.dana.housesDamaged" },
];

const FIELD_CLASS =
  "mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-60 dark:border-white/15";

/**
 * M7 barangay DANA with the 3-hour MDRRMC deadline countdown. Submitting
 * validates the form and generates the BDRRMC → MDRRMC SitRep (audited).
 */
export default function DanaFormPanel({ barangay, municipality }: IDanaFormPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const now = useNow(1000);
  const [error, setError] = useState<ITranslationKey | null>(null);
  const [copy, setCopy] = useState<"idle" | "ok" | "fail">("idle");

  const dana = state.dana;
  const remaining = danaRemainingMs(dana, now);
  const submitted = Boolean(dana.submittedAt);
  const overdue = remaining !== null && remaining < 0 && !submitted;
  const locked = !dana.startedAt || submitted;

  function patch(p: IDanaPatch) {
    // Field edits are not audited individually; the submit is.
    update((s) => updateDana(s, p), null);
  }

  function onNumber(key: INumberField, raw: string) {
    const n = raw === "" ? 0 : Number(raw);
    patch({ [key]: Number.isFinite(n) ? n : 0 } as Partial<Pick<IBarangayDanaForm, INumberField>>);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const check = submitDana(state, barangay, municipality, new Date());
    if (check.error) {
      setError(
        check.error === "not-started"
          ? "brgy.dana.errNotStarted"
          : check.error === "already-submitted"
            ? "brgy.dana.errSubmitted"
            : "brgy.dana.errInvalid",
      );
      return;
    }
    setError(null);
    update((s, at) => submitDana(s, barangay, municipality, at).state, {
      what: t("brgy.audit.danaSubmit", { municipality }),
      category: "drrm",
    });
  }

  async function copySitrep() {
    try {
      await navigator.clipboard.writeText(dana.sitrep ?? "");
      setCopy("ok");
    } catch {
      setCopy("fail");
    }
  }

  const submittedAgo = dana.submittedAt ? agoKey(dana.submittedAt, now) : null;

  return (
    <BarangayCard
      title={t("brgy.dana.title")}
      icon="scroll"
      badge={
        remaining === null || submitted
          ? undefined
          : overdue
            ? t("brgy.dana.overdue", { time: formatCountdown(remaining) })
            : t("brgy.dana.remaining", { time: formatCountdown(remaining) })
      }
      tone={overdue ? "alert" : "normal"}
      source={t("brgy.source.ops", { barangay })}
    >
      <p className="text-sm text-cmd-muted">{t("brgy.dana.subtitle")}</p>

      {!dana.startedAt ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-cmd-heading">{t("brgy.dana.notStarted")}</p>
          <button
            type="button"
            onClick={() =>
              update((s, at) => startDana(s, at), {
                what: t("brgy.audit.danaStart"),
                category: "drrm",
              })
            }
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            <Icon name="check" size={16} />
            {t("brgy.dana.start")}
          </button>
        </div>
      ) : remaining !== null && !submitted ? (
        <p
          role="timer"
          aria-live="off"
          className={`mt-3 rounded-lg px-3 py-2 text-center text-xl font-bold tabular-nums ${
            overdue ? "bg-alert text-white" : "bg-cmd-tile text-cmd-heading"
          }`}
        >
          {overdue
            ? t("brgy.dana.overdue", { time: formatCountdown(remaining) })
            : t("brgy.dana.remaining", { time: formatCountdown(remaining) })}
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-3" noValidate>
        <fieldset disabled={locked} className="grid grid-cols-2 gap-2">
          {NUMBER_FIELDS.map((f) => (
            <label key={f.key} className="text-xs font-medium text-cmd-muted">
              {t(f.label)}
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={dana[f.key]}
                onChange={(e) => onNumber(f.key, e.target.value)}
                className={FIELD_CLASS}
              />
            </label>
          ))}
          <p className="col-span-2 text-xs text-cmd-muted">
            {t("brgy.dana.agri")}: {formatPeso(dana.agricultureDamagePhp)}
          </p>
          <label className="col-span-2 text-xs font-medium text-cmd-muted">
            {t("brgy.dana.needs")}
            <textarea
              value={dana.needs}
              onChange={(e) => patch({ needs: e.target.value.slice(0, 500) })}
              rows={2}
              className={FIELD_CLASS}
            />
          </label>
        </fieldset>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-alert">
            {t(error)}
          </p>
        ) : null}
        {!submitted ? (
          <button
            type="submit"
            disabled={!dana.startedAt}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            <Icon name="arrow-right" size={16} />
            {t("brgy.dana.submit")}
          </button>
        ) : null}
      </form>

      {submitted && dana.sitrep ? (
        <div className="mt-4">
          {submittedAgo ? (
            <p role="status" className="text-sm font-semibold text-teal">
              {t("brgy.dana.submitted", { ago: t(submittedAgo.key, { n: submittedAgo.n }) })}
            </p>
          ) : null}
          <p className="mt-2 text-xs font-bold uppercase text-cmd-muted">{t("brgy.dana.sitrep")}</p>
          <textarea
            readOnly
            value={dana.sitrep}
            rows={12}
            aria-label={t("brgy.dana.sitrep")}
            className="mt-1 w-full rounded-lg border border-black/10 bg-cmd-tile p-3 font-mono text-xs text-cmd-heading dark:border-white/15"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copySitrep()}
              className="min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              {t("brgy.dana.copy")}
            </button>
            <button
              type="button"
              onClick={() => {
                setCopy("idle");
                update((s) => resetDana(s), { what: t("brgy.audit.danaReset"), category: "drrm" });
              }}
              className="min-h-[44px] rounded-lg border border-teal/40 px-4 text-sm font-semibold text-teal"
            >
              {t("brgy.dana.new")}
            </button>
            {copy !== "idle" ? (
              <span role="status" className="text-xs text-cmd-muted">
                {copy === "ok" ? t("brgy.dana.copied") : t("brgy.dana.copyError")}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </BarangayCard>
  );
}
