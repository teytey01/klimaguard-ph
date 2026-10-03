import type { IEvacuationStatus } from "@/types";
import Icon from "@/components/common/Icon";

export interface IEvacuationStatusPanelProps {
  centers: IEvacuationStatus[];
}

const STATUS_LABEL: Record<IEvacuationStatus["status"], string> = {
  open: "Bukas",
  "near-full": "Malapit nang puno",
  full: "Puno",
};

const STATUS_TONE: Record<IEvacuationStatus["status"], string> = {
  open: "bg-teal/15 text-teal",
  "near-full": "bg-cmd-accent/15 text-cmd-accent",
  full: "bg-alert/15 text-alert",
};

const BAR_TONE: Record<IEvacuationStatus["status"], string> = {
  open: "bg-teal",
  "near-full": "bg-cmd-accent",
  full: "bg-alert",
};

/**
 * Map a 0–100 occupancy percentage to a static Tailwind width class. Dynamic
 * `w-[${pct}%]` strings are never emitted by Tailwind v4's static scanner, so
 * we snap to the nearest 5% literal. (Same pattern as BudgetTracker.)
 *
 * w-0 w-[5%] w-[10%] w-[15%] w-[20%] w-[25%] w-[30%] w-[35%] w-[40%] w-[45%]
 * w-[50%] w-[55%] w-[60%] w-[65%] w-[70%] w-[75%] w-[80%] w-[85%] w-[90%]
 * w-[95%] w-full
 */
function widthClass(pct: number): string {
  const snapped = Math.round(pct / 5) * 5;
  if (snapped <= 0) {
    return "w-0";
  }
  if (snapped >= 100) {
    return "w-full";
  }
  return `w-[${snapped}%]`;
}

function occupancyPct(occupancy: number, capacity: number): number {
  if (capacity <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((occupancy / capacity) * 100)));
}

/**
 * Municipal-wide evacuation center occupancy (M4/M7 — all centers across the
 * municipality, per the Municipal Official access scope). Shows live-style
 * occupancy bars with Filipino status labels.
 */
export default function EvacuationStatusPanel({
  centers,
}: IEvacuationStatusPanelProps) {
  const openCount = centers.filter((c) => c.status !== "full").length;

  return (
    <section className="rounded-xl bg-cmd-surface p-5 shadow-sm">
      <header className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-cmd-heading">
          <span className="text-teal">
            <Icon name="home" size={18} />
          </span>
          Evacuation Centers — Buong Munisipyo
        </h2>
        <span className="shrink-0 rounded bg-cmd-tile px-2 py-0.5 text-xs font-semibold text-cmd-heading">
          {openCount}/{centers.length} bukas
        </span>
      </header>

      <ul className="mt-4 space-y-4">
        {centers.map((center) => {
          const pct = occupancyPct(center.occupancy, center.capacity);
          return (
            <li key={center.name}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-cmd-heading">
                    {center.name}
                  </p>
                  <p className="text-xs text-cmd-muted">
                    Brgy. {center.barangay}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONE[center.status]}`}
                >
                  {STATUS_LABEL[center.status]}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-cmd-tile">
                  <div
                    className={`h-full rounded-full ${BAR_TONE[center.status]} ${widthClass(pct)}`}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${center.name}: ${pct}% okupado`}
                  />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-cmd-muted">
                  {center.occupancy.toLocaleString("en-PH")}/
                  {center.capacity.toLocaleString("en-PH")}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
