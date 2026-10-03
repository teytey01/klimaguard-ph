"use client";

import CropAdvisoryCard from "@/components/agriculture/CropAdvisoryCard";
import { LocationSearch } from "@/components/common";
import { useLocation, useWeather } from "@/hooks";
import { buildCropAdvisories, DEMO_ENSO_PHASE } from "@/lib/agriculture";
import type { IAdvisoryInput } from "@/types";

export interface IAgriculturePanelProps {
  className?: string;
}

/**
 * Live agricultural advisory surface. Maps the selected location's Open-Meteo
 * weather (via useWeather) into the pure advisory derivation and renders a
 * CropAdvisoryCard per PH crop. Mirrors WeatherPanel's skeleton /
 * Filipino error+retry / empty states.
 */
export default function AgriculturePanel({
  className,
}: IAgriculturePanelProps) {
  const { location, setLocation, useMyLocation, geoError, isLocating } =
    useLocation();
  const { data, isLoading, error, refetch } = useWeather(location);

  const advisories = data
    ? buildCropAdvisories({
        current: data.current,
        forecast: data.forecast,
        ensoPhase: DEMO_ENSO_PHASE,
      } satisfies IAdvisoryInput)
    : [];

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
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 w-full animate-pulse rounded-2xl bg-card"
            />
          ))}
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
      ) : advisories.length > 0 ? (
        <div className="flex flex-col gap-4">
          {advisories.map((advisory) => (
            <CropAdvisoryCard key={advisory.crop} advisory={advisory} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-text-muted">
          Maghanap ng lokasyon para makita ang payo sa pagsasaka.
        </p>
      )}
    </div>
  );
}
