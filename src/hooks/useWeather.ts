"use client";

import { useCallback, useEffect, useState } from "react";

import type { ILocation, IWeatherData } from "@/types";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute minimum client cache.
const WEATHER_ERROR = "Hindi makuha ang panahon ngayon. Pakisubukan ulit.";

interface ICacheEntry {
  data: IWeatherData;
  ts: number;
}

// Module-level cache shared across hook instances, keyed by "lat,lon".
const weatherCache = new Map<string, ICacheEntry>();

function cacheKey(location: ILocation): string {
  return `${location.lat},${location.lon}`;
}

export interface IUseWeatherResult {
  data: IWeatherData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches weather for `location` from /api/weather with a 15-minute client-side
 * cache. `refetch` bypasses the cache for a manual retry.
 */
export function useWeather(location: ILocation): IUseWeatherResult {
  const [data, setData] = useState<IWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (loc: ILocation, force: boolean) => {
      const key = cacheKey(loc);
      const cached = weatherCache.get(key);
      if (!force && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        setData(cached.data);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          lat: String(loc.lat),
          lon: String(loc.lon),
          name: loc.name,
          province: loc.province,
        });
        const res = await fetch(`/api/weather?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const payload = (await res.json()) as IWeatherData;
        weatherCache.set(key, { data: payload, ts: Date.now() });
        setData(payload);
      } catch {
        setError(WEATHER_ERROR);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;
    // Defer to a microtask so state updates (including the synchronous
    // cache-hit path) run outside the effect body, not during render.
    void Promise.resolve().then(() => {
      if (active) {
        void load(location, false);
      }
    });
    return () => {
      active = false;
    };
  }, [load, location]);

  const refetch = useCallback(() => {
    void load(location, true);
  }, [load, location]);

  return { data, isLoading, error, refetch };
}
