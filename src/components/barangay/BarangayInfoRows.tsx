"use client";

import type { IBarangayInfoRow } from "@/lib/barangay";

export interface IBarangayInfoRowsProps {
  rows: IBarangayInfoRow[];
}

/** Compact "label / value" rows used by the small M4–M11 panels. */
export default function BarangayInfoRows({ rows }: IBarangayInfoRowsProps) {
  return (
    <ul className="space-y-1.5">
      {rows.map((row) => (
        <li key={row.label} className="rounded-lg bg-cmd-tile px-3 py-2 text-sm">
          <p className="text-[11px] font-semibold uppercase text-cmd-muted">{row.label}</p>
          <p
            className={
              row.tone === "alert"
                ? "font-semibold text-alert"
                : row.tone === "muted"
                  ? "text-cmd-muted"
                  : "text-cmd-heading"
            }
          >
            {row.value}
          </p>
        </li>
      ))}
    </ul>
  );
}
