"use client";

import { Icon } from "@/components/common";
import type { IconName } from "@/types";

export interface IBarangayCardProps {
  title: string;
  icon: IconName;
  /** Small status badge in the header (e.g. "Monitored"). */
  badge?: string;
  /** Alert tone for emergency/critical states only. */
  tone?: "normal" | "alert";
  /** Attribution line — required on every data surface. */
  source: string;
  /** When set, the header becomes a button that jumps to the detail view. */
  onOpen?: () => void;
  openLabel?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Card shell shared by every Barangay Official panel: icon + title, optional
 * badge, content, and a source attribution line. Theme-aware via cmd tokens.
 */
export default function BarangayCard({
  title,
  icon,
  badge,
  tone = "normal",
  source,
  onOpen,
  openLabel,
  className = "",
  children,
}: IBarangayCardProps) {
  const isAlert = tone === "alert";
  const heading = (
    <span className="flex min-w-0 items-center gap-2">
      <span className={isAlert ? "text-alert" : "text-teal"}>
        <Icon name={icon} size={18} />
      </span>
      <span className="truncate text-sm font-semibold text-cmd-heading">{title}</span>
    </span>
  );

  return (
    <section
      className={`flex flex-col rounded-xl border bg-cmd-surface p-4 sm:p-5 ${
        isAlert ? "border-alert/60" : "border-black/5 dark:border-white/10"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={openLabel}
            className="-m-1 flex min-h-[44px] min-w-0 items-center gap-1 rounded-lg p-1 text-left hover:bg-cmd-tile focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {heading}
            <span className="text-cmd-muted">
              <Icon name="chevron-right" size={14} />
            </span>
          </button>
        ) : (
          <h2 className="flex min-h-[44px] min-w-0 items-center">{heading}</h2>
        )}
        {badge ? (
          <span
            className={`mt-2.5 shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
              isAlert ? "bg-alert text-white" : "bg-teal/15 text-teal"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex-1">{children}</div>
      <p className="mt-3 text-right text-[11px] text-cmd-muted">{source}</p>
    </section>
  );
}
