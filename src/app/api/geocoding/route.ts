import { NextResponse } from "next/server";

import { fetchGeocoding } from "@/lib/api";
import type { IGeocodingResponse } from "@/types";

// Open-Meteo Geocoding proxy. Returns only Philippine results
// (country_code === "PH"), normalized to { name, admin1, lat, lon,
// country_code }. 15-minute minimum cache.
export const revalidate = 900;

export async function GET(
  request: Request,
): Promise<NextResponse<IGeocodingResponse>> {
  try {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const results = await fetchGeocoding(query);
    return NextResponse.json({ results });
  } catch {
    // Graceful fallback: an empty result set lets the UI show its Filipino
    // empty/suggestion state instead of crashing.
    return NextResponse.json({ results: [] });
  }
}
