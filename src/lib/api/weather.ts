import type {
  IForecastDay,
  ILocation,
  IWeatherData,
} from "@/types";

// Open-Meteo Forecast client — the baseline, no-key provider. ALWAYS requests
// data in the Asia/Manila timezone. Used by the /api/weather Route Handler.

const REVALIDATE_SECONDS = 900; // 15-minute minimum cache.

interface IOpenMeteoCurrent {
  temperature_2m?: number;
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
    "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed with status ${res.status}`);
  }

  const data = (await res.json()) as IOpenMeteoResponse;
  const current = data.current ?? {};

  return {
    location: loc,
    current: {
      temperatureC: Math.round(current.temperature_2m ?? 0),
      weatherCode: current.weather_code ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      rainChance: current.precipitation_probability ?? 0,
      windSpeedKmh: Math.round(current.wind_speed_10m ?? 0),
    },
    forecast: buildForecast(data.daily),
    source: "Open-Meteo",
    fetchedAt: new Date().toISOString(),
  };
}
