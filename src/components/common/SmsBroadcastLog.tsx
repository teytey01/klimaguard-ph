"use client";

import { useSyncExternalStore } from "react";
import { useLanguage } from "@/components/common/LanguageProvider";
import Icon from "@/components/common/Icon";
import {
  clearBroadcasts,
  getBroadcasts,
  subscribeBroadcasts,
} from "@/lib/sms";
import type { ISmsBroadcast } from "@/types";

export interface ISmsBroadcastLogProps {
  className?: string;
}

const EMPTY: ISmsBroadcast[] = [];

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

/**
 * Visible log of simulated SMS broadcasts (OTP + hazard alerts). Subscribes to
 * the in-memory SMS store so judges can see exactly what messages *would* be
 * sent to registered residents. Nothing leaves the device — this is the
 * demo surface for the SMS feature.
 */
export default function SmsBroadcastLog({ className }: ISmsBroadcastLogProps) {
  const { t } = useLanguage();
  const broadcasts = useSyncExternalStore(
    subscribeBroadcasts,
    getBroadcasts,
    () => EMPTY,
  );

  return (
    <section
      className={`rounded-xl bg-cmd-surface p-5 shadow-sm ${className ?? ""}`}
      aria-label={t("sms.logTitle")}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-teal">
            <Icon name="broadcast" size={18} />
          </span>
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-cmd-heading">
              {t("sms.logTitle")}
              <span className="rounded bg-cmd-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cmd-accent">
                {t("sms.demoBadge")}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-cmd-muted">
              {t("sms.logSubtitle")}
            </p>
          </div>
        </div>
        {broadcasts.length > 0 ? (
          <button
            type="button"
            onClick={clearBroadcasts}
            className="shrink-0 rounded-md border border-white/15 px-2 py-1 text-xs text-cmd-muted hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {t("sms.clear")}
          </button>
        ) : null}
      </header>

      {broadcasts.length === 0 ? (
        <p className="mt-4 text-xs text-cmd-muted">{t("sms.empty")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {broadcasts.map((b) => (
            <li
              key={b.id}
              className="rounded-lg border-l-2 border-teal bg-cmd-tile p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-cmd-heading">
                  {b.source}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-cmd-muted">
                  {formatTime(b.sentAt)}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-cmd-heading">
                {b.message}
              </p>
              <p className="mt-1 text-[10px] text-cmd-muted">
                {t("sms.sentTo", { count: b.recipients.length })} ·{" "}
                {b.recipients.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
