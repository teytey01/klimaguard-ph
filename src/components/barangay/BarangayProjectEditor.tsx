"use client";

import { useState } from "react";

import { useLanguage } from "@/components/common";
import { setProjectProgress, widthClass } from "@/lib/barangay";
import type { IBarangayProject, IBarangayProjectStatus } from "@/types";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IBarangayProjectEditorProps {
  /** Must be an OWN-barangay (editable) project. */
  project: IBarangayProject;
}

const STATUSES: IBarangayProjectStatus[] = ["planned", "ongoing", "completed"];

/** M11 edit-own-barangay: update a project's completion % and status (audited). */
export default function BarangayProjectEditor({ project }: IBarangayProjectEditorProps) {
  const { t } = useLanguage();
  const { update } = useBarangayOps();
  const [pct, setPct] = useState(String(project.completionPct));
  const [status, setStatus] = useState<IBarangayProjectStatus>(project.status);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Math.min(100, Math.max(0, Math.round(Number(pct) || 0)));
    // Picking "completed" means 100%.
    const value = status === "completed" ? 100 : n;
    const nextStatus: IBarangayProjectStatus =
      value === 100 ? "completed" : status === "completed" ? "ongoing" : status;
    update((s) => setProjectProgress(s, project.id, value, nextStatus), {
      what: t("brgy.audit.project", {
        name: project.name,
        pct: value,
        status: t(`brgy.tr.status.${nextStatus}`),
      }),
      category: "transparency",
    });
  }

  return (
    <li className="rounded-lg bg-cmd-tile p-3">
      <p className="flex justify-between gap-2 text-sm">
        <span className="font-semibold text-cmd-heading">{project.name}</span>
        <span className="shrink-0 text-xs text-cmd-muted">
          {t(`brgy.tr.status.${project.status}`)} · {project.completionPct}%
        </span>
      </p>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cmd-surface">
        <div className={`h-full rounded-full bg-teal ${widthClass(project.completionPct)}`} />
      </div>
      <form onSubmit={save} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="text-[11px] font-medium text-cmd-muted">
          {t("brgy.tr.completion")}
          <input
            type="number"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-surface px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
          />
        </label>
        <label className="text-[11px] font-medium text-cmd-muted">
          {t("brgy.tanod.statusLabel")}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IBarangayProjectStatus)}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-surface px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`brgy.tr.status.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="col-span-2 min-h-[44px] self-end rounded-lg bg-teal px-4 text-sm font-semibold text-white sm:col-span-1"
        >
          {t("brgy.tr.update")}
        </button>
      </form>
    </li>
  );
}
