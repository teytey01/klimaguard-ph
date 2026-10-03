"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/components/common";
import { ForecastStrip, WeatherCard } from "@/components/weather";
import { useWeather } from "@/hooks";
import {
  compassLabel,
  fetchBarangayHourly,
  type IBarangayHourlyResult,
} from "@/lib/api/barangayWeather";
import { manilaTime } from "@/lib/barangay";
import type { ILocation } from "@/types";
import BarangayCard from "./BarangayCard";

export interface IBarangayWeatherPanelProps {
  municipality: string;
  province: string;
  lat: number;
  lon: number;
}

/**
 * M2 full detail for officials: current + 7-day (shared weather route) and a
 * 12-hour strip with heat index, rainfall mm, wind speed/direction, and UV
 * (direct Open-Meteo, Asia/Manila). Skeletons while loading; Filipino error
 * + retry; Open-Meteo attribution with the fetch time.
 */
export default function BarangayWeatherPanel({
  municipality,
  province,
  lat,
  lon,
}: IBarangayWeatherPanelProps) {
  const { t } = useLanguage();
  const location = useMemo<ILocation>(
    () => ({ name: municipality, province, lat, lon }),
    [municipality, province, lat, lon],
  );
  const { data, isLoading, error, refetch } = useWeather(location);

  const [hourly, setHourly] = useState<IBarangayHourlyResult | null>(null);
  const [hourlyError, setHourlyError] = useState(false);
  const [hourlyLoading, setHourlyLoading] = useState(true);

  const loadHourly = useCallback(
    async (force: boolean) => {
      setHourlyLoading(true);
      setHourlyError(false);
      try {
        setHourly(await fetchBarangayHourly(lat, lon, 12, force));
      } catch {
        setHourlyError(true);
      } finally {
        setHourlyLoading(false);
      }
    },
    [lat, lon],
  );

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void loadHourly(false);
      }
    });
    return () => {
      active = false;
    };
  }, [loadHourly]);

  const maxHeat = hourly ? Math.max(...hourly.hours.map((h) => h.feelsLikeC)) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-cmd-heading">
        {t("brgy.weather.title", { municipality })}
      </h2>

      <BarangayCard
        title={t("brgy.weather.hourly")}
        icon="cloud"
        tone={maxHeat >= 42 ? "alert" : "normal"}
        source={
          hourly
            ? t("brgy.weather.source", { time: `${manilaTime(hourly.lastUpdated)} PST` })
            : t("brgy.weather.source", { time: "—" })
        }
      >
        {hourlyLoading && !hourly ? (
          <div className="flex gap-2 overflow-hidden" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 w-24 shrink-0 animate-pulse rounded-lg bg-cmd-tile" />
            ))}
          </div>
        ) : hourlyError || !hourly ? (
          <div className="rounded-lg bg-cmd-tile p-4 text-center">
            <p className="text-sm text-cmd-heading">{t("brgy.weather.error")}</p>
            <button
              type="button"
              onClick={() => void loadHourly(true)}
              className="mt-3 min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white"
            >
              {t("brgy.retry")}
            </button>
          </div>
        ) : (
          <>
            {hourly.stale ? (
              <p className="mb-2 text-xs text-cmd-muted">{t("brgy.weather.stale")}</p>
            ) : null}
            {maxHeat >= 42 ? (
              <p role="alert" className="mb-2 rounded-lg bg-alert/10 p-2 text-sm font-semibold text-alert">
                {t("brgy.weather.heatWarn")}
              </p>
            ) : null}
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {hourly.hours.map((h) => (
                <li key={h.time} className="w-28 shrink-0 rounded-lg bg-cmd-tile p-2 text-xs">
                  <p className="font-semibold text-cmd-heading">{h.time.slice(11, 16)}</p>
                  <dl className="mt-1 space-y-0.5">
                    <div className="flex justify-between gap-1">
                      <dt className="text-cmd-muted">{t("brgy.weather.temp")}</dt>
                      <dd className="text-cmd-heading">{Math.round(h.temperatureC)}°C</dd>
                    </div>
                    <div className="flex justify-between gap-1">
                      <dt className="text-cmd-muted">{t("brgy.weather.feels")}</dt>
                      <dd className={h.feelsLikeC >= 42 ? "font-bold text-alert" : "text-cmd-heading"}>
                        {Math.round(h.feelsLikeC)}°C
                      </dd>
                    </div>
                    <div className="flex justify-between gap-1">
                      <dt className="text-cmd-muted">{t("brgy.weather.rain")}</dt>
                      <dd className="text-cmd-heading">
                        {h.precipitationMm.toFixed(1)} mm · {h.rainChance}%
                      </dd>
                    </div>
                    <div className="flex justify-between gap-1">
                      <dt className="text-cmd-muted">{t("brgy.weather.wind")}</dt>
                      <dd className="text-cmd-heading">
                        {Math.round(h.windKmh)} {compassLabel(h.windDirDeg)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-1">
                      <dt className="text-cmd-muted">{t("brgy.weather.uv")}</dt>
                      <dd className="text-cmd-heading">{h.uvIndex.toFixed(1)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </BarangayCard>

      <section aria-label={t("brgy.weather.sevenDay")} className="space-y-3">
        <h3 className="text-sm font-semibold text-cmd-heading">{t("brgy.weather.sevenDay")}</h3>
        {isLoading && !data ? (
          <div className="space-y-3" aria-hidden="true">
            <div className="h-44 animate-pulse rounded-2xl bg-cmd-tile" />
            <div className="h-32 animate-pulse rounded-xl bg-cmd-tile" />
          </div>
        ) : error && !data ? (
          <div className="rounded-xl bg-cmd-surface p-4 text-center">
            <p className="text-sm text-cmd-heading">{t("brgy.error.generic")}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white"
            >
              {t("brgy.retry")}
            </button>
          </div>
        ) : data ? (
          <>
            <WeatherCard data={data} />
            <ForecastStrip days={data.forecast} pagasaTenDay={data.pagasaTenDay} />
          </>
        ) : null}
      </section>
    </div>
  );
}
