import type { IGeocodingResult } from "@/types";

// Open-Meteo Geocoding client. Used by the /api/geocoding Route Handler.
// Filters to Philippine results (country_code === "PH") in code regardless of
// any upstream country filter.

const REVALIDATE_SECONDS = 900; // 15-minute minimum cache.

interface IOpenMeteoGeoResult {
  name?: string;
  admin1?: string;
  latitude?: number;
  longitude?: number;
  country_code?: string;
}

interface IOpenMeteoGeoResponse {
  results?: IOpenMeteoGeoResult[];
}

/**
 * Fetches Philippine places matching `query` from Open-Meteo Geocoding.
 * Returns an empty array on any error (graceful fallback).
 */
export async function fetchGeocoding(
  query: string,
): Promise<IGeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const base = process.env.NEXT_PUBLIC_GEOCODING_BASE;
  if (!base) {
    return [];
  }

  const url = new URL(`${base}/search`);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  // Hint the upstream to the Philippines; the in-code filter below is the
  // authoritative guarantee either way.
  url.searchParams.set("countryCode", "PH");

  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as IOpenMeteoGeoResponse;
    const results = data.results ?? [];

    return results
      .filter(
        (item): item is Required<IOpenMeteoGeoResult> =>
          item.country_code === "PH" &&
          typeof item.name === "string" &&
          typeof item.admin1 === "string" &&
          typeof item.latitude === "number" &&
          typeof item.longitude === "number",
      )
      .map((item) => ({
        name: item.name,
        admin1: item.admin1,
        lat: item.latitude,
        lon: item.longitude,
        country_code: item.country_code,
      }));
  } catch {
    return [];
  }
}
