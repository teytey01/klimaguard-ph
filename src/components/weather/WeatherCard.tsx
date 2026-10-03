import { describeWeather } from "@/lib/utils";
import type { IWeatherData } from "@/types";

export interface IWeatherCardProps {
  data: IWeatherData;
}

function formatManilaTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("fil-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

export default function WeatherCard({ data }: IWeatherCardProps) {
  const { current, location, source, fetchedAt } = data;
  const condition = describeWeather(current.weatherCode);
  const attribution = source === "PAGASA" ? "Ayon sa PAGASA" : "Ayon sa Open-Meteo";
  const place = location.province
    ? `${location.name}, ${location.province}`
    : location.name;
  const updatedAt = formatManilaTime(fetchedAt);

  const heavyRain = current.rainChance > 80;
  const bringUmbrella = current.rainChance > 60;

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

      {heavyRain ? (
        <p className="mt-4 rounded-lg bg-alert px-3 py-2 text-sm font-semibold text-white">
          Malakas na ulan expected! ⚠️
        </p>
      ) : bringUmbrella ? (
        <p className="mt-4 rounded-lg bg-[#D69E2E] px-3 py-2 text-sm font-semibold text-white">
          Magdala ng payong! ☂️
        </p>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">💧 Halumigmig</dt>
          <dd className="mt-1 text-base font-semibold text-text">
            {current.humidity}%
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">🌧️ Tsansa ng ulan</dt>
          <dd className="mt-1 text-base font-semibold text-teal">
            {current.rainChance}%
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">💨 Hangin</dt>
          <dd className="mt-1 text-base font-semibold text-text">
            {current.windSpeedKmh} km/h
          </dd>
        </div>
        <div className="rounded-lg bg-surface-2 p-3">
          <dt className="text-xs text-text-muted">🌡️ Pakiramdam</dt>
          <dd className="mt-1 text-base font-semibold text-text">
            {current.feelsLikeC}°
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-1 text-xs text-text-muted">
        {updatedAt ? <span>Kuha noong {updatedAt}</span> : <span />}
        <span>{attribution}</span>
      </div>
    </section>
  );
}
