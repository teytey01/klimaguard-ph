"use client";

import { useCallback, useEffect, useState } from "react";
import type { IAlertState } from "@/types";

const CACHE_KEY = "klimaguard:lastAlertState";
// 15-min freshness convention: a cachedAt older than this is treated as stale
// (still shown offline, but refetch is always allowed).
const FRESHNESS_MS = 900000;

interface ICachedAlertState {
  state: IAlertState;
  cachedAt: number;
}

function isStale(cachedAt: number): boolean {
  return Date.now() - cachedAt > FRESHNESS_MS;
}

interface IUseAlertsResult {
  state: IAlertState | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function readCache(): ICachedAlertState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as ICachedAlertState;
  } catch {
    return null;
  }
}

function writeCache(state: IAlertState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: ICachedAlertState = { state, cachedAt: Date.now() };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures (quota, privacy mode); cache is best-effort.
  }
}

export function useAlerts(): IUseAlertsResult {
  const [state, setState] = useState<IAlertState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<number>(0);

  const refetch = useCallback(() => {
    setTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      if (active) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch("/api/alerts");
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = (await res.json()) as IAlertState;
        if (!active) {
          return;
        }
        setState(data);
        writeCache(data);
      } catch {
        if (!active) {
          return;
        }
        const cached = readCache();
        if (cached) {
          setState(cached.state);
          setError(
            isStale(cached.cachedAt)
              ? "Hindi makakonekta. Ipinapakita ang huling nalamang alerto (maaaring luma na)."
              : "Hindi makakonekta. Ipinapakita ang huling nalamang alerto."
          );
        } else {
          setError("Hindi makakonekta sa serbisyo ng alerto. Subukang muli.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [trigger]);

  return { state, loading, error, refetch };
}
