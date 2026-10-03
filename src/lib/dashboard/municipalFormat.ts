import { progressWidthClass } from "@/lib/utils/progressWidth";

// Formatting helpers for the Municipal Command Center.

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** "₱1,200,000" */
export function formatPhp(value: number): string {
  return peso.format(value);
}

/** "₱28.1M" / "₱850K" */
export function formatPhpShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const m = value / 1_000_000;
    return `₱${m >= 10 ? m.toFixed(2).replace(/\.?0+$/, "") : m.toFixed(2).replace(/0$/, "")}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `₱${Math.round(value / 1_000)}K`;
  }
  return `₱${value}`;
}

/** "1,420" */
export function formatCount(value: number): string {
  return value.toLocaleString("en-PH");
}

/** Static Tailwind width class for a 0–100 bar (snapped to 5%). */
export function pctWidthClass(pct: number): string {
  return progressWidthClass(pct);
}

/** Whole-number percentage, clamped 0–100. */
export function pct(part: number, whole: number): number {
  if (whole <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

/** "14:05" in Asia/Manila. */
export function formatTimeManila(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Manila",
  }).format(d);
}

/** "Okt 4, 14:05" in Asia/Manila. */
export function formatDateTimeManila(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Manila",
  }).format(d);
}

/** 16-point compass label for a wind direction in degrees. */
export function compass(deg: number): string {
  const dirs = ["H", "HHS", "HS", "SHS", "S", "STS", "TS", "TTS", "T", "TTK", "TK", "KTK", "K", "KHK", "HK", "HHK"];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}
