"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/components/common";
import { appendAudit, createInitialBarangayOps } from "@/lib/barangay";
import type { IBarangayAuditCategory, IBarangayOpsState } from "@/types";

export interface IBarangayOpsProviderProps {
  /** The official's own barangay (from the server session). */
  barangay: string;
  children: React.ReactNode;
}

interface IBarangayOpsContextValue {
  state: IBarangayOpsState;
  /** "Name (Barangay Official)" — the WHO of every audit entry. */
  actor: string;
  /**
   * Apply a pure state transition and record it in the audit trail.
   * Pass `audit: null` for unaudited edits (e.g. typing in a draft field).
   */
  update: (
    fn: (state: IBarangayOpsState, now: Date) => IBarangayOpsState,
    audit: { what: string; category: IBarangayAuditCategory } | null,
  ) => void;
  /** Restore the initial demo data (audited). */
  reset: () => void;
}

const BarangayOpsContext = createContext<IBarangayOpsContextValue | undefined>(
  undefined,
);

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Barangay operations state: React context + useState, in memory only
 * (demo-grade; resets on reload). Every mutation goes through a pure
 * function in lib/barangay and appends a WHO/WHEN/WHAT audit entry.
 */
export default function BarangayOpsProvider({
  barangay,
  children,
}: IBarangayOpsProviderProps) {
  const { session } = useAuth();
  const actor = `${session?.name || "Barangay Official"} (Barangay Official)`;
  const [state, setState] = useState<IBarangayOpsState>(() =>
    createInitialBarangayOps(barangay),
  );

  const update = useCallback<IBarangayOpsContextValue["update"]>(
    (fn, audit) => {
      setState((prev) => {
        const now = new Date();
        const next = fn(prev, now);
        if (!audit || next === prev) {
          return next;
        }
        return appendAudit(next, actor, audit.what, audit.category, now, newId());
      });
    },
    [actor],
  );

  const reset = useCallback(() => {
    const now = new Date();
    setState(
      appendAudit(
        createInitialBarangayOps(barangay, now),
        actor,
        "I-reset ang demo data ng barangay",
        "system",
        now,
        newId(),
      ),
    );
  }, [actor, barangay]);

  const value = useMemo(() => ({ state, actor, update, reset }), [state, actor, update, reset]);

  return (
    <BarangayOpsContext.Provider value={value}>{children}</BarangayOpsContext.Provider>
  );
}

/** Read the barangay ops context. Throws (in Filipino) outside the provider. */
export function useBarangayOps(): IBarangayOpsContextValue {
  const context = useContext(BarangayOpsContext);
  if (context === undefined) {
    throw new Error(
      "Kailangang gamitin ang useBarangayOps sa loob ng BarangayOpsProvider.",
    );
  }
  return context;
}

/** Unique id helper for list entries created by panels. */
export { newId as newBarangayId };
