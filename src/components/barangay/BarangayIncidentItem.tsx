"use client";

import { useState } from "react";

import { useLanguage } from "@/components/common";
import { useNow } from "@/hooks";
import { agoKey, resolveReport, respondReport } from "@/lib/barangay";
import type { IBarangayIncidentReport, IBarangayReportStatus } from "@/types";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IBarangayIncidentItemProps {
  report: IBarangayIncidentReport;
}

const STATUS_TONE: Record<IBarangayReportStatus, string> = {
  pending: "bg-cmd-accent text-cmd-accent-text",
  responded: "bg-teal/15 text-teal",
  resolved: "bg-cmd-tile text-cmd-muted",
};

/** One own-barangay incident with inline respond / resolve actions (audited). */
export default function BarangayIncidentItem({ report }: IBarangayIncidentItemProps) {
  const { t } = useLanguage();
  const { update } = useBarangayOps();
  const now = useNow(30_000);
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");

  const reported = agoKey(report.reportedAt, now);
  const resolved = report.resolvedAt ? agoKey(report.resolvedAt, now) : null;

  function respond() {
    if (text.trim().length < 2) {
      return;
    }
    update((s) => respondReport(s, report.id, text.slice(0, 500)), {
      what: t("brgy.audit.reportRespond", { title: report.title }),
      category: "reports",
    });
    setText("");
    setReplying(false);
  }

  function resolve() {
    update((s, at) => resolveReport(s, report.id, text.slice(0, 500), at), {
      what: t("brgy.audit.reportResolve", { title: report.title }),
      category: "reports",
    });
    setText("");
    setReplying(false);
  }

  return (
    <li className="rounded-lg bg-cmd-tile p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-cmd-heading">{report.title}</p>
        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[report.status]}`}>
          {t(`brgy.reports.status.${report.status}`)}
        </span>
      </div>
      <p className="text-xs text-cmd-muted">
        {report.location} · {t("brgy.reports.reported", { ago: t(reported.key, { n: reported.n }) })}
        {resolved ? ` · ${t("brgy.reports.resolvedAgo", { ago: t(resolved.key, { n: resolved.n }) })}` : ""}
      </p>
      {report.response ? (
        <p className="mt-2 border-l-2 border-teal pl-2 text-sm text-cmd-heading">{report.response}</p>
      ) : null}

      {report.status !== "resolved" ? (
        <div className="mt-2">
          {replying ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={500}
              aria-label={t("brgy.reports.responsePlaceholder")}
              placeholder={t("brgy.reports.responsePlaceholder")}
              className="w-full rounded-lg border border-black/10 bg-cmd-surface px-3 py-2 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
            />
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {replying ? (
              <button
                type="button"
                onClick={respond}
                disabled={text.trim().length < 2}
                className="min-h-[44px] rounded-lg bg-teal px-3 text-xs font-semibold text-white disabled:opacity-60"
              >
                {t("brgy.reports.send")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setReplying(true)}
                className="min-h-[44px] rounded-lg bg-teal px-3 text-xs font-semibold text-white"
              >
                {t("brgy.reports.respond")}
              </button>
            )}
            <button
              type="button"
              onClick={resolve}
              className="min-h-[44px] rounded-lg border border-teal/40 px-3 text-xs font-semibold text-teal"
            >
              {t("brgy.reports.resolve")}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
