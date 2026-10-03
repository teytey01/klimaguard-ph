import { NextResponse } from "next/server";

import { fetchOpenMeteoWeather, fetchPagasaWeather } from "@/lib/api";
import type { ILocation, IWeatherData } from "@/types";

// Open-Meteo Forecast proxy with PAGASA attempted first then silent fallback.
// ALWAYS resolves data in Asia/Manila (enforced by the Open-Meteo client).
// 15-minute minimum cache.
export const revalidate = 900;

const WEATHER_ERROR = "Hindi makuha ang panahon ngayon. Pakisubukan ulit.";

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
): Promise<NextResponse<IWeatherData> | NextResponse<{ error: string }>> {
  try {
    const params = new URL(request.url).searchParams;
    const location = resolveLocation(params);

    // PAGASA first (only when a key is set and the call succeeds), otherwise
    // silently fall back to the Open-Meteo baseline provider.
    const pagasa = await fetchPagasaWeather(location);
    const data = pagasa ?? (await fetchOpenMeteoWeather(location));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: WEATHER_ERROR }, { status: 503 });
  }
}
