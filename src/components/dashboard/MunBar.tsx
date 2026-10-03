import { pctWidthClass } from "@/lib/dashboard/municipalFormat";

export type IMunBarTone = "teal" | "alert" | "accent" | "navy";

export interface IMunBarProps {
  /** 0–100 */
  pct: number;
  /** Accessible label for the progress bar. */
  label: string;
  tone?: IMunBarTone;
}

const TONE: Record<IMunBarTone, string> = {
  teal: "bg-teal",
  alert: "bg-alert",
  accent: "bg-cmd-accent",
  navy: "bg-navy dark:bg-cmd-heading",
};

/** Horizontal percentage bar (static width classes, no inline styles). */
export default function MunBar({ pct, label, tone = "teal" }: IMunBarProps) {
  const value = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-cmd-tile"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`h-full rounded-full ${TONE[tone]} ${pctWidthClass(value)}`} />
    </div>
  );
}
