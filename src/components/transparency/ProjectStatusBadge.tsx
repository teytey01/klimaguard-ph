import { PROJECT_STATUS_LABELS } from "@/lib/transparency/localProjects";
import type { IProjectStatus } from "@/types";

export interface IProjectStatusBadgeProps {
  status: IProjectStatus;
}

// Status colours avoid Alert Red (emergency-only); "delayed" uses amber.
const STATUS_CLASSES: Record<IProjectStatus, string> = {
  ongoing: "bg-teal/15 text-teal",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  delayed: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
  planned: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

/** Small pill showing a project's Filipino status label. */
export default function ProjectStatusBadge({ status }: IProjectStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-ui text-[11px] font-semibold ${STATUS_CLASSES[status]}`}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}
