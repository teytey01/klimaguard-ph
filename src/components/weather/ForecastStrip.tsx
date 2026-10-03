import { describeWeather, formatFilipinoShortDay } from "@/lib/utils";
import type { IForecastDay } from "@/types";

export interface IForecastStripProps {
  days: IForecastDay[];
}

export default function ForecastStrip({ days }: IForecastStripProps) {
  return (
    <section className="w-full">
      <h3 className="mb-2 text-sm font-semibold text-text">7 araw na forecast</h3>
      <ul className="flex gap-3 overflow-x-auto pb-2">
        {days.map((day) => {
          const condition = describeWeather(day.weatherCode);
          return (
            <li
              key={day.date}
              className="flex w-24 shrink-0 flex-col items-center gap-1 rounded-xl bg-card p-3 text-center shadow-sm"
            >
              <span className="text-xs font-medium text-text-muted">
                {formatFilipinoShortDay(day.date)}
              </span>
              <span className="text-2xl" aria-label={condition.label}>
                {condition.emoji}
              </span>
              <span className="text-sm font-semibold text-text">
                {day.highC}° / {day.lowC}°
              </span>
              <span className="text-xs font-medium text-teal">
                {day.rainChance}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
