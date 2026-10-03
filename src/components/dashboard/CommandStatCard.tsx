import type { ICommandStat, IStatTone, IStatTrend } from "@/types";
import Icon from "@/components/common/Icon";

export interface ICommandStatCardProps {
  stat: ICommandStat;
}

/** Tone → accent color for the value + badge. */
const TONE_TEXT: Record<IStatTone, string> = {
  good: "text-teal",
  caution: "text-cmd-accent",
  critical: "text-alert",
  info: "text-cmd-heading",
};

const TONE_BADGE: Record<IStatTone, string> = {
  good: "bg-teal/15 text-teal",
  caution: "bg-cmd-accent/15 text-cmd-accent",
  critical: "bg-alert/15 text-alert",
  info: "bg-cmd-tile text-cmd-heading",
};

const TREND_MARK: Record<IStatTrend, string> = {
  up: "▲",
  down: "▼",
  flat: "▬",
};

/**
 * A single headline stat tile in the municipal command grid. Dark
 * command-center surface, Filipino-first label, source-tone accented value,
 * optional status badge and trend marker. Mirrors the Figma stat cards.
 */
export default function CommandStatCard({ stat }: ICommandStatCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl bg-cmd-surface p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={TONE_TEXT[stat.tone]}>
            <Icon name={stat.icon} size={18} />
          </span>
          <h3 className="text-sm font-semibold text-cmd-muted">{stat.label}</h3>
        </div>
        {stat.badge ? (
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TONE_BADGE[stat.tone]}`}
          >
            {stat.badge}
          </span>
        ) : null}
      </header>

      <div className="mt-4 flex items-baseline gap-2">
        <p className={`text-3xl font-bold leading-none ${TONE_TEXT[stat.tone]}`}>
          {stat.value}
        </p>
        {stat.unit ? (
          <span className="text-sm font-medium text-cmd-muted">
            {stat.unit}
          </span>
        ) : null}
        {stat.trend ? (
          <span
            className={`ml-auto text-xs ${TONE_TEXT[stat.tone]}`}
            aria-hidden="true"
          >
            {TREND_MARK[stat.trend]}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-cmd-muted">
        {stat.detail}
      </p>
    </article>
  );
}
