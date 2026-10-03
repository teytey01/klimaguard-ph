"use client";

import { useState } from "react";
import type { IAlertState } from "@/types";
import { useAlerts } from "@/hooks";

export interface IAlertBannerProps {
  state?: IAlertState | null;
}

const DISMISS_KEY = "klimaguard:alertDismissedSignal";

// Manual Filipino day/month maps (date-fns has no "fil" locale installed).
const FIL_DAYS = [
  "Linggo",
  "Lunes",
  "Martes",
  "Miyerkules",
  "Huwebes",
  "Biyernes",
  "Sabado",
] as const;

const FIL_MONTHS = [
  "Enero",
  "Pebrero",
  "Marso",
  "Abril",
  "Mayo",
  "Hunyo",
  "Hulyo",
  "Agosto",
  "Setyembre",
  "Oktubre",
  "Nobyembre",
  "Disyembre",
] as const;

function formatFilipinoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const day = FIL_DAYS[date.getDay()];
  const month = FIL_MONTHS[date.getMonth()];
  return `${day}, ${month} ${date.getDate()}`;
}

function readDismissedSignal(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) {
      return 0;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

function writeDismissedSignal(signalLevel: number): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DISMISS_KEY, String(signalLevel));
  } catch {
    // Best-effort; ignore storage failures (quota, privacy mode).
  }
}

export function AlertBanner({ state }: IAlertBannerProps) {
  const internal = useAlerts();
  const resolved = state !== undefined ? state : internal.state;

  const [dismissedSignal, setDismissedSignal] = useState<number>(
    readDismissedSignal
  );

  const alert = resolved?.alert ?? null;
  const hasHazard = Boolean(resolved?.hasActiveHazard && alert);

  if (!hasHazard || !alert) {
    return null;
  }

  // Reappear-on-worsening: a stored dismissal only hides the banner while the
  // current signal is at or below the dismissed level.
  const isDismissed = alert.signalLevel <= dismissedSignal;
  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    writeDismissedSignal(alert.signalLevel);
    setDismissedSignal(alert.signalLevel);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 w-full bg-[#E53E3E] text-white"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 animate-pulse text-2xl leading-none"
          >
            ⚠️
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide">
              Signal No. {alert.signalLevel} — {alert.typhoonName}
            </p>
            <p className="text-sm text-white/90">
              Apektadong lugar: {alert.affectedAreas.join(", ")}
            </p>
            <p className="text-xs text-white/80">
              {formatFilipinoDate(alert.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:911"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-[#E53E3E]"
          >
            Tawagan ang 911
          </a>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Isara ang alerto"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-white/60 px-3 py-2 text-sm font-semibold text-white"
          >
            Isara
          </button>
        </div>
      </div>
    </div>
  );
}
