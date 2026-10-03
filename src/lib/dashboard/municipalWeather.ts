import type { ILocation } from "@/types";
import {
  getPagasaTenDayDays,
  isCoveredByTenDay,
  PAGASA_TENDAY_META,
} from "@/lib/api/pagasaTenDay";

// Full M2 weather for the Municipal Official (10-day, hourly, rainfall mm,
// soil moisture, wind direction). The shared /api/weather route does not
// return these fields, so this client fetcher calls Open-Meteo directly (no
// key, Asia/Manila) with a 15-minute in-memory cache.

export const MUN_WEATHER_SOURCE = "Pinagmulan: Open-Meteo (Asia/Manila)";
export const MUN_WEATHER_ERROR = "Hindi makuha ang 10-day forecast ngayon. Pakisubukan ulit.";

const CACHE_TTL_MS = 15 * 60 * 1000;

export interface IMunDailyWeather {
  date: string;
  weatherCode: number;
  highC: number;
  lowC: number;
  rainMm: number;
  rainChance: number;
  windMaxKmh: number;
  windDirDeg: number;
}

export interface IMunHourlyWeather {
  time: string;
  temperatureC: number;
  rainChance: number;
  rainMm: number;
  windKmh: number;
  windDirDeg: number;
}

export interface IMunWeather {
  current: {
    temperatureC: number;
    weatherCode: number;
    windKmh: number;
    windDirDeg: number;
    precipitationMm: number;
  };
  daily: IMunDailyWeather[];
  /** Next 24 hours from the current hour. */
  hourly: IMunHourlyWeather[];
  /** Soil moisture 0–1 cm (m³/m³) at the current hour. */
  soilMoisture: number | null;
  fetchedAt: string;
  /**
   * Where this payload came from. `"open-meteo"` is the live fetch;
   * `"pagasa-snapshot"` means Open-Meteo was unreachable and this is the seeded
   * PAGASA Calamba TenDay demo snapshot, so the UI credits PAGASA instead.
   */
  provider: "open-meteo" | "pagasa-snapshot";
}

interface IOpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
    wind_direction_10m_dominant: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    precipitation: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    soil_moisture_0_to_1cm: (number | null)[];
  };
}

const cache = new Map<string, { data: IMunWeather; ts: number }>();

function n(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// Snapshot export reports a predominantly southerly flow (wind arrows + "SOUTH"
// in the TODAY box). PAGASA TenDay has no per-day bearing, so synthesized days
// use a fixed southerly bearing (180°) purely so the wind-direction compass
// renders a sensible label in the fallback.
const SNAPSHOT_WIND_DIR_DEG = 180;

/**
 * Builds an `IMunWeather` purely from the seeded PAGASA Calamba TenDay snapshot
 * (`pagasaTenDay.ts`). This is the graceful fallback for the municipal M2 panel
 * when Open-Meteo is unreachable (most commonly its free-tier daily 429 quota),
 * mirroring how the shared `/api/weather` route falls back to the same snapshot.
 *
 * Returns `null` when the location is outside the snapshot's ~15 km Calamba
 * coverage or the issuance has expired — the caller then surfaces the error.
 *
 * The snapshot has no hourly series or soil moisture, so hourly is synthesized
 * from the first forecast day (flat temp/rain across 24 hours, clearly demo
 * data) and soil moisture is `null` (the panel already renders "—" for null).
 */
export function buildMunicipalTenDaySnapshot(location: ILocation): IMunWeather | null {
  if (!isCoveredByTenDay(location)) {
    return null;
  }
  const days = getPagasaTenDayDays(location);
  if (days.length === 0) {
    return null;
  }

  const daily: IMunDailyWeather[] = days.map((d) => ({
    date: d.date,
    weatherCode: d.weatherCode,
    highC: d.highC,
    lowC: d.lowC,
    rainMm: n(d.rainfallMm),
    rainChance: d.rainChance,
    // Snapshot wind is m/s; IMunWeather expects km/h (×3.6).
    windMaxKmh: Math.round(n(d.windMs) * 3.6),
    windDirDeg: SNAPSHOT_WIND_DIR_DEG,
  }));

  const first = days[0];
  const firstTempC = Math.round(n(first.meanC) || first.highC);
  const firstWindKmh = Math.round(n(first.windMs) * 3.6);
  // Spread the day's single rainfall figure evenly across 24 hours (mm/day→mm/h)
  // so the hourly mm column sums back to the daily total.
  const hourlyMm = n(first.rainfallMm) / 24;

  const hourly: IMunHourlyWeather[] = Array.from({ length: 24 }, (_, h) => ({
    time: `${first.date}T${String(h).padStart(2, "0")}:00`,
    temperatureC: firstTempC,
    rainChance: first.rainChance,
    rainMm: hourlyMm,
    windKmh: firstWindKmh,
    windDirDeg: SNAPSHOT_WIND_DIR_DEG,
  }));

  return {
    current: {
      temperatureC: firstTempC,
      weatherCode: first.weatherCode,
      windKmh: firstWindKmh,
      windDirDeg: SNAPSHOT_WIND_DIR_DEG,
      precipitationMm: n(first.rainfallMm),
    },
    daily,
    hourly,
    // Snapshot has no soil-moisture reading; the panel renders "—" for null.
    soilMoisture: null,
    fetchedAt: new Date().toISOString(),
    provider: "pagasa-snapshot",
  };
}

/** Attribution shown when the panel is served from the seeded PAGASA snapshot. */
export const MUN_WEATHER_SNAPSHOT_SOURCE = `Pinagmulan: PAGASA 10-Day Climate Forecast (${PAGASA_TENDAY_META.location}), ${PAGASA_TENDAY_META.model} — demo snapshot`;

export function parseMunWeather(body: IOpenMeteoResponse): IMunWeather {
  const { current, daily, hourly } = body;
  if (!current || !daily || !hourly) {
    throw new Error("incomplete payload");
  }
  const daysOut: IMunDailyWeather[] = daily.time.map((date, i) => ({
    date,
    weatherCode: n(daily.weather_code[i]),
    highC: n(daily.temperature_2m_max[i]),
    lowC: n(daily.temperature_2m_min[i]),
    rainMm: n(daily.precipitation_sum[i]),
    rainChance: n(daily.precipitation_probability_max[i]),
    windMaxKmh: n(daily.wind_speed_10m_max[i]),
    windDirDeg: n(daily.wind_direction_10m_dominant[i]),
  }));
  // Open-Meteo hourly times are local "yyyy-MM-ddTHH:mm"; current.time too.
  const nowHour = current.time.slice(0, 13);
  let start = hourly.time.findIndex((t) => t.slice(0, 13) === nowHour);
  if (start < 0) {
    start = 0;
  }
  const hoursOut: IMunHourlyWeather[] = hourly.time.slice(start, start + 24).map((time, k) => {
    const i = start + k;
    return {
      time,
      temperatureC: n(hourly.temperature_2m[i]),
      rainChance: n(hourly.precipitation_probability[i]),
      rainMm: n(hourly.precipitation[i]),
      windKmh: n(hourly.wind_speed_10m[i]),
      windDirDeg: n(hourly.wind_direction_10m[i]),
    };
  });
  const soil = hourly.soil_moisture_0_to_1cm[start];
  return {
    current: {
      temperatureC: n(current.temperature_2m),
      weatherCode: n(current.weather_code),
      windKmh: n(current.wind_speed_10m),
      windDirDeg: n(current.wind_direction_10m),
      precipitationMm: n(current.precipitation),
    },
    daily: daysOut,
    hourly: hoursOut,
    soilMoisture: typeof soil === "number" ? soil : null,
    fetchedAt: new Date().toISOString(),
    provider: "open-meteo",
  };
}

/** Fetch (cached 15 min). Throws a Filipino error message on failure. */
export async function fetchMunicipalWeather(location: ILocation, force = false): Promise<IMunWeather> {
  const key = `${location.lat},${location.lon}`;
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    return hit.data;
  }
  const base = process.env.NEXT_PUBLIC_OPEN_METEO_BASE ?? "https://api.open-meteo.com/v1";
  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    timezone: "Asia/Manila",
    forecast_days: "10",
    current: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant",
    hourly:
      "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,soil_moisture_0_to_1cm",
  });
  try {
    const res = await fetch(`${base}/forecast?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed with status ${res.status}`);
    }
    const data = parseMunWeather((await res.json()) as IOpenMeteoResponse);
    cache.set(key, { data, ts: Date.now() });
    return data;
  } catch (err) {
    // Resilience: Open-Meteo's free tier returns HTTP 429 once the daily quota
    // is spent (and a malformed payload makes parseMunWeather throw "incomplete
    // payload"). Rather than dead-end the municipal M2 panel, fall back to the
    // seeded PAGASA Calamba TenDay snapshot — the same demo data the shared
    // /api/weather route serves when Open-Meteo is down. Only throw the Filipino
    // error when the location is outside snapshot coverage or it has expired.
    console.error("[MunicipalWeather] Open-Meteo fetch failed:", err);
    const snapshot = buildMunicipalTenDaySnapshot(location);
    if (snapshot) {
      // Cache the fallback too, so repeat renders within the window are stable.
      cache.set(key, { data: snapshot, ts: Date.now() });
      return snapshot;
    }
    throw new Error(MUN_WEATHER_ERROR);
  }
}
