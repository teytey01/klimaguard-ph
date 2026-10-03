"use client";

import { useEffect, useState } from "react";

/**
 * The current time, re-rendered every `intervalMs` (default 1 s). Used for
 * live countdowns (DANA 3-hour deadline) and "x min ago" labels.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
