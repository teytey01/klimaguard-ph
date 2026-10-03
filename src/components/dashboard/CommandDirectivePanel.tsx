import type { ICommandDirective } from "@/types";
import Icon from "@/components/common/Icon";

export interface ICommandDirectivePanelProps {
  directives: ICommandDirective[];
}

const STATUS_LABEL: Record<ICommandDirective["status"], string> = {
  enforced: "Ipinatutupad",
  pending: "Nakabinbin",
  "under-review": "Sinusuri",
};

const STATUS_TONE: Record<ICommandDirective["status"], string> = {
  enforced: "bg-teal/15 text-teal",
  pending: "bg-cmd-accent/15 text-cmd-accent",
  "under-review": "bg-cmd-tile text-cmd-heading",
};

/**
 * Official command directives (M11 transparency / governance). Lists issued
 * statutory interventions with their authority, legal basis, and enforcement
 * status. Figures and references only — no political commentary.
 */
export default function CommandDirectivePanel({
  directives,
}: ICommandDirectivePanelProps) {
  return (
    <section className="rounded-xl bg-cmd-surface p-5 shadow-sm">
      <header className="flex items-center gap-2">
        <span className="text-teal">
          <Icon name="scroll" size={18} />
        </span>
        <h2 className="text-sm font-semibold text-cmd-heading">
          Command Directive
        </h2>
      </header>

      <ul className="mt-4 space-y-3">
        {directives.map((directive) => (
          <li
            key={directive.title}
            className="rounded-lg border-l-2 border-cmd-accent bg-cmd-tile p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-cmd-heading">
                {directive.title}
              </p>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONE[directive.status]}`}
              >
                {STATUS_LABEL[directive.status]}
              </span>
            </div>
            <p className="mt-1 text-xs text-cmd-muted">
              {directive.authority} · {directive.reference}
            </p>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        <Icon name="broadcast" size={16} />
        I-broadcast ang Municipal SitRep Update
      </button>
    </section>
  );
}
