"use client";

import { formatFilipinoShortDay } from "@/lib/utils/dateFilipino";
import { Icon, useLanguage } from "@/components/common";
import { DEMO_ENSO_PHASE } from "@/lib/agriculture/cropData";
import { compass } from "@/lib/dashboard/municipalFormat";
import { MUN_WEATHER_SNAPSHOT_SOURCE, MUN_WEATHER_SOURCE } from "@/lib/dashboard/municipalWeather";
import { MUN_BTN_PRIMARY, MUN_TABLE_WRAP, MUN_TD, MUN_TH } from "@/lib/dashboard/munUi";
import { useMunicipalWeather } from "@/lib/dashboard/useMunicipalWeather";
import { describeWeather } from "@/lib/utils/weatherCodes";
import MunSection from "./MunSection";
import MunBar from "./MunBar";

export type IMunWeatherPanelProps = Record<string, never>;

/**
 * M2 Weather (Municipal: full) — current conditions, 10-day strip, 24-hour
 * hourly table (temp, rain %, mm, wind + direction), daily rainfall mm, soil
 * moisture, and the El Niño / La Niña status. Live Open-Meteo (Asia/Manila).
 */
export default function MunWeatherPanel() {
  const { t } = useLanguage();
  const { data, isLoading, error, retry } = useMunicipalWeather();

  if (isLoading && !data) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="h-32 animate-pulse rounded-xl bg-cmd-tile" />
        <div className="h-40 animate-pulse rounded-xl bg-cmd-tile" />
        <div className="h-64 animate-pulse rounded-xl bg-cmd-tile" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <MunSection title={t("mun.sec.weatherNow")} icon="cloud" source={MUN_WEATHER_SOURCE}>
        <p className="text-sm text-cmd-heading">{error ?? t("mun.err.weather")}</p>
        <button type="button" onClick={retry} className={`${MUN_BTN_PRIMARY} mt-3`}>
          {t("mun.action.retry")}
        </button>
      </MunSection>
    );
  }

  const cur = data.current;
  const desc = describeWeather(cur.weatherCode);
  // Credit PAGASA when Open-Meteo was unreachable and we fell back to the
  // seeded TenDay snapshot; otherwise the live Open-Meteo attribution.
  const weatherSource =
    data.provider === "pagasa-snapshot" ? MUN_WEATHER_SNAPSHOT_SOURCE : MUN_WEATHER_SOURCE;
  const maxRain = Math.max(1, ...data.daily.map((d) => d.rainMm));
  const soilPct = data.soilMoisture === null ? null : Math.round(Math.min(1, data.soilMoisture / 0.5) * 100);
  const soilVol = data.soilMoisture === null ? null : Math.round(data.soilMoisture * 100);

  return (
    <div className="space-y-5">
      <MunSection title={t("mun.sec.weatherNow")} icon="cloud" source={weatherSource}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-cmd-tile p-3">
            <p className="text-3xl font-bold text-cmd-heading">{Math.round(cur.temperatureC)}°C</p>
            <p className="text-xs text-cmd-muted">
              {desc.label} {desc.emoji}
            </p>
          </div>
          <div className="rounded-lg bg-cmd-tile p-3">
            <p className="text-xs text-cmd-muted">{t("mun.col.wind")}</p>
            <p className="text-lg font-semibold text-cmd-heading">
              {Math.round(cur.windKmh)} km/h {compass(cur.windDirDeg)}
            </p>
          </div>
          <div className="rounded-lg bg-cmd-tile p-3">
            <p className="text-xs text-cmd-muted">{t("mun.col.mm")}</p>
            <p className="text-lg font-semibold text-cmd-heading">{cur.precipitationMm.toFixed(1)} mm</p>
          </div>
          <div className="rounded-lg bg-cmd-tile p-3">
            <p className="text-xs text-cmd-muted">{t("mun.sec.enso")}</p>
            <p className="text-lg font-semibold text-teal">{t(`mun.enso.${DEMO_ENSO_PHASE}` as const)}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-cmd-muted">{t("mun.misc.ensoNote")}</p>
      </MunSection>

      <MunSection title={t("mun.sec.tenDay")} icon="calendar" source={weatherSource}>
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {data.daily.map((d) => {
            const dd = describeWeather(d.weatherCode);
            return (
              <li key={d.date} className="w-24 shrink-0 rounded-lg bg-cmd-tile p-2 text-center">
                <p className="text-[11px] font-semibold text-cmd-muted">{formatFilipinoShortDay(d.date)}</p>
                <p className="text-xl" aria-label={dd.label}>
                  {dd.emoji}
                </p>
                <p className="text-sm font-semibold text-cmd-heading">
                  {Math.round(d.highC)}° / {Math.round(d.lowC)}°
                </p>
                <p className="text-[11px] text-teal">{d.rainChance}%</p>
                <p className="text-[11px] text-cmd-muted">
                  {Math.round(d.windMaxKmh)} km/h {compass(d.windDirDeg)}
                </p>
              </li>
            );
          })}
        </ul>
      </MunSection>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MunSection title={t("mun.sec.rainfall")} icon="water" source={weatherSource}>
          <ul className="space-y-2">
            {data.daily.map((d) => (
              <li key={d.date}>
                <div className="flex justify-between text-xs text-cmd-heading">
                  <span>{formatFilipinoShortDay(d.date)}</span>
                  <span className="font-semibold">{d.rainMm.toFixed(1)} mm</span>
                </div>
                <MunBar pct={(d.rainMm / maxRain) * 100} label={`${d.date} ${d.rainMm} mm`} tone={d.rainMm >= 50 ? "alert" : "teal"} />
              </li>
            ))}
          </ul>
        </MunSection>

        <MunSection title={t("mun.sec.soil")} icon="sprout" source={weatherSource}>
          {soilPct === null || soilVol === null ? (
            <p className="text-sm text-cmd-muted">—</p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-3xl font-bold text-cmd-heading">
                <span className="text-teal">
                  <Icon name="water" size={28} />
                </span>
                {soilVol}% <span className="text-sm font-medium text-cmd-muted">m³/m³</span>
              </p>
              <div className="mt-3">
                <MunBar pct={soilPct} label={t("mun.sec.soil")} tone={soilPct >= 80 ? "alert" : "teal"} />
              </div>
              <p className="mt-2 text-sm text-cmd-heading">
                {soilPct >= 80 ? t("mun.misc.soilWet") : t("mun.misc.soilOk")}
              </p>
            </>
          )}
        </MunSection>
      </div>

      <MunSection title={t("mun.sec.hourly")} icon="cloud" source={weatherSource}>
        <div className={MUN_TABLE_WRAP}>
          <table className="w-full min-w-[480px]">
            <thead className="bg-cmd-tile">
              <tr>
                <th className={MUN_TH}>{t("mun.col.time")}</th>
                <th className={MUN_TH}>{t("mun.col.temp")}</th>
                <th className={MUN_TH}>{t("mun.col.rain")}</th>
                <th className={MUN_TH}>{t("mun.col.mm")}</th>
                <th className={MUN_TH}>{t("mun.col.wind")}</th>
              </tr>
            </thead>
            <tbody>
              {data.hourly.map((h) => (
                <tr key={h.time} className="border-t border-black/5 dark:border-white/5">
                  <td className={MUN_TD}>{h.time.slice(11, 16)}</td>
                  <td className={MUN_TD}>{Math.round(h.temperatureC)}°C</td>
                  <td className={MUN_TD}>{h.rainChance}%</td>
                  <td className={MUN_TD}>{h.rainMm.toFixed(1)}</td>
                  <td className={MUN_TD}>
                    {Math.round(h.windKmh)} km/h {compass(h.windDirDeg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MunSection>
    </div>
  );
}
