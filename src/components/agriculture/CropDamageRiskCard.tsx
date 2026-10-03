"use client";

import { Icon, useLanguage } from "@/components/common";
import type { ICropDamageRisk, ICropDamageRiskLevel } from "@/types";

export interface ICropDamageRiskCardProps {
  risk: ICropDamageRisk;
  className?: string;
}

// Alert Red is reserved for emergencies, so only "severe" (signal ≥3) uses it.
const LEVEL_STYLES: Record<ICropDamageRiskLevel, { badge: string; border: string }> = {
  low: { badge: "bg-teal/15 text-teal", border: "border-teal/30" },
  moderate: {
    badge: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
    border: "border-amber-500/40",
  },
  high: {
    badge: "bg-orange-500/20 text-orange-800 dark:text-orange-300",
    border: "border-orange-500/50",
  },
  severe: { badge: "bg-alert text-white", border: "border-alert" },
};

/**
 * Farmer-only M3 card: crop damage risk level, what is driving it, which
 * crops are exposed, one crop action, and the livestock protection advisory.
 */
export default function CropDamageRiskCard({ risk, className }: ICropDamageRiskCardProps) {
  const { language } = useLanguage();
  const pick = (text: { fil: string; en: string }) => text[language];
  const styles = LEVEL_STYLES[risk.level];
  const fil = language === "fil";

  return (
    <section
      aria-label={fil ? "Panganib sa pananim at hayop" : "Crop and livestock risk"}
      className={`rounded-xl border-2 bg-cmd-surface p-5 ${styles.border} ${className ?? ""}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-cmd-heading">
          <span className="text-teal">
            <Icon name="sprout" size={18} />
          </span>
          {fil ? "Panganib ng Pinsala sa Pananim" : "Crop Damage Risk"}
        </h2>
        <span className={`rounded-full px-3 py-1 font-ui text-xs font-bold uppercase ${styles.badge}`}>
          {pick(risk.label)}
        </span>
      </header>

      <ul className="mt-3 flex flex-wrap gap-2">
        {risk.drivers.map((driver) => (
          <li
            key={driver.en}
            className="rounded-full bg-cmd-tile px-2.5 py-1 font-ui text-[11px] text-cmd-heading"
          >
            {pick(driver)}
          </li>
        ))}
      </ul>

      {risk.crops.length > 0 ? (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {risk.crops.map((crop) => (
            <li key={`${crop.cropId}-${crop.impact.en}`} className="flex gap-2 rounded-lg bg-cmd-tile p-3">
              <span aria-hidden="true" className="text-lg leading-none">
                {crop.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-cmd-heading">{pick(crop.name)}</p>
                <p className="text-xs text-cmd-muted">{pick(crop.impact)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 rounded-lg bg-teal/10 p-3 text-sm font-medium text-cmd-heading">
        <span className="font-ui font-semibold text-teal">{fil ? "Gawin ngayon: " : "Do now: "}</span>
        {pick(risk.cropAction)}
      </p>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-cmd-heading">
          {fil ? "Proteksyon ng mga Hayop" : "Livestock Protection Advisory"}
        </h3>
        <ul className="mt-2 space-y-1.5">
          {risk.livestock.map((line) => (
            <li key={line.en} className="flex gap-2 text-sm text-cmd-heading">
              <span aria-hidden="true">🐃</span>
              <span>{pick(line)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-right text-xs text-cmd-muted">{risk.source}</p>
    </section>
  );
}
