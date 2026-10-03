"use client";

import { useEffect, useRef, useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import { dispatchTeam, PUROK_OPTIONS } from "@/lib/barangay";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IDispatchTanodDialogProps {
  open: boolean;
  onClose: () => void;
  /** Preselect a team (from the Tanod tab's per-team Dispatch button). */
  initialTeamId?: string;
  /** Called after a successful dispatch with the confirmation text. */
  onDispatched?: (message: string) => void;
}

const FIELD_CLASS =
  "mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 py-2 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15";

/**
 * Accessible modal to dispatch a Barangay Tanod team to a purok. Updates the
 * team (Tanod tab + Operations Grid card) and appends an audit entry.
 */
export default function DispatchTanodDialog({
  open,
  onClose,
  initialTeamId,
  onDispatched,
}: IDispatchTanodDialogProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  const [teamId, setTeamId] = useState(initialTeamId ?? state.teams[0]?.id ?? "");
  const [purok, setPurok] = useState(PUROK_OPTIONS[2]);
  const [assignment, setAssignment] = useState("");

  // Focus the first field on open; Esc closes.
  useEffect(() => {
    if (!open) {
      return;
    }
    firstFieldRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    const team = state.teams.find((x) => x.id === teamId);
    if (!team) {
      return;
    }
    const task = assignment.trim() || t("brgy.dispatch.defaultAssignment", { purok });
    update((s, now) => dispatchTeam(s, team.id, purok, task, now), {
      what: t("brgy.audit.dispatch", { team: team.name, purok, assignment: task }),
      category: "tanod",
    });
    onDispatched?.(t("brgy.dispatch.success", { team: team.name, purok }));
    setAssignment("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-title"
        className="w-full max-w-md rounded-2xl bg-cmd-surface p-5 shadow-xl"
      >
        <h2
          id="dispatch-title"
          className="flex items-center gap-2 text-base font-semibold text-cmd-heading"
        >
          <span className="text-teal">
            <Icon name="users" size={18} />
          </span>
          {t("brgy.dispatch.title")}
        </h2>
        <form onSubmit={confirm} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-cmd-heading">
            {t("brgy.dispatch.team")}
            <select
              ref={firstFieldRef}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className={FIELD_CLASS}
            >
              {state.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} · {t("brgy.tanod.members", { count: team.members })} ·{" "}
                  {t(`brgy.tanod.status.${team.status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-cmd-heading">
            {t("brgy.dispatch.purok")}
            <select
              value={purok}
              onChange={(e) => setPurok(e.target.value)}
              className={FIELD_CLASS}
            >
              {PUROK_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-cmd-heading">
            {t("brgy.dispatch.assignment")}
            <input
              type="text"
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
              maxLength={120}
              placeholder={t("brgy.dispatch.assignmentPlaceholder")}
              className={FIELD_CLASS}
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-cmd-muted hover:text-cmd-heading dark:border-white/15"
            >
              {t("brgy.dispatch.cancel")}
            </button>
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Icon name="check" size={16} />
              {t("brgy.dispatch.confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
