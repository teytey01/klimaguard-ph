import type { ITransparencyData } from "@/types";

export interface IBudgetTrackerProps {
  data: ITransparencyData;
  /**
   * "official" shows deeper tables (full category figures + timeline);
   * "resident" shows a simplified summary. Defaults to "resident".
   */
  context?: "official" | "resident";
}

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** Whole-number utilization percentage, clamped to 0–100. */
function utilization(spent: number, allocated: number): number {
  if (allocated <= 0) {
    return 0;
  }
  const pct = Math.round((spent / allocated) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Map a 0–100 percentage to a static Tailwind width class.
 *
 * Dynamic classes like `w-[${pct}%]` are interpolated at runtime, so Tailwind
 * v4's static scanner never emits the matching CSS and the bar renders with no
 * width. Snapping to the nearest 5% keeps every class string a literal the
 * scanner can see while staying within the "utility classes only" rule (no
 * inline `style`). The full set is listed below so the scanner picks them up.
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

export default function BudgetTracker({
  data,
  context = "resident",
}: IBudgetTrackerProps) {
  const { province, fiscalYear, totalAllocated, totalSpent, lines, timeline, source } =
    data;
  const remaining = Math.max(0, totalAllocated - totalSpent);
  const totalPct = utilization(totalSpent, totalAllocated);
  const isOfficial = context === "official";

  return (
    <section className="w-full rounded-2xl bg-card p-5 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-text">
            DRRM Pondo — {province}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Taon ng badyet: {fiscalYear}
          </p>
        </div>
        <p className="shrink-0 text-right text-sm font-semibold text-teal">
          {totalPct}% nagamit
        </p>
      </header>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">Nakalaan</dt>
          <dd className="mt-1 text-sm font-semibold text-text">
            {peso.format(totalAllocated)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">Nagastos</dt>
          <dd className="mt-1 text-sm font-semibold text-teal">
            {peso.format(totalSpent)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">Natitira</dt>
          <dd className="mt-1 text-sm font-semibold text-text">
            {peso.format(remaining)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-4">
        <h3 className="text-sm font-semibold text-text">
          Paggamit kada kategorya
        </h3>
        {lines.map((line) => {
          const pct = utilization(line.spent, line.allocated);
          return (
            <div key={line.category}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-text">{line.label}</p>
                <p className="text-xs text-text-muted">{pct}%</p>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full bg-teal ${widthClass(pct)}`}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${line.label}: ${pct}% nagamit`}
                />
              </div>
              {isOfficial ? (
                <p className="mt-1 text-xs text-text-muted">
                  {peso.format(line.spent)} / {peso.format(line.allocated)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {isOfficial ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text">
            Talaan ng paglabas at paggastos
          </h3>
          <ol className="mt-3 space-y-3 border-l border-surface-2 pl-4">
            {timeline.map((entry) => (
              <li key={`${entry.date}-${entry.label}`} className="relative">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-text">{entry.label}</p>
                  <p className="shrink-0 text-sm font-semibold text-teal">
                    {peso.format(entry.amount)}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {entry.date} ·{" "}
                  {entry.type === "release" ? "Paglabas" : "Paggastos"}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <p className="mt-4 text-right text-xs text-text-muted">{source}</p>
    </section>
  );
}
