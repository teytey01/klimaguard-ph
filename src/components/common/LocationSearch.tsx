"use client";

import { useEffect, useRef, useState } from "react";

import type { IGeocodingResponse, IGeocodingResult, ILocation } from "@/types";

export interface ILocationSearchProps {
  onSelect: (location: ILocation) => void;
  onUseMyLocation: () => void;
  isLocating?: boolean;
  geoError?: string | null;
}

const DEBOUNCE_MS = 300;
const EMPTY_HINT = "Maghanap ng lungsod o bayan sa Pilipinas.";
const NO_RESULTS = "Walang nahanap. Subukan ang ibang pangalan.";

function toLocation(result: IGeocodingResult): ILocation {
  return {
    name: result.name,
    province: result.admin1,
    lat: result.lat,
    lon: result.lon,
  };
}

export default function LocationSearch({
  onSelect,
  onUseMyLocation,
  isLocating = false,
  geoError = null,
}: ILocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IGeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      // Debounced reset so no state update runs synchronously in the effect.
      const resetHandle = setTimeout(() => {
        setResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(resetHandle);
    }

    const searchingHandle = setTimeout(() => setIsSearching(true), 0);
    const handle = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        try {
          const res = await fetch(
            `/api/geocoding?q=${encodeURIComponent(trimmed)}`,
            { signal: controller.signal },
          );
          if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
          }
          const data = (await res.json()) as IGeocodingResponse;
          setResults(data.results);
        } catch {
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(searchingHandle);
      clearTimeout(handle);
    };
  }, [query]);

  function handleSelect(result: IGeocodingResult) {
    onSelect(toLocation(result));
    setQuery(`${result.name}, ${result.admin1}`);
    setIsOpen(false);
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="location-search" className="sr-only">
            Maghanap ng lokasyon
          </label>
          <input
            id="location-search"
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Maghanap ng lungsod o bayan..."
            autoComplete="off"
            className="w-full rounded-lg border border-teal/40 bg-card px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          />

          {isOpen && query.trim().length >= 2 ? (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-teal/20 bg-card shadow-lg">
              {isSearching ? (
                <ul className="divide-y divide-teal/10">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="px-4 py-3">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
                    </li>
                  ))}
                </ul>
              ) : results.length > 0 ? (
                <ul className="max-h-64 divide-y divide-teal/10 overflow-y-auto">
                  {results.map((result) => (
                    <li key={`${result.lat},${result.lon}`}>
                      <button
                        type="button"
                        onClick={() => handleSelect(result)}
                        className="block w-full px-4 py-3 text-left text-sm text-text transition-colors hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2"
                      >
                        {result.name}, {result.admin1}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-text-muted">{NO_RESULTS}</p>
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={isLocating}
          className="shrink-0 rounded-lg border border-teal bg-card px-4 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLocating ? "Hinahanap..." : "📍 Gamitin ang aking lokasyon"}
        </button>
      </div>

      {geoError ? (
        <p className="mt-2 text-sm text-text-muted">{geoError}</p>
      ) : query.trim().length < 2 ? (
        <p className="mt-2 text-xs text-text-muted">{EMPTY_HINT}</p>
      ) : null}
    </div>
  );
}
