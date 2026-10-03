import type {
  IForecastDay,
  ILocation,
  IPagasaForecast,
  IWeatherData,
} from "@/types";

// PAGASA TenDay client — SERVER-ONLY and purely additive. The API key
// (PAGASA_API_KEY) is read here from server env and MUST NEVER be imported into
// a client component. When the key is blank or the call fails, this returns
// `null` so the weather Route Handler silently falls back to Open-Meteo.

const PAGASA_ENDPOINT = "https://api.pagasa.dost.gov.ph/v1/tenday/forecast";
const REVALIDATE_SECONDS = 900; // 15-minute minimum cache.

/**
 * Attempts to fetch weather from PAGASA. Returns `null` whenever the key is
 * absent or anything goes wrong — never throws — so the Open-Meteo default
 * path is never disrupted.
 */
export async function fetchPagasaWeather(
  loc: ILocation,
): Promise<IWeatherData | null> {
  const apiKey = process.env.PAGASA_API_KEY;
  if (!apiKey) {
    // Default path: no key configured, so PAGASA is skipped entirely.
    return null;
  }

  try {
    const url = new URL(PAGASA_ENDPOINT);
    url.searchParams.set("lat", String(loc.lat));
    url.searchParams.set("lon", String(loc.lon));

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      return null;
    }

    // The exact PAGASA TenDay response schema cannot be verified without a live
    // key. Until the mapping is confirmed against a real response, return null
    // so the silent Open-Meteo fallback stays airtight.
    // needs verification during implementation
    return null;
  } catch {
    return null;
  }
}

// ===========================================================================
// PSGC-code TenDay surface: getPagasaForecast / isPagasaAvailable / getPsgcCode
//
// SERVER-ONLY. These never throw and never surface PAGASA errors to users —
// errors are logged to the server console and the caller falls back to
// Open-Meteo on a `null` / `false` result. The API key is read from
// PAGASA_API_KEY and MUST NEVER reach a client component.
// ===========================================================================

const PAGASA_BASE = "https://api.pagasa.dost.gov.ph/v1/tenday";
const PAGASA_TTL_MS = 30 * 60 * 1000; // 30-minute cache (PAGASA updates slowly).
const PAGASA_PING_TIMEOUT_MS = 5000;
const PAGASA_FETCH_TIMEOUT_MS = 10000;

/** PSGC codes for the Eastern Visayas (Region VIII) demo municipalities. */
const EASTERN_VISAYAS_PSGC: Record<string, string> = {
  "tacloban": "083747000",
  "ormoc": "084015000",
  "palo": "083731000",
  "basey": "086002000",
  "catbalogan": "086004000",
  "naval": "087807000",
};

interface IPagasaCacheEntry {
  value: IForecastDay[];
  expiresAt: number;
}

// Module-level 30-minute cache, keyed by PSGC code.
const pagasaCache = new Map<string, IPagasaCacheEntry>();

/**
 * Shape we defensively read from the PAGASA TenDay payload.
 *
 * Field names/units reflect PAGASA's TenDay 10-day climate forecast as seen in
 * the official rendered export (GFS-by-NOAA data): per day it reports a
 * separate RAINFALL description and CLOUD COVER description, rainfall as
 * mm/day (NOT a probability), and max/mean/min temperatures in °C plus wind and
 * humidity. The exact JSON key names from the keyed API are still unconfirmed,
 * so the parse stays defensive and returns null on anything unexpected. The
 * snake_case keys below are the best mapping of the documented fields.
 */
interface IPagasaRawDay {
  date?: string;
  /** e.g. "LIGHT RAINS", "NO RAIN" — PAGASA's rainfall descriptor. */
  rainfall_desc?: string;
  /** e.g. "SUNNY", "PARTLY CLOUDY", "MOSTLY CLOUDY", "CLOUDY". */
  cloud_cover_desc?: string;
  /** Rainfall amount in mm/day (PAGASA gives amount, not probability). */
  rainfall_mm?: number;
  temperature_max?: number;
  temperature_mean?: number;
  temperature_min?: number;
  wind_speed?: number;
  humidity?: number;
}

interface IPagasaRawResponse {
  forecasts?: IPagasaRawDay[];
}

/**
 * Maps PAGASA's TWO text descriptors — rainfall and cloud cover — to the WMO
 * codes the rest of the app speaks (see lib/utils/weatherCodes.ts). PAGASA's
 * TenDay vocabulary (observed from the official export) is terse uppercase:
 * rainfall is one of NO RAIN / LIGHT RAINS / (heavier variants), cloud cover is
 * SUNNY / PARTLY CLOUDY / MOSTLY CLOUDY / CLOUDY.
 *
 * Precedence: rain conditions describe the weather better than clouds, so a
 * rainfall descriptor that indicates actual rain wins; otherwise we fall back
 * to the cloud-cover descriptor. Returns 3 (Maulap/cloudy) as a safe default.
 */
function descriptionToWmoCode(
  rainfallDesc: string | undefined,
  cloudCoverDesc: string | undefined,
): number {
  const rain = (rainfallDesc ?? "").toLowerCase();
  const cloud = (cloudCoverDesc ?? "").toLowerCase();

  // Rainfall descriptor first, most-severe / most-specific first.
  const rainRules: ReadonlyArray<readonly [RegExp, number]> = [
    [/thunder|lightning|bagyo|typhoon|storm/, 95], // thunderstorm / typhoon
    [/heavy rain|monsoon|habagat|intense/, 65], // heavy rain
    [/moderate rain/, 63],
    [/rain shower|scattered.*shower|pabugso/, 80], // rain showers
    [/light rain|drizzle|ambon/, 51], // "LIGHT RAINS" — PAGASA's common value
    [/rain|ulan|wet/, 61], // generic rain
  ];
  for (const [pattern, code] of rainRules) {
    if (pattern.test(rain)) return code;
  }

  // No rain indicated → describe by cloud cover.
  const cloudRules: ReadonlyArray<readonly [RegExp, number]> = [
    [/mostly cloudy|overcast/, 3],
    [/partly cloudy|bahagyang/, 2],
    [/cloudy|maulap/, 3],
    [/fair|mostly (sunny|clear)/, 1],
    [/sunny|clear|maaraw/, 0],
    [/cloud/, 3], // any remaining "cloud" mention
  ];
  for (const [pattern, code] of cloudRules) {
    if (pattern.test(cloud)) return code;
  }

  // "NO RAIN" with no cloud info, or anything unrecognized.
  if (/no rain/.test(rain)) return 1; // halos maaraw
  return 3; // Safe neutral default: Maulap (cloudy).
}

/** Fetch with an abort-based timeout so a hung PAGASA call can't stall us. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normalizes a raw PAGASA day into the project's `IForecastDay`. Returns null
 * for a malformed entry so a partial payload degrades to the Open-Meteo path
 * rather than rendering garbage.
 */
function toForecastDay(raw: IPagasaRawDay): IForecastDay | null {
  if (
    typeof raw.date !== "string" ||
    typeof raw.temperature_max !== "number" ||
    typeof raw.temperature_min !== "number"
  ) {
    return null;
  }
  return {
    date: raw.date,
    // PAGASA reports two text descriptors (rainfall + cloud cover), not WMO
    // codes — translate via the mapping so the shared weatherCodes util renders.
    weatherCode: descriptionToWmoCode(raw.rainfall_desc, raw.cloud_cover_desc),
    highC: Math.round(raw.temperature_max),
    lowC: Math.round(raw.temperature_min),
    // PAGASA reports rainfall AMOUNT (mm/day), not a probability. IForecastDay
    // expects a 0–100 "chance", so derive a rough proxy: 0mm → 0%, and scale up
    // to ~100% around 20mm/day (heavy). This is an approximation, clearly not a
    // true PoP — the mm value is the authoritative figure if ever surfaced.
    rainChance:
      typeof raw.rainfall_mm === "number"
        ? Math.max(0, Math.min(100, Math.round((raw.rainfall_mm / 20) * 100)))
        : 0,
  };
}

/**
 * Fetches the PAGASA TenDay forecast for a PSGC code and normalizes it to
 * `IForecastDay[]`. Returns `null` on ANY problem — missing key, network error,
 * timeout, non-OK status, or unrecognized payload — so the caller silently
 * falls back to Open-Meteo. Never throws. Caches successful results for 30
 * minutes. All errors are logged to the server console only.
 */
export async function getPagasaForecast(
  psgcCode: string,
): Promise<IForecastDay[] | null> {
  const apiKey = process.env.PAGASA_API_KEY;
  if (!apiKey) {
    // No key configured → skip PAGASA entirely, gracefully.
    return null;
  }

  const cached = pagasaCache.get(psgcCode);
  if (cached && Date.now() <= cached.expiresAt) {
    return cached.value;
  }

  try {
    const res = await fetchWithTimeout(
      `${PAGASA_BASE}/${encodeURIComponent(psgcCode)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      PAGASA_FETCH_TIMEOUT_MS,
    );

    if (!res.ok) {
      console.error(`[PAGASA] TenDay request failed: HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as IPagasaRawResponse;
    const rawDays = data.forecasts ?? [];
    const days = rawDays
      .map(toForecastDay)
      .filter((d): d is IForecastDay => d !== null);

    if (days.length === 0) {
      // Unrecognized / empty payload — stay on the Open-Meteo fallback.
      console.error("[PAGASA] TenDay payload had no usable forecast days.");
      return null;
    }

    // NOTE [resilience]: by contract getPagasaForecast returns a bare
    // IForecastDay[] with no lastUpdated/fetchedAt field — intentional, not a
    // gap. Freshness is governed by the 30-min pagasaCache TTL below. If a
    // surfaced timestamp is needed, switch to an envelope { days, lastUpdated }.
    pagasaCache.set(psgcCode, {
      value: days,
      expiresAt: Date.now() + PAGASA_TTL_MS,
    });
    return days;
  } catch (err) {
    // Log server-side only; NEVER surface PAGASA errors to users.
    console.error("[PAGASA] TenDay fetch error:", err);
    return null;
  }
}

/**
 * Quick health check: pings the PAGASA base to see if the API is responding.
 * Returns `false` on any error, timeout, or when no key is configured. Never
 * throws.
 */
export async function isPagasaAvailable(): Promise<boolean> {
  const apiKey = process.env.PAGASA_API_KEY;
  if (!apiKey) {
    return false;
  }

  try {
    const res = await fetchWithTimeout(
      PAGASA_BASE,
      { method: "HEAD", headers: { Authorization: `Bearer ${apiKey}` } },
      PAGASA_PING_TIMEOUT_MS,
    );
    return res.ok;
  } catch (err) {
    console.error("[PAGASA] Availability check failed:", err);
    return false;
  }
}

/**
 * Looks up the PSGC code for an Eastern Visayas (Region VIII) municipality.
 * Case-insensitive on the municipality name; `province` is accepted for API
 * symmetry and future disambiguation. Returns `null` for unknown municipalities
 * so the caller can fall back to lat/lon-based providers.
 */
export function getPsgcCode(
  municipality: string,
  province: string,
): string | null {
  void province; // Reserved for future multi-region disambiguation.
  const key = municipality.trim().toLowerCase();
  return EASTERN_VISAYAS_PSGC[key] ?? null;
}

// IPagasaForecast is exported from "@/types" and re-exported here so consumers
// of this wrapper can import the PAGASA-specific day shape alongside the funcs.
export type { IPagasaForecast };
