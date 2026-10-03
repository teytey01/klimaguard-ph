import type {
  IForecastDay,
  ILocation,
  IOpenMeteoCurrentWeather,
  IWeatherData,
} from "@/types";
import { describeWeather } from "@/lib/utils/weatherCodes";

// Open-Meteo Forecast client — the baseline, no-key provider. ALWAYS requests
// data in the Asia/Manila timezone. Used by the /api/weather Route Handler.

const REVALIDATE_SECONDS = 900; // 15-minute minimum cache.
const CACHE_TTL_MS = REVALIDATE_SECONDS * 1000; // 15-minute minimum cache.
const FORECAST_BASE = "https://api.open-meteo.com/v1";

interface IOpenMeteoCurrent {
  temperature_2m?: number;
  apparent_temperature?: number;
  relative_humidity_2m?: number;
  precipitation_probability?: number;
  weather_code?: number;
  wind_speed_10m?: number;
}

interface IOpenMeteoDaily {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
}

interface IOpenMeteoResponse {
  current?: IOpenMeteoCurrent;
  daily?: IOpenMeteoDaily;
}

function numberAt(arr: number[] | undefined, index: number): number {
  const value = arr?.[index];
  return typeof value === "number" ? value : 0;
}

// Last-known-good weather, keyed by "lat,lon". When Open-Meteo is unreachable
// (most commonly its free-tier daily quota → HTTP 429), the baseline weather
// AND agriculture surfaces would otherwise hard-fail. Keeping the most recent
// successful reading lets the app degrade to stale-but-usable data instead of
// a blank error — the same survival pattern useAlerts already uses client-side.
const LAST_GOOD_WEATHER_TTL_MS = 24 * 60 * 60 * 1000; // keep a day's reading.
const STALE_WEATHER_NOTICE =
  "Hindi makakonekta sa serbisyo ng panahon ngayon. Ipinapakita ang huling nakuhang datos (maaaring luma na).";

interface ILastGoodWeather {
  data: IWeatherData;
  savedAt: number;
}

const lastGoodWeather = new Map<string, ILastGoodWeather>();

function weatherCacheKey(loc: ILocation): string {
  return `${loc.lat},${loc.lon}`;
}

function rememberWeather(loc: ILocation, data: IWeatherData): void {
  lastGoodWeather.set(weatherCacheKey(loc), { data, savedAt: Date.now() });
}

/** Return the last successful reading for `loc` (marked stale), or null. */
function recallWeather(loc: ILocation): IWeatherData | null {
  const hit = lastGoodWeather.get(weatherCacheKey(loc));
  if (!hit) {
    return null;
  }
  if (Date.now() - hit.savedAt > LAST_GOOD_WEATHER_TTL_MS) {
    lastGoodWeather.delete(weatherCacheKey(loc));
    return null;
  }
  return { ...hit.data, location: loc, stale: true, notice: STALE_WEATHER_NOTICE };
}

function buildForecast(daily: IOpenMeteoDaily | undefined): IForecastDay[] {
  const times = daily?.time ?? [];
  return times.map((date, i) => ({
    date,
    weatherCode: numberAt(daily?.weather_code, i),
    highC: Math.round(numberAt(daily?.temperature_2m_max, i)),
    lowC: Math.round(numberAt(daily?.temperature_2m_min, i)),
    rainChance: numberAt(daily?.precipitation_probability_max, i),
  }));
}

/**
 * Fetches current conditions + a 7-day forecast for `loc` from Open-Meteo.
 * Throws on network/parse failure so the Route Handler can map it to a
 * Filipino error response.
 */
export async function fetchOpenMeteoWeather(
  loc: ILocation,
): Promise<IWeatherData> {
  const base = process.env.NEXT_PUBLIC_OPEN_METEO_BASE;
  if (!base) {
    throw new Error("Walang Open-Meteo base URL.");
  }

  const url = new URL(`${base}/forecast`);
  url.searchParams.set("latitude", String(loc.lat));
  url.searchParams.set("longitude", String(loc.lon));
  url.searchParams.set("timezone", "Asia/Manila");
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  // 10 days so it lines up with PAGASA's TenDay climate forecast.
  url.searchParams.set("forecast_days", "10");

  // The fetch/parse is wrapped so this function is self-contained regardless of
  // caller: on any failure it logs server-side and re-throws a single Filipino-
  // messaged error. The /api/weather route handler still catches that throw and
  // maps it to a 503, so the existing contract (throws on failure) is preserved.
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed with status ${res.status}`);
    }

    const data = (await res.json()) as IOpenMeteoResponse;
    const current = data.current ?? {};

    const result: IWeatherData = {
      location: loc,
      current: {
        temperatureC: Math.round(current.temperature_2m ?? 0),
        feelsLikeC: Math.round(
          current.apparent_temperature ?? current.temperature_2m ?? 0,
        ),
        weatherCode: current.weather_code ?? 0,
        humidity: current.relative_humidity_2m ?? 0,
        rainChance: current.precipitation_probability ?? 0,
        windSpeedKmh: Math.round(current.wind_speed_10m ?? 0),
      },
      forecast: buildForecast(data.daily),
      source: "Open-Meteo",
      fetchedAt: new Date().toISOString(),
    };
    // Remember the last good reading so a later quota/outage can fall back to it.
    rememberWeather(loc, result);
    return result;
  } catch (err) {
    console.error("[Open-Meteo] weather fetch error:", err);
    // Resilience: Open-Meteo's free tier returns HTTP 429 once the daily quota
    // is spent (and Next would otherwise cache that failure). Rather than kill
    // the baseline weather + agriculture surfaces, serve the last-known-good
    // reading for this location, clearly marked stale. Only throw when we have
    // never had a successful reading to fall back to.
    const stale = recallWeather(loc);
    if (stale) {
      return stale;
    }
    throw new Error("Hindi makuha ang panahon mula sa Open-Meteo.");
  }
}

// ===========================================================================
// Flat lat/lon helpers: getCurrentWeather / getForecast / weatherCodeToFilipino
//
// These expose the compact, display-ready surface used by WeatherCard-style
// UI and may be called client-side (real-time weather). They keep their own
// in-memory 15-minute cache so repeated calls within the window never re-hit
// the network, independent of Next's server-side `revalidate`.
// ===========================================================================

/** A fallback "feels like" when the apparent temp is missing is the air temp. */
interface IOpenMeteoCurrentExt extends IOpenMeteoCurrent {
  apparent_temperature?: number;
}

interface IOpenMeteoResponseExt {
  current?: IOpenMeteoCurrentExt;
  daily?: IOpenMeteoDaily;
}

interface ICacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Module-level 15-minute cache, keyed by request signature.
const responseCache = new Map<string, ICacheEntry<unknown>>();

function readCache<T>(key: string): T | undefined {
  const hit = responseCache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    responseCache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

function writeCache<T>(key: string, value: T): void {
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function openMeteoBase(): string {
  // Prefer the configured public base; fall back to the canonical host so the
  // helpers work even when the env var is absent (e.g. called client-side).
  return process.env.NEXT_PUBLIC_OPEN_METEO_BASE ?? FORECAST_BASE;
}

/**
 * WMO weather code → Filipino description string (label + emoji), e.g.
 * `weatherCodeToFilipino(61)` → "Umuulan 🌧️". Unknown codes return a safe
 * Filipino default. Thin wrapper over the shared `describeWeather` map so the
 * wording stays in one place.
 */
export function weatherCodeToFilipino(code: number): string {
  const { label, emoji } = describeWeather(code);
  return `${label} ${emoji}`.trim();
}

/**
 * Current conditions for a lat/lon as a flat, display-ready object with the
 * Filipino `condition` already resolved. Caches for 15 minutes. On any
 * network/parse failure it throws a Filipino-messaged error so callers can
 * render a graceful fallback with a retry.
 */
export async function getCurrentWeather(
  lat: number,
  lon: number,
): Promise<IOpenMeteoCurrentWeather> {
  const cacheKey = `current:${lat},${lon}`;
  const cached = readCache<IOpenMeteoCurrentWeather>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(`${openMeteoBase()}/forecast`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("timezone", "Asia/Manila");
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability",
    );

    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed with status ${res.status}`);
    }

    const data = (await res.json()) as IOpenMeteoResponseExt;
    const current = data.current ?? {};
    const temperature = Math.round(current.temperature_2m ?? 0);

    const result: IOpenMeteoCurrentWeather = {
      temperature,
      feelsLike: Math.round(current.apparent_temperature ?? temperature),
      condition: weatherCodeToFilipino(current.weather_code ?? -1),
      humidity: current.relative_humidity_2m ?? 0,
      rainChance: current.precipitation_probability ?? 0,
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      lastUpdated: new Date().toISOString(),
      source: "Open-Meteo",
    };

    writeCache(cacheKey, result);
    return result;
  } catch (err) {
    throw new Error(
      `Hindi makuha ang kasalukuyang panahon mula sa Open-Meteo: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/**
 * `days`-day daily forecast for a lat/lon (default 7). Caches for 15 minutes.
 * On any network/parse failure it throws a Filipino-messaged error so callers
 * can render a graceful fallback with a retry.
 */
export async function getForecast(
  lat: number,
  lon: number,
  days: number = 7,
): Promise<IForecastDay[]> {
  const cacheKey = `forecast:${lat},${lon},${days}`;
  const cached = readCache<IForecastDay[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(`${openMeteoBase()}/forecast`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("timezone", "Asia/Manila");
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    );
    url.searchParams.set("forecast_days", String(days));

    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed with status ${res.status}`);
    }

    const data = (await res.json()) as IOpenMeteoResponseExt;
    const result = buildForecast(data.daily);

    // NOTE [resilience]: by contract getForecast returns a bare IForecastDay[]
    // with no lastUpdated/fetchedAt field — this is intentional, not a gap.
    // Freshness is governed by the 15-min responseCache TTL below. If the
    // forecast UI ever needs a visible "updated X mins ago" label, switch to an
    // envelope { days, lastUpdated } (ripples to callers).
    writeCache(cacheKey, result);
    return result;
  } catch (err) {
    throw new Error(
      `Hindi makuha ang forecast mula sa Open-Meteo: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
