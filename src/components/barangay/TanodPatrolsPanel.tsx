"use client";

import { Icon, useLanguage } from "@/components/common";
import { useNow } from "@/hooks";
import { activeResponders, agoKey, setTeamStatus } from "@/lib/barangay";
import type { IBarangayTeamStatus } from "@/types";
import BarangayCard from "./BarangayCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface ITanodPatrolsPanelProps {
  barangay: string;
  /** Open the dispatch dialog preselected to a team. */
  onDispatch: (teamId: string) => void;
}

const STATUSES: IBarangayTeamStatus[] = [
  "patrol",
  "dispatched",
  "security",
  "logistics",
  "standby",
];

/** M7: Tanod / BDRRMC team list, status changes, and recent dispatches. */
export default function TanodPatrolsPanel({ barangay, onDispatch }: ITanodPatrolsPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const now = useNow(30_000);
  const recent = state.audit.filter((a) => a.category === "tanod").slice(0, 6);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-cmd-heading">{t("brgy.tanod.title")}</h2>
        <p className="text-sm text-cmd-muted">{t("brgy.tanod.subtitle")}</p>
        <p className="mt-1 text-sm font-medium text-teal">
          {t("brgy.ops.teamsActive", { count: activeResponders(state) })}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {state.teams.map((team) => {
          const ago = agoKey(team.updatedAt, now);
          return (
            <li key={team.id} className="rounded-xl bg-cmd-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-cmd-heading">{team.name}</p>
                  <p className="text-xs text-cmd-muted">
                    {t("brgy.tanod.members", { count: team.members })} · {team.purok}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    team.status === "standby"
                      ? "bg-cmd-tile text-cmd-muted"
                      : team.status === "dispatched"
                        ? "bg-cmd-accent text-cmd-accent-text"
                        : "bg-teal/15 text-teal"
                  }`}
                >
                  {t(`brgy.tanod.status.${team.status}`)}
                </span>
              </div>
              <p className="mt-2 text-sm text-cmd-heading">{team.assignment}</p>
              <p className="text-[11px] text-cmd-muted">
                {t("brgy.tanod.updated", { ago: t(ago.key, { n: ago.n }) })}
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="min-w-[140px] flex-1 text-xs font-medium text-cmd-muted">
                  {t("brgy.tanod.statusLabel")}
                  <select
                    value={team.status}
                    onChange={(e) => {
                      const status = e.target.value as IBarangayTeamStatus;
                      update((s, at) => setTeamStatus(s, team.id, status, at), {
                        what: t("brgy.audit.teamStatus", {
                          team: team.name,
                          status: t(`brgy.tanod.status.${status}`),
                        }),
                        category: "tanod",
                      });
                    }}
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`brgy.tanod.status.${s}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => onDispatch(team.id)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
                >
                  <Icon name="arrow-right" size={16} />
                  {t("brgy.tanod.dispatch")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <BarangayCard
        title={t("brgy.tanod.recent")}
        icon="scroll"
        source={t("brgy.source.ops", { barangay })}
      >
        {recent.length === 0 ? (
          <p className="text-sm text-cmd-muted">{t("brgy.tanod.noRecent")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recent.map((entry) => {
              const ago = agoKey(entry.at, now);
              return (
                <li key={entry.id} className="rounded-lg bg-cmd-tile px-3 py-2">
                  <p className="text-cmd-heading">{entry.what}</p>
                  <p className="text-[11px] text-cmd-muted">
                    {entry.who} · {t(ago.key, { n: ago.n })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </BarangayCard>
    </div>
  );
}
