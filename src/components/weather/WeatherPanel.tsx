"use client";

import { LocationSearch, useLanguage } from "@/components/common";
import ForecastStrip from "@/components/weather/ForecastStrip";
import WeatherCard from "@/components/weather/WeatherCard";
import { useLocation, useWeather } from "@/hooks";

export interface IWeatherPanelProps {
  className?: string;
}

export default function WeatherPanel({ className }: IWeatherPanelProps) {
  const { t } = useLanguage();
  const { location, setLocation, useMyLocation, geoError, isLocating } =
    useLocation();
  const { data, isLoading, error, refetch } = useWeather(location);

  return (
    <div className={`flex w-full flex-col gap-4 ${className ?? ""}`}>
      <LocationSearch
        onSelect={setLocation}
        onUseMyLocation={useMyLocation}
        isLocating={isLocating}
        geoError={geoError}
      />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-44 w-full animate-pulse rounded-2xl bg-card" />
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 w-24 shrink-0 animate-pulse rounded-xl bg-card"
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-card p-6 text-center">
          <p className="text-sm text-text">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-lg border border-teal bg-card px-4 py-2 text-sm font-semibold text-teal transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            Subukan ulit
          </button>
        </div>
      ) : data ? (
        <>
          <WeatherCard data={data} />
          <ForecastStrip days={data.forecast} pagasaTenDay={data.pagasaTenDay} />
        </>
      ) : (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-text-muted">
          {t("weather.searchPrompt")}
        </p>
      )}
    </div>
  );
}
