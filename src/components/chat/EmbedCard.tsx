"use client";

import { useLanguage } from "@/components/common";
import { progressWidthClass } from "@/lib/utils/progressWidth";
import type { IMessageEmbed } from "@/types";

export interface IEmbedCardProps {
  embed: IMessageEmbed;
}

const TEXT = {
  fil: { source: "Pinagmulan", funds: "Pondo", spent: "Nagastos", of: "sa", used: "nagamit" },
  en: { source: "Source", funds: "Funds", spent: "Spent", of: "of", used: "used" },
} as const;

/** Inline card attached to an agent message. Source attribution always shown. */
export default function EmbedCard({ embed }: IEmbedCardProps) {
  const { language } = useLanguage();
  const t = TEXT[language];

  if (embed.kind === "weather") {
    const { location, summary, temperatureC, source } = embed.data;
    return (
      <div className="mt-2 rounded-xl bg-card p-3 text-text shadow-sm">
        <p className="text-sm font-semibold">{location}</p>
        <p className="text-2xl font-bold">{temperatureC}°C</p>
        <p className="text-sm">{summary}</p>
        <p className="mt-1 text-xs text-text-muted">
          {t.source}: {source}
        </p>
      </div>
    );
  }

  if (embed.kind === "alert") {
    const { title, message, severity, source } = embed.data;
    const isEmergency = severity === "emergency";
    return (
      <div className={`mt-2 rounded-xl p-3 shadow-sm ${isEmergency ? "bg-alert text-white" : "bg-card text-text"}`}>
        <p className="text-sm font-semibold">{title}</p>
        <p className="break-words text-sm">{message}</p>
        <p className={`mt-1 text-xs ${isEmergency ? "text-white/80" : "text-text-muted"}`}>
          {t.source}: {source}
        </p>
      </div>
    );
  }

  if (embed.kind === "crop") {
    const { crop, advice, source } = embed.data;
    return (
      <div className="mt-2 rounded-xl bg-card p-3 text-text shadow-sm">
        <p className="text-sm font-semibold">🌾 {crop}</p>
        <p className="text-sm">{advice}</p>
        <p className="mt-1 text-xs text-text-muted">
          {t.source}: {source}
        </p>
      </div>
    );
  }

  const { province, totalAllocated, totalSpent, utilizationPct, source } = embed.data;
  const peso = new Intl.NumberFormat("fil-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
  const pct = Math.max(0, Math.min(100, utilizationPct));
  return (
    <div className="mt-2 rounded-xl bg-card p-3 text-text shadow-sm">
      <p className="text-sm font-semibold">
        DRRM {t.funds} — {province}
      </p>
      <p className="text-sm">
        {t.spent} {peso.format(totalSpent)} {t.of} {peso.format(totalAllocated)}
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full bg-teal ${progressWidthClass(pct)}`}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% ${t.used}`}
        />
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {pct}% {t.used}
      </p>
      <p className="mt-1 text-xs text-text-muted">
        {t.source}: {source}
      </p>
    </div>
  );
}
