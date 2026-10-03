// Hourly weather detail for the Barangay Official M2 view (heat, rain mm,
// wind, UV). Client-side Open-Meteo call (no key, no PAGASA dependency),
// always Asia/Manila, with a 15-minute in-memory cache. On failure it falls
// back to the last cached result (marked stale); with no cache it throws a
// Filipino message that the UI shows with a retry button.

export interface IBarangayHourly {
  /** ISO local time (Asia/Manila), e.g. "2026-10-04T14:00". */
  time: string;
  temperatureC: number;
  feelsLikeC: number;
  precipitationMm: number;
  rainChance: number;
  windKmh: number;
  windDirDeg: number;
  uvIndex: number;
}

export interface IBarangayHourlyResult {
  hours: IBarangayHourly[];
  /** ISO timestamp of when the data was fetched from the provider. */
  lastUpdated: string;
  /** Attribution — required on every weather surface. */
  source: "Open-Meteo";
  /** True when this is an older cached copy served after a failed refresh. */
  stale: boolean;
}

interface IOpenMeteoHourlyResponse {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    precipitation?: number[];
    precipitation_probability?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    uv_index?: number[];
  };
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { ts: number; data: IBarangayHourly[] }>();

export const BARANGAY_HOURLY_ERROR =
  "Hindi makuha ang oras-oras na panahon ngayon. Subukang muli.";

function result(
  rows: IBarangayHourly[],
  ts: number,
  hours: number,
  stale: boolean,
): IBarangayHourlyResult {
  return {
    hours: rows.slice(0, hours),
    lastUpdated: new Date(ts).toISOString(),
    source: "Open-Meteo",
    stale,
  };
}

/** Next `hours` hourly rows starting from the current Manila hour. */
export async function fetchBarangayHourly(
  lat: number,
  lon: number,
  hours = 12,
  force = false,
): Promise<IBarangayHourlyResult> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    return result(hit.data, hit.ts, hours, false);
  }
  const base =
    process.env.NEXT_PUBLIC_OPEN_METEO_BASE ?? "https://api.open-meteo.com/v1";
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly:
      "temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m,uv_index",
    forecast_days: "2",
    timezone: "Asia/Manila",
  });
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/forecast?${params.toString()}`);
    if (!res.ok) {
      throw new Error(String(res.status));
    }
    const body = (await res.json()) as IOpenMeteoHourlyResponse;
    const h = body.hourly;
    const times = h?.time ?? [];
    if (times.length === 0) {
      throw new Error("empty");
    }
    // Current hour in Manila as "YYYY-MM-DDTHH".
    const nowHour = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .format(new Date())
      .replace(" ", "T");
    const start = Math.max(
      0,
      times.findIndex((t) => t.slice(0, 13) >= nowHour),
    );
    const rows: IBarangayHourly[] = times.slice(start, start + 24).map((time, j) => {
      const i = start + j;
      return {
        time,
        temperatureC: h?.temperature_2m?.[i] ?? 0,
        feelsLikeC: h?.apparent_temperature?.[i] ?? 0,
        precipitationMm: h?.precipitation?.[i] ?? 0,
        rainChance: h?.precipitation_probability?.[i] ?? 0,
        windKmh: h?.wind_speed_10m?.[i] ?? 0,
        windDirDeg: h?.wind_direction_10m?.[i] ?? 0,
        uvIndex: h?.uv_index?.[i] ?? 0,
      };
    });
    const ts = Date.now();
    cache.set(key, { ts, data: rows });
    return result(rows, ts, hours, false);
  } catch {
    // Fallback: serve the last known data (stale) rather than nothing.
    if (hit) {
      return result(hit.data, hit.ts, hours, true);
    }
    throw new Error(BARANGAY_HOURLY_ERROR);
  }
}

/** 16-point compass label for a wind direction in degrees. */
export function compassLabel(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}
