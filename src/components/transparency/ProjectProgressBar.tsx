import { progressWidthClass } from "@/lib/utils/progressWidth";

export interface IProjectProgressBarProps {
  label: string;
  /** 0–100 */
  pct: number;
  /** Track colour class (differs on tile vs surface backgrounds). */
  trackClassName?: string;
}

/** Labelled teal progress bar used on project cards and detail views. */
export default function ProjectProgressBar({
  label,
  pct,
  trackClassName = "bg-cmd-tile",
}: IProjectProgressBarProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-cmd-muted">{label}</span>
        <span className="font-semibold text-cmd-heading">{pct}%</span>
      </div>
      <div className={`mt-1 h-2 w-full overflow-hidden rounded-full ${trackClassName}`}>
        <div
          className={`h-full rounded-full bg-teal ${progressWidthClass(pct)}`}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct}%`}
        />
      </div>
    </div>
  );
}
