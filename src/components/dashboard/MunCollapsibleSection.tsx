import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/common/Icon";

export interface IMunCollapsibleSectionProps {
  title: string;
  icon?: IconName;
  /** Render the section expanded on first paint. Defaults to collapsed. */
  defaultOpen?: boolean;
  /** Teal-accent the summary header (e.g. for priority groups). */
  accent?: boolean;
  children: ReactNode;
}

/**
 * Progressive-disclosure wrapper for municipal Overview groups. Uses a native
 * <details>/<summary> so it is SSR-safe, keyboard-accessible and works with
 * zero JavaScript. The chevron rotates when the section is open via the
 * `group-open:` variant on the summary. Styled with cmd-* tokens so it reads
 * the same in light and dark.
 */
export default function MunCollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  accent = false,
  children,
}: IMunCollapsibleSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-black/5 bg-cmd-surface shadow-sm dark:border-white/5"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 font-ui text-sm font-semibold text-cmd-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {icon ? (
            <span className={accent ? "text-teal" : "text-cmd-muted"}>
              <Icon name={icon} size={18} />
            </span>
          ) : null}
          {title}
        </span>
        <span className="text-cmd-muted transition-transform duration-200 group-open:rotate-180">
          <Icon name="chevron-down" size={18} />
        </span>
      </summary>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </details>
  );
}
