"use client";

import { useCallback, useEffect, useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import type { ICommunityReport, IReportStatus, IReportsResponse } from "@/types";
import type { ITranslationKey } from "@/lib/i18n";

export interface IReportsTabProps {
  /** Hide the submit form (municipal officials file through other channels). */
  canSubmit?: boolean;
}

const STATUS_KEY: Record<IReportStatus, ITranslationKey> = {
  open: "res.reports.status.open",
  responded: "res.reports.status.responded",
  resolved: "res.reports.status.resolved",
};

const STATUS_TONE: Record<IReportStatus, string> = {
  open: "bg-cmd-accent/15 text-cmd-accent",
  responded: "bg-teal/15 text-teal",
  resolved: "bg-cmd-tile text-cmd-muted",
};

const FIELD_CLASS =
  "mt-1 w-full rounded-lg border border-black/10 bg-cmd-tile px-3 py-2.5 text-sm text-cmd-heading placeholder:text-cmd-muted/70 focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15";

/**
 * M11 community reports, backed by the database. The server scopes everything:
 * residents see and file reports in their own barangay; barangay officials see
 * their barangay and can respond; municipal officials see the municipality.
 * Reports are anonymous — no reporter identity ever reaches the client.
 */
export default function ReportsTab({ canSubmit = true }: IReportsTabProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<IReportsResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      setData((await res.json()) as IReportsResponse);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitted(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const payload = (await res.json().catch(() => null)) as {
        report?: ICommunityReport;
        error?: string;
      } | null;
      if (!res.ok || !payload?.report) {
        setFormError(payload?.error ?? t("res.reports.loadError"));
        return;
      }
      setTitle("");
      setBody("");
      setSubmitted(true);
      const created = payload.report;
      setData((d) => (d ? { ...d, reports: [created, ...d.reports] } : d));
    } catch {
      setFormError(t("res.reports.loadError"));
    } finally {
      setSubmitting(false);
    }
  }

  function replaceReport(updated: ICommunityReport) {
    setData((d) =>
      d ? { ...d, reports: d.reports.map((r) => (r.id === updated.id ? updated : r)) } : d,
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-cmd-surface p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-cmd-heading">
          <span className="text-teal">
            <Icon name="scroll" size={18} />
          </span>
          {t("res.reports.title")}
        </h2>
        <p className="mt-1 text-sm text-cmd-muted">{t("res.reports.subtitle")}</p>
        {data ? (
          <p className="mt-2 text-xs font-medium text-teal">
            {t("res.reports.scope", { scope: data.scopeLabel })}
          </p>
        ) : null}

        {canSubmit ? (
          <form onSubmit={submit} className="mt-4" noValidate>
            <label className="block text-sm font-medium text-cmd-heading">
              {t("res.reports.newTitle")}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder={t("res.reports.newTitlePlaceholder")}
                className={FIELD_CLASS}
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-cmd-heading">
              {t("res.reports.newBody")}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={t("res.reports.newBodyPlaceholder")}
                className={FIELD_CLASS}
              />
            </label>
            {formError ? (
              <p className="mt-2 text-sm text-alert" role="alert">
                {formError}
              </p>
            ) : null}
            {submitted ? (
              <p className="mt-2 text-sm text-teal" role="status">
                {t("res.reports.submitted")}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting || title.trim().length < 4 || body.trim().length < 10}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              <Icon name="broadcast" size={16} />
              {submitting ? t("res.reports.submitting") : t("res.reports.submit")}
            </button>
          </form>
        ) : null}
      </section>

      {loadError ? (
        <section className="rounded-xl bg-cmd-surface p-5">
          <p className="text-sm text-cmd-heading">{t("res.reports.loadError")}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white"
          >
            {t("res.reports.retry")}
          </button>
        </section>
      ) : !data ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="h-24 animate-pulse rounded-xl bg-cmd-tile" />
          <div className="h-24 animate-pulse rounded-xl bg-cmd-tile" />
        </div>
      ) : data.reports.length === 0 ? (
        <p className="rounded-xl bg-cmd-surface p-5 text-sm text-cmd-muted">
          {t("res.reports.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {data.reports.map((report) => (
            <ReportItem
              key={report.id}
              report={report}
              canRespond={data.canRespond}
              onUpdated={replaceReport}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface IReportItemProps {
  report: ICommunityReport;
  canRespond: boolean;
  onUpdated: (report: ICommunityReport) => void;
}

/** One report card, with an inline respond form for in-scope officials. */
function ReportItem({ report, canRespond, onUpdated }: IReportItemProps) {
  const { t } = useLanguage();
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(status: "responded" | "resolved") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(report.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: response || report.response, status }),
      });
      const payload = (await res.json().catch(() => null)) as {
        report?: ICommunityReport;
        error?: string;
      } | null;
      if (!res.ok || !payload?.report) {
        setError(payload?.error ?? t("res.reports.loadError"));
        return;
      }
      setResponse("");
      onUpdated(payload.report);
    } catch {
      setError(t("res.reports.loadError"));
    } finally {
      setBusy(false);
    }
  }

  const date = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(report.createdAt));

  return (
    <li className="rounded-xl bg-cmd-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-cmd-heading">{report.title}</p>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[report.status]}`}
        >
          {t(STATUS_KEY[report.status])}
        </span>
      </div>
      <p className="mt-1 text-sm text-cmd-muted">{report.body}</p>
      <p className="mt-2 text-[11px] text-cmd-muted">
        Brgy. {report.barangay} · {date}
        {report.mine ? ` · ${t("res.reports.mine")}` : ""}
      </p>

      {report.response ? (
        <div className="mt-3 rounded-lg border-l-2 border-teal bg-cmd-tile p-3">
          <p className="text-[11px] font-semibold uppercase text-teal">
            {t("res.reports.officialResponse")}
          </p>
          <p className="mt-1 text-sm text-cmd-heading">{report.response}</p>
        </div>
      ) : null}

      {canRespond && report.status !== "resolved" ? (
        <div className="mt-3">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={2}
            maxLength={1000}
            aria-label={t("res.reports.respondPlaceholder")}
            placeholder={t("res.reports.respondPlaceholder")}
            className={FIELD_CLASS}
          />
          {error ? (
            <p className="mt-1 text-xs text-alert" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void respond("responded")}
              disabled={busy || response.trim().length < 4}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {t("res.reports.respond")}
            </button>
            <button
              type="button"
              onClick={() => void respond("resolved")}
              disabled={busy || (response.trim().length < 4 && !report.response)}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-teal/40 px-3 py-2 text-xs font-semibold text-teal disabled:opacity-60"
            >
              {t("res.reports.resolve")}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
