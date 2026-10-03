import type { ILocation, IWeatherData } from "@/types";

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
