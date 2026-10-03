import { Icon } from "@/components/common";
import ProjectProgressBar from "@/components/transparency/ProjectProgressBar";
import ProjectStatusBadge from "@/components/transparency/ProjectStatusBadge";
import {
  disbursedPct,
  PROJECT_CATEGORY_LABELS,
} from "@/lib/transparency/localProjects";
import { formatFilipinoLongDate } from "@/lib/utils/dateFilipino";
import type { ILocalProject } from "@/types";

export interface IProjectDetailProps {
  project: ILocalProject;
  source: string;
  onBack: () => void;
}

const peso = new Intl.NumberFormat("fil-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** Full per-project view: funds, progress, implementer and milestones. */
export default function ProjectDetail({ project, source, onBack }: IProjectDetailProps) {
  const fundPct = disbursedPct(project);
  const remaining = Math.max(0, project.approvedBudget - project.disbursed);

  const facts: Array<{ label: string; value: string }> = [
    { label: "Lokasyon", value: `Brgy. ${project.barangay}, ${project.municipality}, ${project.province}` },
    { label: "Uri ng proyekto", value: PROJECT_CATEGORY_LABELS[project.category] },
    { label: "Nagpapatupad", value: project.implementingOffice },
    { label: "Kontratista", value: project.contractor },
    { label: "Pinagmulan ng pondo", value: project.fundingSource },
    { label: "Makikinabang", value: project.beneficiaries },
    {
      label: "Panahon ng proyekto",
      value: `${formatFilipinoLongDate(project.startDate)} – ${formatFilipinoLongDate(project.targetEndDate)}`,
    },
  ];

  return (
    <article className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-medium text-teal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        <Icon name="arrow-left" size={16} />
        Bumalik sa listahan
      </button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-ui text-xs font-medium uppercase tracking-wide text-cmd-muted">
            {project.id}
          </p>
          <h3 className="mt-1 text-lg font-bold text-cmd-heading">{project.name}</h3>
          <p className="mt-2 text-sm text-cmd-muted">{project.description}</p>
        </div>
        <ProjectStatusBadge status={project.status} />
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-cmd-tile p-3">
          <dt className="text-xs text-cmd-muted">Aprubadong badyet</dt>
          <dd className="mt-1 text-base font-semibold text-cmd-heading">
            {peso.format(project.approvedBudget)}
          </dd>
        </div>
        <div className="rounded-lg bg-cmd-tile p-3">
          <dt className="text-xs text-cmd-muted">Nailabas na</dt>
          <dd className="mt-1 text-base font-semibold text-teal">
            {peso.format(project.disbursed)} ({fundPct}%)
          </dd>
        </div>
        <div className="rounded-lg bg-cmd-tile p-3">
          <dt className="text-xs text-cmd-muted">Natitira</dt>
          <dd className="mt-1 text-base font-semibold text-cmd-heading">{peso.format(remaining)}</dd>
        </div>
      </dl>

      <div className="space-y-3">
        <ProjectProgressBar label="Pisikal na progreso" pct={project.progressPct} />
        <ProjectProgressBar label="Pondong nailabas" pct={fundPct} />
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-cmd-muted">{fact.label}</dt>
            <dd className="text-sm text-cmd-heading">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h4 className="text-sm font-semibold text-cmd-heading">Mga update at milestone</h4>
        <ol className="mt-3 space-y-3 border-l-2 border-cmd-tile pl-4">
          {project.milestones.map((milestone) => (
            <li key={`${milestone.date}-${milestone.label}`} className="relative">
              <span
                aria-hidden="true"
                className={`absolute -left-[23px] top-1 size-3 rounded-full ${
                  milestone.done ? "bg-teal" : "border-2 border-cmd-muted bg-cmd-surface"
                }`}
              />
              <p className="text-sm text-cmd-heading">{milestone.label}</p>
              <p className="text-xs text-cmd-muted">
                {formatFilipinoLongDate(milestone.date)} · {milestone.done ? "Natapos" : "Paparating"}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-right text-xs text-cmd-muted">{source}</p>
    </article>
  );
}
