import ProjectProgressBar from "@/components/transparency/ProjectProgressBar";
import ProjectStatusBadge from "@/components/transparency/ProjectStatusBadge";
import {
  disbursedPct,
  PROJECT_CATEGORY_LABELS,
} from "@/lib/transparency/localProjects";
import type { ILocalProject } from "@/types";

export interface IProjectCardProps {
  project: ILocalProject;
  onSelect: (project: ILocalProject) => void;
}

const peso = new Intl.NumberFormat("fil-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** Tappable summary card for one local project. */
export default function ProjectCard({ project, onSelect }: IProjectCardProps) {
  const fundPct = disbursedPct(project);

  return (
    <button
      type="button"
      onClick={() => onSelect(project)}
      className="flex w-full flex-col gap-3 rounded-xl bg-cmd-tile p-4 text-left transition-colors hover:ring-2 hover:ring-teal/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-ui text-[11px] font-medium uppercase tracking-wide text-cmd-muted">
            Brgy. {project.barangay} · {PROJECT_CATEGORY_LABELS[project.category]}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-cmd-heading">{project.name}</h3>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <ProjectProgressBar
        label="Pisikal na progreso"
        pct={project.progressPct}
        trackClassName="bg-cmd-surface"
      />

      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-cmd-muted">
          Badyet: <span className="font-semibold text-cmd-heading">{peso.format(project.approvedBudget)}</span>
        </span>
        <span className="text-cmd-muted">{fundPct}% nailabas</span>
      </div>
    </button>
  );
}
