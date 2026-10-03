import { NextResponse } from "next/server";

import { fetchPagasaWeather } from "@/lib/api";
import type { ILocation, IWeatherData } from "@/types";

// PAGASA TenDay proxy (server-only). Additive to the Open-Meteo baseline: when
// no PAGASA_API_KEY is set or the upstream fails, the client returns null and
// this responds with a Filipino message. 15-minute minimum cache.
export const revalidate = 900;

const PAGASA_UNAVAILABLE =
  "Walang available na datos mula sa PAGASA. Gumagamit ng Open-Meteo.";

function parseNumber(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(
  request: Request,
): Promise<NextResponse<IWeatherData> | NextResponse<{ error: string }>> {
  try {
    const params = new URL(request.url).searchParams;
    const location: ILocation = {
      lat: parseNumber(params.get("lat"), 14.2117),
      lon: parseNumber(params.get("lon"), 121.1653),
      name: params.get("name")?.trim() || "Calamba",
      province: params.get("province")?.trim() || "Laguna",
    };

    const data = await fetchPagasaWeather(location);
    if (!data) {
      return NextResponse.json({ error: PAGASA_UNAVAILABLE }, { status: 503 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: PAGASA_UNAVAILABLE }, { status: 503 });
  }
}
