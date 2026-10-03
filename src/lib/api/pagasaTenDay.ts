import type { IForecastDay, ILocation, IPagasaTenDayMeta, IWeatherData } from "@/types";

// PAGASA TenDay climate forecast — SNAPSHOT of the official export
// (tenday-20261004-011555.pdf) for the City of Calamba, Laguna
// (LAT 14.2117, LONG 121.1653). Used until a live PAGASA_API_KEY is wired.
// Server-safe pure data; no network. Expires automatically after validUntil,
// after which the weather route falls back to Open-Meteo only.

export const PAGASA_TENDAY_META: IPagasaTenDayMeta = {
  issued: "2026-10-01",
  validUntil: "2026-10-10",
  model: "GFS by NOAA",
  location: "City of Calamba, Laguna",
};

const SNAPSHOT_LAT = 14.2117;
const SNAPSHOT_LON = 121.1653;
/** ~15 km radius: covers Calamba and immediate neighbours. */
const MAX_DISTANCE_DEG = 0.15;

interface ITenDayRow {
  date: string;
  rainfallMm: number;
  rainfallDesc: string;
  cloudDesc: string;
  maxC: number;
  meanC: number;
  minC: number;
  windMs: number;
  humidity: number;
}

// Transcribed verbatim from the PDF table (Thu Oct 1 – Sat Oct 10, 2026).
const ROWS: ITenDayRow[] = [
  { date: "2026-10-01", rainfallMm: 8.9, rainfallDesc: "LIGHT RAINS", cloudDesc: "SUNNY", maxC: 30.8, meanC: 27.2, minC: 23.6, windMs: 1.0, humidity: 93 },
  { date: "2026-10-02", rainfallMm: 18.8, rainfallDesc: "LIGHT RAINS", cloudDesc: "CLOUDY", maxC: 29.7, meanC: 26.5, minC: 23.2, windMs: 1.1, humidity: 92 },
  { date: "2026-10-03", rainfallMm: 15.4, rainfallDesc: "LIGHT RAINS", cloudDesc: "PARTLY CLOUDY", maxC: 27.3, meanC: 25.3, minC: 23.3, windMs: 1.0, humidity: 92 },
  { date: "2026-10-04", rainfallMm: 9.9, rainfallDesc: "LIGHT RAINS", cloudDesc: "CLOUDY", maxC: 29.3, meanC: 26.1, minC: 22.8, windMs: 1.3, humidity: 93 },
  { date: "2026-10-05", rainfallMm: 8.3, rainfallDesc: "LIGHT RAINS", cloudDesc: "CLOUDY", maxC: 29.9, meanC: 26.6, minC: 23.4, windMs: 1.1, humidity: 93 },
  { date: "2026-10-06", rainfallMm: 14.7, rainfallDesc: "LIGHT RAINS", cloudDesc: "CLOUDY", maxC: 28.6, meanC: 26.1, minC: 23.5, windMs: 1.0, humidity: 93 },
  { date: "2026-10-07", rainfallMm: 10.7, rainfallDesc: "LIGHT RAINS", cloudDesc: "CLOUDY", maxC: 25.8, meanC: 24.7, minC: 23.5, windMs: 1.4, humidity: 96 },
  { date: "2026-10-08", rainfallMm: 19.5, rainfallDesc: "LIGHT RAINS", cloudDesc: "CLOUDY", maxC: 24.6, meanC: 23.4, minC: 22.3, windMs: 1.7, humidity: 94 },
  { date: "2026-10-09", rainfallMm: 6.0, rainfallDesc: "LIGHT RAINS", cloudDesc: "MOSTLY CLOUDY", maxC: 29.1, meanC: 25.7, minC: 22.3, windMs: 1.2, humidity: 92 },
  { date: "2026-10-10", rainfallMm: 11.2, rainfallDesc: "LIGHT RAINS", cloudDesc: "CLOUDY", maxC: 28.5, meanC: 25.4, minC: 22.3, windMs: 1.0, humidity: 94 },
];

/** Today's date in Asia/Manila as yyyy-MM-dd. */
export function manilaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** True when the location is inside the snapshot's coverage area. */
export function isCoveredByTenDay(loc: Pick<ILocation, "lat" | "lon">): boolean {
  return (
    Math.abs(loc.lat - SNAPSHOT_LAT) <= MAX_DISTANCE_DEG &&
    Math.abs(loc.lon - SNAPSHOT_LON) <= MAX_DISTANCE_DEG
  );
}

/**
 * PAGASA's LIGHT RAINS + cloud descriptor → WMO code used by weatherCodes.ts.
 * Every day in this issuance is "LIGHT RAINS", so they map to rain codes; the
 * cloud cover only nudges sunny days toward showers.
 */
function toWmoCode(row: ITenDayRow): number {
  const rain = row.rainfallDesc.toLowerCase();
  if (/heavy|intense|torrential/.test(rain)) return 65;
  if (/moderate/.test(rain)) return 63;
  if (/light/.test(rain)) {
    return /sunny|partly/.test(row.cloudDesc.toLowerCase()) ? 80 : 61;
  }
  if (/no rain/.test(rain)) {
    const cloud = row.cloudDesc.toLowerCase();
    if (/sunny/.test(cloud)) return 0;
    if (/partly/.test(cloud)) return 2;
    return 3;
  }
  return 3;
}

/**
 * Rough rain-chance proxy from mm/day (PAGASA gives amount, not PoP). Only
 * used when Open-Meteo has no probability for that date.
 */
function mmToChance(mm: number): number {
  if (mm <= 0) return 0;
  if (mm < 2.5) return 40;
  if (mm < 7.5) return 60;
  if (mm < 15) return 75;
  return 90;
}

/**
 * PAGASA TenDay days from `today` through validUntil, or [] when the location
 * is outside coverage or the issuance has expired.
 */
export function getPagasaTenDayDays(
  loc: Pick<ILocation, "lat" | "lon">,
  today: string = manilaToday(),
): IForecastDay[] {
  if (!isCoveredByTenDay(loc) || today > PAGASA_TENDAY_META.validUntil) {
    return [];
  }
  return ROWS.filter((row) => row.date >= today).map((row) => ({
    date: row.date,
    weatherCode: toWmoCode(row),
    highC: Math.round(row.maxC),
    lowC: Math.round(row.minC),
    rainChance: mmToChance(row.rainfallMm),
    source: "PAGASA",
    rainfallMm: row.rainfallMm,
    rainfallDesc: row.rainfallDesc,
    cloudDesc: row.cloudDesc,
    meanC: row.meanC,
    humidity: row.humidity,
    windMs: row.windMs,
  }));
}

// "TODAY" box on the export: 26.1 °C, cloudy with light rains, 1.3 m/s S, 93%.
const SNAPSHOT_NOW = { date: "2026-10-04", tempC: 26.1, windMs: 1.3, humidity: 93, weatherCode: 61 };

/**
 * Full weather payload built ONLY from the PAGASA TenDay issuance — the
 * fallback when Open-Meteo is down/rate-limited. Current conditions use the
 * export's "today" observation on its date, else that day's mean. Returns
 * null when the location isn't covered or the issuance has expired.
 */
export function buildTenDayWeather(loc: ILocation, today: string = manilaToday()): IWeatherData | null {
  const days = getPagasaTenDayDays(loc, today);
  if (days.length === 0) {
    return null;
  }
  const first = days[0];
  const isSnapshotDay = today === SNAPSHOT_NOW.date;
  const tempC = Math.round(isSnapshotDay ? SNAPSHOT_NOW.tempC : (first.meanC ?? first.highC));
  const windMs = isSnapshotDay ? SNAPSHOT_NOW.windMs : (first.windMs ?? 0);
  return {
    location: loc,
    current: {
      temperatureC: tempC,
      feelsLikeC: tempC,
      weatherCode: isSnapshotDay ? SNAPSHOT_NOW.weatherCode : first.weatherCode,
      humidity: isSnapshotDay ? SNAPSHOT_NOW.humidity : (first.humidity ?? 0),
      rainChance: first.rainChance,
      windSpeedKmh: Math.round(windMs * 3.6),
    },
    forecast: days,
    source: "PAGASA",
    pagasaTenDay: PAGASA_TENDAY_META,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Merge PAGASA TenDay (preferred, per date) with Open-Meteo days into a
 * forecast of up to `limit` days starting today. Where both exist, PAGASA's
 * temps/rainfall win but Open-Meteo's true rain PROBABILITY is kept.
 */
export function mergeTenDay(
  openMeteo: IForecastDay[],
  pagasa: IForecastDay[],
  limit = 10,
  today: string = manilaToday(),
): IForecastDay[] {
  const byDate = new Map<string, IForecastDay>();
  for (const day of openMeteo) {
    if (day.date >= today) {
      byDate.set(day.date, { ...day, source: day.source ?? "Open-Meteo" });
    }
  }
  for (const day of pagasa) {
    const om = byDate.get(day.date);
    byDate.set(day.date, om ? { ...day, rainChance: om.rainChance } : day);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, limit);
}
