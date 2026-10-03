import type { IAgencySync } from "@/types";
import Icon from "@/components/common/Icon";

export interface IAgencySyncPanelProps {
  agencies: IAgencySync[];
}

const STATUS_LABEL: Record<IAgencySync["status"], string> = {
  synced: "Naka-sync",
  pending: "Naghihintay",
  offline: "Offline",
};

const STATUS_DOT: Record<IAgencySync["status"], string> = {
  synced: "bg-teal",
  pending: "bg-cmd-accent",
  offline: "bg-alert",
};

const STATUS_TEXT: Record<IAgencySync["status"], string> = {
  synced: "text-teal",
  pending: "text-cmd-accent",
  offline: "text-alert",
};

/**
 * Inter-agency / PAGASA-OCD sync status (M9 inter-agency hub). Shows the
 * upward-reporting chain health with Filipino status labels.
 */
export default function AgencySyncPanel({ agencies }: IAgencySyncPanelProps) {
  return (
    <section className="rounded-xl bg-cmd-surface p-5 shadow-sm">
      <header className="flex items-center gap-2">
        <span className="text-teal">
          <Icon name="link" size={18} />
        </span>
        <h2 className="text-sm font-semibold text-cmd-heading">
          Inter-Agency Uplink
        </h2>
      </header>

      <ul className="mt-4 space-y-3">
        {agencies.map((agency) => (
          <li
            key={agency.agency}
            className="rounded-lg bg-cmd-tile p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-cmd-heading">
                {agency.agency}
              </p>
              <span
                className={`flex shrink-0 items-center gap-1.5 text-xs font-semibold ${STATUS_TEXT[agency.status]}`}
              >
                <span
                  className={`inline-block size-2 rounded-full ${STATUS_DOT[agency.status]}`}
                  aria-hidden="true"
                />
                {STATUS_LABEL[agency.status]}
              </span>
            </div>
            <p className="mt-1 text-xs text-cmd-muted">{agency.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
