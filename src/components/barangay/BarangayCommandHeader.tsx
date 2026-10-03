"use client";

import { Icon, useLanguage } from "@/components/common";
import type { IHazardAlert } from "@/types";

export interface IBarangayCommandHeaderProps {
  barangay: string;
  municipality: string;
  province: string;
  /** Active hazard (from useAlerts); null = normal conditions. */
  alert: IHazardAlert | null;
  /** Alert feed attribution (useAlerts state.source). */
  alertSource?: string;
  onDispatch: () => void;
}

/**
 * Barangay command header: emergency override strip (only while a hazard is
 * active — safety overrides the normal look), location / role / status pills,
 * the barangay title, and the primary "dispatch Tanod patrol" action.
 */
export default function BarangayCommandHeader({
  barangay,
  municipality,
  province,
  alert,
  alertSource,
  onDispatch,
}: IBarangayCommandHeaderProps) {
  const { t } = useLanguage();
  const signal = alert?.signalLevel ?? 0;

  return (
    <header className="space-y-3">
      {alert ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-alert px-3 py-2 text-xs font-bold uppercase tracking-wide text-white sm:text-sm"
        >
          <span className="shrink-0">
            <Icon name="alert-triangle" size={16} />
          </span>
          <span className="truncate">
            {t("brgy.emergencyStrip", { municipality: municipality.toUpperCase(), signal })}
          </span>
        </div>
      ) : null}

      <div className="rounded-xl bg-cmd-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-sm font-bold text-cmd-heading">
            KlimaGuard <span className="text-teal">PH</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-cmd-tile px-2.5 py-1 text-cmd-heading">
            <Icon name="location" size={12} />
            {municipality}, {province}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-1 text-teal">
            <Icon name="radio" size={12} />
            {t("brgy.roleBadge")}
          </span>
          {alert ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-alert px-2.5 py-1 text-white">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-white" />
              {t("brgy.statusAlert", { signal })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2.5 py-1 text-white">
              {t("brgy.statusNormal")}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-cmd-heading sm:text-2xl">
              {t("brgy.title", { barangay, municipality })}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-cmd-muted">
              {alert
                ? t("brgy.subtitleAlert", { signal })
                : t("brgy.subtitleNormal")}
            </p>
            {alertSource ? (
              <p className="mt-1 text-[11px] text-cmd-muted">
                {t("brgy.source.alerts", { source: alertSource })}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onDispatch}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-cmd-surface"
          >
            <Icon name="users" size={16} />
            {t("brgy.dispatchCta")}
          </button>
        </div>
      </div>
    </header>
  );
}
