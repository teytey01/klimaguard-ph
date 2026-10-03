"use client";

import { useLanguage } from "@/components/common";
import { describeWeather, formatFilipinoShortDay } from "@/lib/utils";
import type { IForecastDay, IPagasaTenDayMeta } from "@/types";

export interface IForecastStripProps {
  days: IForecastDay[];
  /** When set, the PAGASA TenDay issuance details are shown as attribution. */
  pagasaTenDay?: IPagasaTenDayMeta;
}

const PH_SHORT_EN = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric" });

/**
 * Daily forecast strip (up to 10 days). PAGASA TenDay days show rainfall in
 * mm/day plus PAGASA's own descriptor; Open-Meteo days show rain probability.
 */
export default function ForecastStrip({ days, pagasaTenDay }: IForecastStripProps) {
  const { language } = useLanguage();
  const fil = language === "fil";
  const hasPagasa = days.some((d) => d.source === "PAGASA");
  const hasOpenMeteo = days.some((d) => d.source !== "PAGASA");

  const title = fil ? `${days.length} araw na forecast` : `${days.length}-day forecast`;
  const shortDay = (iso: string) => (fil ? formatFilipinoShortDay(iso) : PH_SHORT_EN.format(new Date(`${iso}T00:00:00+08:00`)));

  return (
    <section className="w-full">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {hasPagasa ? (
          <span className="rounded-full bg-teal/15 px-2 py-0.5 font-ui text-[10px] font-bold uppercase text-teal">
            PAGASA TenDay
          </span>
        ) : null}
      </div>

      <ul className="flex snap-x gap-3 overflow-x-auto pb-2">
        {days.map((day) => {
          const condition = describeWeather(day.weatherCode);
          const isPagasa = day.source === "PAGASA";
          return (
            <li
              key={day.date}
              className="flex w-24 shrink-0 snap-start flex-col items-center gap-1 rounded-xl bg-card p-3 text-center shadow-sm"
            >
              <span className="text-xs font-medium text-text-muted">{shortDay(day.date)}</span>
              <span className="text-2xl" role="img" aria-label={condition.label}>
                {condition.emoji}
              </span>
              <span className="text-sm font-semibold text-text">
                {day.highC}° / {day.lowC}°
              </span>
              {isPagasa && typeof day.rainfallMm === "number" ? (
                <span className="text-xs font-medium text-teal" title={day.rainfallDesc}>
                  {day.rainfallMm} mm
                </span>
              ) : null}
              <span className="text-[11px] text-text-muted" title={fil ? "Tsansa ng ulan" : "Chance of rain"}>
                {day.rainChance}%
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-1 text-[11px] leading-snug text-text-muted">
        {hasPagasa && pagasaTenDay
          ? fil
            ? `Ayon sa PAGASA 10-Day Climate Forecast (${pagasaTenDay.location}), inilabas ${pagasaTenDay.issued}, valid hanggang ${pagasaTenDay.validUntil} · ${pagasaTenDay.model}.`
            : `Source: PAGASA 10-Day Climate Forecast (${pagasaTenDay.location}), issued ${pagasaTenDay.issued}, valid until ${pagasaTenDay.validUntil} · ${pagasaTenDay.model}.`
          : null}
        {hasPagasa && hasOpenMeteo ? (fil ? " Ibang araw: Open-Meteo." : " Other days: Open-Meteo.") : null}
        {!hasPagasa ? (fil ? "Ayon sa Open-Meteo." : "Source: Open-Meteo.") : null}
        {hasPagasa ? (fil ? " mm = dami ng ulan kada araw; % = tsansa ng ulan." : " mm = rainfall per day; % = chance of rain.") : null}
      </p>
    </section>
  );
}
