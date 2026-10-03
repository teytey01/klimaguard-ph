import type { IGeocodingResult, ILocation } from "@/types";

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

// ===========================================================================
// Location-name helpers for LocationSearch autocomplete and GPS.
//
// searchLocation / getUserLocation / reverseGeocode return the project's
// `ILocation` shape ({ name, province, lat, lon, region? }). `province` is
// Open-Meteo's `admin1`. The "Municipality, Province" display string is just
// `${name}, ${province}` at the call site. All results are PH-only.
// ===========================================================================

/** Manila fallback used when GPS is unavailable (per spec). */
export const MANILA_FALLBACK = { latitude: 14.5995, longitude: 120.9842 };

const GPS_DENIED_MESSAGE =
  "Hindi ma-access ang GPS. I-search mo na lang ang lugar mo.";

/**
 * Searches Philippine places matching `query` for the LocationSearch
 * autocomplete. Requests up to 5 matches, filters to `country_code === "PH"`,
 * and maps to `ILocation`. Returns an empty array on any failure (never
 * throws) so the UI can show an empty-state suggestion.
 */
export async function searchLocation(query: string): Promise<ILocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const base =
    process.env.NEXT_PUBLIC_GEOCODING_BASE ??
    "https://geocoding-api.open-meteo.com/v1";

  const url = new URL(`${base}/search`);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  // TODO [resilience]: `revalidate` below is a server-side (15-min) cache only.
  // When searchLocation is called directly from a client component for
  // autocomplete, consider a module-level 15-min Map cache (as in weather.ts)
  // or debounced caching so repeated keystrokes don't re-hit the network.
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as IOpenMeteoGeoResponse;
    const results = data.results ?? [];

    // CRITICAL: Philippines-only. Drop anything whose country_code !== "PH".
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
        province: item.admin1,
        lat: item.latitude,
        lon: item.longitude,
      }));
  } catch {
    return [];
  }
}

/**
 * Resolves the user's current coordinates via the browser Geolocation API
 * (high accuracy, 10s timeout). Throws a Filipino error when permission is
 * denied; falls back to Manila when the Geolocation API is entirely
 * unavailable (e.g. SSR or unsupported browser).
 */
export async function getUserLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  try {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // No Geolocation API at all (SSR / unsupported) → graceful Manila fallback.
      return { ...MANILA_FALLBACK };
    }

    return await new Promise<{ latitude: number; longitude: number }>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          () => reject(new Error(GPS_DENIED_MESSAGE)),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      },
    );
  } catch (err) {
    // Permission denied / timeout surfaces the Filipino message to the caller.
    throw err instanceof Error ? err : new Error(GPS_DENIED_MESSAGE);
  }
}

/**
 * A known PH place used for keyless nearest-match reverse geocoding. Seeded
 * with the app's default region plus the Eastern Visayas municipalities the
 * PAGASA wrapper covers. Extend freely — this is a static, offline table, not
 * an API. Coordinates are approximate town-center points.
 */
interface IKnownPlace {
  name: string;
  province: string;
  lat: number;
  lon: number;
  region?: string;
}

const KNOWN_PH_PLACES: readonly IKnownPlace[] = [
  { name: "Calamba", province: "Laguna", lat: 14.2117, lon: 121.1653, region: "CALABARZON" },
  { name: "Maynila", province: "Metro Manila", lat: 14.5995, lon: 120.9842, region: "NCR" },
  { name: "Quezon City", province: "Metro Manila", lat: 14.676, lon: 121.0437, region: "NCR" },
  { name: "Tacloban", province: "Leyte", lat: 11.2447, lon: 125.0048, region: "Eastern Visayas" },
  { name: "Ormoc", province: "Leyte", lat: 11.0064, lon: 124.6075, region: "Eastern Visayas" },
  { name: "Palo", province: "Leyte", lat: 11.1575, lon: 124.9908, region: "Eastern Visayas" },
  { name: "Basey", province: "Samar", lat: 11.2819, lon: 125.0686, region: "Eastern Visayas" },
  { name: "Catbalogan", province: "Samar", lat: 11.7753, lon: 124.8861, region: "Eastern Visayas" },
  { name: "Naval", province: "Biliran", lat: 11.5631, lon: 124.3972, region: "Eastern Visayas" },
  { name: "Cebu City", province: "Cebu", lat: 10.3157, lon: 123.8854, region: "Central Visayas" },
  { name: "Davao City", province: "Davao del Sur", lat: 7.1907, lon: 125.4553, region: "Davao Region" },
  { name: "Baguio", province: "Benguet", lat: 16.4023, lon: 120.596, region: "CAR" },
];

/** Great-circle distance (km) between two lat/lon points (haversine). */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius, km.
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Reverse-geocodes coordinates to the nearest known Philippine location.
 *
 * NOTE: Open-Meteo's Geocoding API is forward-only (name → coordinates) and
 * there is no free, key-less reverse endpoint. Per the project's "no key means
 * Open-Meteo-only, degrade gracefully" rule, this uses an offline nearest-match
 * against KNOWN_PH_PLACES (haversine distance) instead of a keyed third-party
 * provider — approximate but dependency-free. Returns the nearest place, or
 * `null` when the table is somehow empty or inputs are non-finite (caller then
 * falls back to raw coordinates / the GPS label). Never throws.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<ILocation | null> {
  try {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    let nearest: IKnownPlace | null = null;
    let nearestKm = Infinity;
    for (const place of KNOWN_PH_PLACES) {
      const d = haversineKm(lat, lon, place.lat, place.lon);
      if (d < nearestKm) {
        nearestKm = d;
        nearest = place;
      }
    }

    if (!nearest) {
      return null;
    }

    return {
      name: nearest.name,
      province: nearest.province,
      lat: nearest.lat,
      lon: nearest.lon,
      region: nearest.region,
    };
  } catch {
    return null;
  }
}
