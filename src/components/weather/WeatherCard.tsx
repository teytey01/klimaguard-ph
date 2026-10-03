import { describeWeather } from "@/lib/utils";
import type { IWeatherData } from "@/types";

export interface IWeatherCardProps {
  data: IWeatherData;
}

export default function WeatherCard({ data }: IWeatherCardProps) {
  const { current, location, source } = data;
  const condition = describeWeather(current.weatherCode);
  const attribution = source === "PAGASA" ? "Ayon sa PAGASA" : "Ayon sa Open-Meteo";
  const place = location.province
    ? `${location.name}, ${location.province}`
    : location.name;

  return (
    <section className="w-full rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-text">{place}</h2>
          <p className="mt-1 text-sm text-text-muted">
            {condition.label} {condition.emoji}
          </p>
        </div>
        <p className="shrink-0 text-5xl font-bold text-text sm:text-6xl">
          {current.temperatureC}°
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">Halumigmig</dt>
          <dd className="mt-1 text-base font-semibold text-text">
            {current.humidity}%
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">Tsansa ng ulan</dt>
          <dd className="mt-1 text-base font-semibold text-teal">
            {current.rainChance}%
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">Hangin</dt>
          <dd className="mt-1 text-base font-semibold text-text">
            {current.windSpeedKmh} km/h
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-right text-xs text-text-muted">{attribution}</p>
    </section>
  );
}
