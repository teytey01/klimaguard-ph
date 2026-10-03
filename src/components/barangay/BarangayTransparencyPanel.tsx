"use client";

import { useCallback, useEffect, useState } from "react";

import { useLanguage } from "@/components/common";
import { formatPeso, percent } from "@/lib/barangay";
import type { IBarangayView, ITransparencyData } from "@/types";
import BarangayCard from "./BarangayCard";
import BarangayProjectEditor from "./BarangayProjectEditor";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IBarangayTransparencyPanelProps {
  barangay: string;
  municipality: string;
  onSelectView: (view: IBarangayView) => void;
}

/**
 * M11 (one compact panel): OWN municipality's DRRM budget summary (view
 * only, from the DB; scope comes from the server session; no upload), own
 * barangay projects (editable, audited), other barangays (view only).
 */
export default function BarangayTransparencyPanel({
  barangay,
  municipality,
  onSelectView,
}: IBarangayTransparencyPanelProps) {
  const { t } = useLanguage();
  const { state } = useBarangayOps();
  const [budget, setBudget] = useState<ITransparencyData | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBudgetError(null);
    try {
      const res = await fetch("/api/db/transparency", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as
        | (ITransparencyData & { error?: string })
        | null;
      if (!res.ok || !body || body.error) {
        setBudgetError(body?.error ?? t("brgy.error.generic"));
        return;
      }
      setBudget(body);
    } catch {
      setBudgetError(t("brgy.error.generic"));
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void load();
      }
    });
    return () => {
      active = false;
    };
  }, [load]);

  const own = state.projects.filter((p) => p.editable);
  const others = state.projects.filter((p) => !p.editable);

  return (
    <BarangayCard
      title={t("brgy.tr.title")}
      icon="building"
      source={budget ? `${budget.source} · ${t("brgy.tr.source", { barangay })}` : t("brgy.tr.source", { barangay })}
    >
      <p className="mb-2 text-xs text-cmd-muted">{t("brgy.tr.budgetNote")}</p>
      <div className="rounded-lg bg-cmd-tile px-3 py-2 text-sm">
        {budget ? (
          <p className="text-cmd-heading">
            DRRM {budget.province} {budget.fiscalYear}: {formatPeso(budget.totalSpent)} /{" "}
            {formatPeso(budget.totalAllocated)} ({percent(budget.totalSpent, budget.totalAllocated)}%)
          </p>
        ) : budgetError ? (
          <p className="text-cmd-heading">
            {budgetError}{" "}
            <button type="button" onClick={() => void load()} className="min-h-[44px] font-semibold text-teal underline">
              {t("brgy.retry")}
            </button>
          </p>
        ) : (
          <div className="h-5 animate-pulse rounded bg-cmd-surface" aria-hidden="true" />
        )}
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase text-cmd-muted">{t("brgy.tr.ownTitle")}</p>
      <ul className="mt-1 space-y-2">
        {own.map((p) => (
          <BarangayProjectEditor key={`${p.id}-${p.completionPct}-${p.status}`} project={p} />
        ))}
      </ul>

      <p className="mt-3 text-[11px] font-semibold uppercase text-cmd-muted">
        {t("brgy.tr.otherTitle", { municipality })}
      </p>
      <ul className="mt-1 space-y-1.5">
        {others.map((p) => (
          <li key={p.id} className="flex justify-between gap-2 rounded-lg bg-cmd-tile px-3 py-2 text-sm">
            <span className="text-cmd-heading">{p.name}</span>
            <span className="shrink-0 text-xs text-cmd-muted">
              {t(`brgy.tr.status.${p.status}`)} · {p.completionPct}%
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelectView("reports")}
        className="mt-3 min-h-[44px] rounded-lg border border-teal/40 px-4 text-sm font-semibold text-teal"
      >
        {t("brgy.tr.reportsLink")}
      </button>
    </BarangayCard>
  );
}
