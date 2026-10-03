"use client";

import { useCallback, useEffect, useState } from "react";
import { MUN_LOCATION } from "./dashboardData";
import { MUN_WEATHER_ERROR, fetchMunicipalWeather, type IMunWeather } from "./municipalWeather";

export interface IUseMunicipalWeatherResult {
  data: IMunWeather | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

/** Calamba full forecast (10-day / hourly / soil) with retry. */
export function useMunicipalWeather(): IUseMunicipalWeatherResult {
  const [data, setData] = useState<IMunWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await fetchMunicipalWeather(MUN_LOCATION, attempt > 0);
        if (active) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : MUN_WEATHER_ERROR);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  return { data, isLoading, error, retry };
}
