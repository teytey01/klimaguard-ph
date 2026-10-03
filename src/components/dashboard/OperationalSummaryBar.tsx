import type { ICommandSummary, ICommandSummaryItem } from "@/types";
import Icon from "@/components/common/Icon";

export interface IOperationalSummaryBarProps {
  summary: ICommandSummary;
  /** Optional live weather snippet (e.g. "31°C · Maaraw") from useWeather. */
  weatherLine?: string;
  /** ISO timestamp of the last data refresh, shown as "Huling update". */
  fetchedAt?: string;
}

const TONE_PILL: Record<ICommandSummaryItem["tone"], string> = {
  accent: "bg-cmd-accent text-cmd-accent-text",
  neutral: "bg-cmd-tile text-cmd-heading",
  alert: "bg-alert text-white",
};

function formatUpdated(iso?: string): string {
  if (!iso) {
    return "";
  }
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
 * The MDRRMO command title + operational summary bar. Dark command-center
 * surface that stays constant across light/dark themes (an operations console
 * reads the same in both). Mirrors the Figma hero bar (node 8:6).
 */
export default function OperationalSummaryBar({
  summary,
  weatherLine,
  fetchedAt,
}: IOperationalSummaryBarProps) {
  const updated = formatUpdated(fetchedAt);

  return (
    <section className="rounded-xl bg-cmd-surface p-5 shadow-md sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-cmd-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-cmd-accent-text">
              {summary.activeModule}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cmd-accent">
              <span
                className="inline-block size-2 animate-pulse rounded-full bg-cmd-accent"
                aria-hidden="true"
              />
              Tumatakbo ang EOC SITREP
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-semibold leading-tight text-cmd-heading sm:text-3xl">
            {summary.title}
          </h1>
          <p className="mt-1 text-sm font-medium text-cmd-heading/90 sm:text-base">
            Munisipalidad ng {summary.municipality}, {summary.province} ·{" "}
            {summary.region}
          </p>
          <p className="mt-2 max-w-2xl text-sm text-cmd-muted">
            {summary.subtitle}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {summary.summaryItems.map((item) => (
              <li
                key={item.label}
                className={`flex items-baseline gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${TONE_PILL[item.tone]}`}
              >
                <span className="uppercase tracking-wide opacity-80">
                  {item.label}
                </span>
                <span>{item.value}</span>
              </li>
            ))}
            {weatherLine ? (
              <li className="flex items-baseline gap-1.5 rounded-md bg-cmd-tile px-3 py-1.5 text-xs font-semibold text-cmd-heading">
                <span className="uppercase tracking-wide opacity-80">
                  Panahon
                </span>
                <span>{weatherLine}</span>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-3">
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-cmd-accent px-6 py-3 text-sm font-semibold text-cmd-accent-text shadow-md transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmd-accent"
          >
            <Icon name="scroll" size={16} />
            I-export ang Municipal DANA Report (PDF)
          </button>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-cmd-tile px-5 py-3 text-sm font-medium text-cmd-heading transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmd-tile"
          >
            <Icon name="scroll" size={16} />
            TOC Printout
          </button>
          {updated ? (
            <p className="text-right text-xs text-cmd-muted">
              Huling update: {updated} PHT
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
