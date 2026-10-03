"use client";

import { useCallback, useState } from "react";

import type { ILocation } from "@/types";

const GEO_DENIED =
  "Hindi ma-access ang iyong lokasyon. Pakipili na lang sa paghahanap.";

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function defaultLocation(): ILocation {
  const name = process.env.NEXT_PUBLIC_DEFAULT_LOCATION ?? "Calamba, Laguna";
  const [defName, defProvince] = name.split(",").map((s) => s.trim());
  return {
    name: defName || "Calamba",
    province: defProvince || "Laguna",
    lat: parseNumber(process.env.NEXT_PUBLIC_DEFAULT_LAT, 14.2117),
    lon: parseNumber(process.env.NEXT_PUBLIC_DEFAULT_LON, 121.1653),
    region: process.env.NEXT_PUBLIC_DEFAULT_REGION ?? undefined,
  };
}

export interface IUseLocationResult {
  location: ILocation;
  setLocation: (location: ILocation) => void;
  useMyLocation: () => void;
  geoError: string | null;
  isLocating: boolean;
}

/**
 * Manages the currently selected location. Defaults to the env-configured
 * location (Calamba, Laguna). `useMyLocation` uses the browser Geolocation API
 * and surfaces a Filipino error message when permission is denied.
 */
export function useLocation(): IUseLocationResult {
  const [location, setLocation] = useState<ILocation>(defaultLocation);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const useMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError(GEO_DENIED);
      return;
    }

    setGeoError(null);
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          name: "Aking Lokasyon",
          province: "",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setGeoError(GEO_DENIED);
        setIsLocating(false);
      },
    );
  }, []);

  return { location, setLocation, useMyLocation, geoError, isLocating };
}
