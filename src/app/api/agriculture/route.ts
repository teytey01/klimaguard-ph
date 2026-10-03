import { NextResponse } from "next/server";

import { fetchOpenMeteoWeather } from "@/lib/api";
import {
  AGRI_SOURCE,
  buildCropAdvisories,
  DEMO_ENSO_PHASE,
} from "@/lib/agriculture";
import type { IAgricultureResponse, ILocation } from "@/types";

// Agricultural advisory for common PH crops, derived from live Open-Meteo
// weather (ALWAYS Asia/Manila, enforced by the client). 15-minute minimum
// cache. Degrades gracefully to a Filipino error on failure.
export const revalidate = 900;

const AGRI_ERROR = "Hindi makuha ang payo sa pagsasaka ngayon. Pakisubukan ulit.";

function parseNumber(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveLocation(params: URLSearchParams): ILocation {
  const defaultLat = parseNumber(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? null, 14.2117);
  const defaultLon = parseNumber(process.env.NEXT_PUBLIC_DEFAULT_LON ?? null, 121.1653);
  const defaultName = process.env.NEXT_PUBLIC_DEFAULT_LOCATION ?? "Calamba, Laguna";
  const [defName, defProvince] = defaultName.split(",").map((s) => s.trim());

  return {
    lat: parseNumber(params.get("lat"), defaultLat),
    lon: parseNumber(params.get("lon"), defaultLon),
    name: params.get("name")?.trim() || defName || "Calamba",
    province: params.get("province")?.trim() || defProvince || "Laguna",
    region: process.env.NEXT_PUBLIC_DEFAULT_REGION ?? undefined,
  };
}

export async function GET(
  request: Request,
): Promise<NextResponse<IAgricultureResponse> | NextResponse<{ error: string }>> {
  try {
    const params = new URL(request.url).searchParams;
    const location = resolveLocation(params);

    const weather = await fetchOpenMeteoWeather(location);
    const advisories = buildCropAdvisories({
      current: weather.current,
      forecast: weather.forecast,
      ensoPhase: DEMO_ENSO_PHASE,
    });

    return NextResponse.json({
      location,
      advisories,
      source: AGRI_SOURCE,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: AGRI_ERROR }, { status: 503 });
  }
}
