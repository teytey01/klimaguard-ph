import type { ICropAdvisory, ICropSuitability } from "@/types";

export interface ICropAdvisoryCardProps {
  advisory: ICropAdvisory;
}

// Caution never uses bg-alert (#E53E3E) — that is EMERGENCY ONLY. Good = teal,
// caution = amber (#B7791F), bad = muted text.
const SUITABILITY_BADGE: Record<ICropSuitability, string> = {
  good: "border-teal text-teal",
  caution: "border-[#B7791F] text-[#B7791F]",
  bad: "border-text-muted text-text-muted",
};

/**
 * Presentational advisory card for one crop: name + emoji, climate-suitability
 * badge (Mainam / Mag-ingat / Huwag muna), a concrete action, planting + spray
 * indicators, pest warnings, an optional ENSO warning, and required source
 * attribution. Mobile-first (375px). No interactivity → no "use client".
 */
export default function CropAdvisoryCard({ advisory }: ICropAdvisoryCardProps) {
  const {
    crop,
    emoji,
    suitability,
    suitabilityLabel,
    action,
    planting,
    spray,
    pestWarnings,
    ensoWarning,
    source,
  } = advisory;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 text-text shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <span aria-hidden="true">{emoji}</span>
          {crop}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${SUITABILITY_BADGE[suitability]}`}
        >
          {suitabilityLabel}
        </span>
      </div>

      <p className="text-sm text-text">{action}</p>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs font-semibold text-text-muted">Pagtatanim</dt>
          <dd className="text-text">{planting.message}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs font-semibold text-text-muted">
            Pag-spray (hangin + ulan)
          </dt>
          <dd className="text-text">{spray.message}</dd>
        </div>
      </dl>

      {pestWarnings.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {pestWarnings.map((warning) => (
            <li
              key={warning}
              className="rounded-lg border border-[#B7791F] px-3 py-2 text-sm text-[#B7791F]"
            >
              {warning}
            </li>
          ))}
        </ul>
      ) : null}

      {ensoWarning ? (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-text">
          {ensoWarning}
        </p>
      ) : null}

      <p className="mt-1 text-xs text-text-muted">Pinagmulan: {source}</p>
    </div>
  );
}
