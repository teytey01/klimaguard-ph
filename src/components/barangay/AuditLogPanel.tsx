"use client";

import { Icon, useLanguage } from "@/components/common";
import BarangayCard from "./BarangayCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IAuditLogPanelProps {
  barangay: string;
}

function manilaStamp(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(iso));
}

/** WHO / WHEN / WHAT trail of every official edit (newest first) + demo reset. */
export default function AuditLogPanel({ barangay }: IAuditLogPanelProps) {
  const { t } = useLanguage();
  const { state, reset } = useBarangayOps();

  return (
    <BarangayCard
      title={t("brgy.auditPanel.title")}
      icon="lock"
      badge={String(state.audit.length)}
      source={t("brgy.source.ops", { barangay })}
    >
      <p className="text-sm text-cmd-muted">{t("brgy.auditPanel.subtitle")}</p>
      {state.audit.length === 0 ? (
        <p className="mt-3 rounded-lg bg-cmd-tile p-3 text-sm text-cmd-muted">
          {t("brgy.auditPanel.empty")}
        </p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {state.audit.map((a) => (
            <li key={a.id} className="rounded-lg bg-cmd-tile px-3 py-2 text-sm">
              <p className="text-cmd-heading">{a.what}</p>
              <p className="text-[11px] text-cmd-muted">
                {a.who} · {manilaStamp(a.at)} PST
              </p>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        onClick={() => {
          if (window.confirm(t("brgy.auditPanel.confirm"))) {
            reset();
          }
        }}
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-black/10 px-4 text-sm font-semibold text-cmd-muted hover:text-cmd-heading dark:border-white/15"
      >
        <Icon name="arrow-left" size={16} />
        {t("brgy.auditPanel.reset")}
      </button>
    </BarangayCard>
  );
}
