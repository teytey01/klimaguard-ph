"use client";

import { useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import { ReportsTab } from "@/components/resident";
import { addReport, BARANGAY_HOTLINE, reportCounts } from "@/lib/barangay";
import BarangayCard from "./BarangayCard";
import BarangayIncidentItem from "./BarangayIncidentItem";
import { newBarangayId, useBarangayOps } from "./BarangayOpsProvider";

export interface IIncidentReportsPanelProps {
  barangay: string;
}

type IFilter = "all" | "pending" | "resolved";

const FIELD_CLASS =
  "mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 text-sm text-cmd-heading placeholder:text-cmd-muted/70 focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15";

/**
 * Own-barangay citizen incidents: BDRRMC incident log (respond / resolve,
 * live pending/resolved counts, walk-in entry) plus the DB-backed M11
 * community reports, whose respond/resolve scope is enforced server-side.
 */
export default function IncidentReportsPanel({ barangay }: IIncidentReportsPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const [filter, setFilter] = useState<IFilter>("all");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [addError, setAddError] = useState(false);

  const counts = reportCounts(state.reports);
  const visible = state.reports.filter((r) =>
    filter === "all" ? true : filter === "resolved" ? r.status === "resolved" : r.status !== "resolved",
  );

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 4 || location.trim().length < 2) {
      setAddError(true);
      return;
    }
    setAddError(false);
    const id = newBarangayId();
    const cleanTitle = title.trim().slice(0, 120);
    const cleanLoc = location.trim().slice(0, 120);
    update((s, at) => addReport(s, cleanTitle, cleanLoc, at, id), {
      what: t("brgy.audit.reportAdd", { title: cleanTitle }),
      category: "reports",
    });
    setTitle("");
    setLocation("");
    setFilter("all");
  }

  const filters: { id: IFilter; label: string }[] = [
    { id: "all", label: `${t("brgy.reports.filterAll")} (${state.reports.length})` },
    { id: "pending", label: `${t("brgy.reports.filterPending")} (${counts.pending})` },
    { id: "resolved", label: `${t("brgy.reports.filterResolved")} (${counts.resolved})` },
  ];

  return (
    <div className="space-y-4">
      <BarangayCard
        title={t("brgy.reports.title")}
        icon="scroll"
        badge={t("brgy.ops.reportCounts", { resolved: counts.resolved, pending: counts.pending })}
        source={t("brgy.source.ops", { barangay })}
      >
        <p className="text-sm text-cmd-muted">{t("brgy.reports.subtitle")}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-cmd-muted">
          <Icon name="phone" size={12} />
          {t("brgy.ops.hotline", { number: BARANGAY_HOTLINE })}
        </p>

        <div role="group" aria-label={t("brgy.reports.title")} className="mt-3 flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-[40px] rounded-lg px-3 text-xs font-semibold ${
                filter === f.id ? "bg-teal text-white" : "bg-cmd-tile text-cmd-muted hover:text-cmd-heading"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-3 rounded-lg bg-cmd-tile p-3 text-sm text-cmd-muted">
            {t("brgy.reports.empty")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visible.map((r) => (
              <BarangayIncidentItem key={r.id} report={r} />
            ))}
          </ul>
        )}

        <form onSubmit={add} className="mt-4 rounded-lg border border-dashed border-black/15 p-3 dark:border-white/15" noValidate>
          <p className="text-sm font-semibold text-cmd-heading">{t("brgy.reports.addTitle")}</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium text-cmd-muted">
              {t("brgy.reports.titleLabel")}
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={FIELD_CLASS} />
            </label>
            <label className="text-xs font-medium text-cmd-muted">
              {t("brgy.reports.locationLabel")}
              <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} className={FIELD_CLASS} />
            </label>
          </div>
          {addError ? (
            <p role="alert" className="mt-1 text-xs text-alert">
              {t("brgy.reports.addError")}
            </p>
          ) : null}
          <button
            type="submit"
            className="mt-2 min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("brgy.reports.add")}
          </button>
        </form>
      </BarangayCard>

      <section>
        <h2 className="text-base font-semibold text-cmd-heading">{t("brgy.reports.communityTitle")}</h2>
        <p className="mb-3 text-sm text-cmd-muted">{t("brgy.reports.communitySubtitle")}</p>
        <ReportsTab canSubmit={false} />
      </section>
    </div>
  );
}
