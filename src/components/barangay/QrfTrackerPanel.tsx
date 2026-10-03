"use client";

import { useState } from "react";

import { useLanguage } from "@/components/common";
import {
  addQrfEntry,
  formatPeso,
  manilaTime,
  percent,
  qrfRemaining,
  qrfSpent,
  widthClass,
} from "@/lib/barangay";
import BarangayCard from "./BarangayCard";
import { newBarangayId, useBarangayOps } from "./BarangayOpsProvider";

export interface IQrfTrackerPanelProps {
  barangay: string;
}

const FIELD_CLASS =
  "mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15";

/** M7 barangay QRF (30% of BDRRMF): allocated / spent / remaining + expenses. */
export default function QrfTrackerPanel({ barangay }: IQrfTrackerPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const qrf = state.qrf;
  const spent = qrfSpent(qrf);
  const remaining = qrfRemaining(qrf);
  const pct = percent(spent, qrf.allocated);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    const check = addQrfEntry(state, label, n, new Date(), "check");
    if (check.error) {
      setError(
        check.error === "over-limit"
          ? t("brgy.qrf.errOver", { remaining: formatPeso(remaining) })
          : t("brgy.qrf.errInvalid"),
      );
      return;
    }
    setError(null);
    const id = newBarangayId();
    const clean = label.trim().slice(0, 120);
    update((s, at) => addQrfEntry(s, clean, n, at, id).state, {
      what: t("brgy.audit.qrf", { amount: formatPeso(Math.round(n)), label: clean }),
      category: "drrm",
    });
    setLabel("");
    setAmount("");
  }

  return (
    <BarangayCard
      title={t("brgy.qrf.title")}
      icon="chart"
      badge={`${pct}%`}
      source={t("brgy.source.ops", { barangay })}
    >
      <p className="text-sm text-cmd-muted">
        {t("brgy.qrf.subtitle", { bdrrmf: formatPeso(qrf.bdrrmf) })}
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-cmd-tile p-2">
          <dt className="text-[11px] text-cmd-muted">{t("brgy.qrf.allocated")}</dt>
          <dd className="text-sm font-semibold text-cmd-heading">{formatPeso(qrf.allocated)}</dd>
        </div>
        <div className="rounded-lg bg-cmd-tile p-2">
          <dt className="text-[11px] text-cmd-muted">{t("brgy.qrf.spent")}</dt>
          <dd className="text-sm font-semibold text-teal">{formatPeso(spent)}</dd>
        </div>
        <div className="rounded-lg bg-cmd-tile p-2">
          <dt className="text-[11px] text-cmd-muted">{t("brgy.qrf.remaining")}</dt>
          <dd className="text-sm font-semibold text-cmd-heading">{formatPeso(remaining)}</dd>
        </div>
      </dl>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cmd-tile">
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("brgy.qrf.spent")}
          className={`h-full rounded-full bg-teal ${widthClass(pct)}`}
        />
      </div>

      <form onSubmit={add} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" noValidate>
        <label className="text-xs font-medium text-cmd-muted sm:col-span-2">
          {t("brgy.qrf.label")}
          <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} className={FIELD_CLASS} />
        </label>
        <label className="text-xs font-medium text-cmd-muted">
          {t("brgy.qrf.amount")}
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        {error ? (
          <p role="alert" className="text-xs text-alert sm:col-span-3">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90 sm:col-span-3"
        >
          {t("brgy.qrf.add")}
        </button>
      </form>

      <ul className="mt-3 space-y-1.5 text-sm">
        {qrf.entries.map((e) => (
          <li key={e.id} className="flex justify-between gap-2 rounded-lg bg-cmd-tile px-3 py-2">
            <span className="min-w-0 text-cmd-heading">
              {e.label}
              <span className="block text-[11px] text-cmd-muted">{manilaTime(e.at)} PST</span>
            </span>
            <span className="shrink-0 font-semibold text-cmd-heading">{formatPeso(e.amount)}</span>
          </li>
        ))}
      </ul>
    </BarangayCard>
  );
}
