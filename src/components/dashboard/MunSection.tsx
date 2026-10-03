import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/common/Icon";

export interface IMunSectionProps {
  title: string;
  icon?: IconName;
  /** Attribution line (REQUIRED on data surfaces). */
  source?: string;
  /** Anchor id (e.g. for sidebar jump links). */
  id?: string;
  /** Optional header-right slot (buttons, badges). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Theme-aware card wrapper used by every municipal panel section. */
export default function MunSection({
  title,
  icon,
  source,
  id,
  action,
  className,
  children,
}: IMunSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-4 rounded-xl border border-black/5 bg-cmd-surface p-4 shadow-sm sm:p-5 dark:border-white/5 ${className ?? ""}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-cmd-heading">
          {icon ? (
            <span className="text-teal">
              <Icon name={icon} size={18} />
            </span>
          ) : null}
          {title}
        </h2>
        {action}
      </header>
      <div className="mt-3">{children}</div>
      {source ? <p className="mt-3 text-right text-[11px] text-cmd-muted">{source}</p> : null}
    </section>
  );
}
