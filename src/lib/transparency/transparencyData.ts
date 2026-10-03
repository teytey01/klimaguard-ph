import type {
  IBudgetCategory,
  ITransparencyData,
  ITransparencyEmbedData,
} from "@/types";

// Static, demo-grade DRRM fund data for the M11 Transparency Tracker. No live
// COA/DBM/DILG feed is wired yet, so these are realistic-looking mock figures
// intentionally hardcoded for the hackathon demo. Figures only — no political
// commentary (G03). Attribution is REQUIRED on every surface.

/** Shared attribution — rendered on every transparency surface (REQUIRED). */
export const TRANSPARENCY_SOURCE = "Batay sa datos ng COA/DBM/DILG";

/** Graceful Filipino fallback message for the route handler. */
export const TRANSPARENCY_ERROR =
  "Hindi makuha ang datos ng DRRM funds ngayon. Pakisubukan ulit.";

/** Default province when none is supplied. */
export const DEFAULT_TRANSPARENCY_PROVINCE = "Leyte";

/** Filipino labels for each DRRM spending pillar. */
export const CATEGORY_LABELS: Record<IBudgetCategory, string> = {
  prevention: "Pag-iwas",
  preparedness: "Paghahanda",
  response: "Pagtugon",
  recovery: "Pagbangon",
};

const FISCAL_YEAR = 2024;

/** Demo DRRM datasets keyed by lowercased province name. */
const TRANSPARENCY_DATASETS: Record<string, ITransparencyData> = {
  leyte: {
    province: "Leyte",
    fiscalYear: FISCAL_YEAR,
    totalAllocated: 420_000_000,
    totalSpent: 287_500_000,
    lines: [
      {
        category: "prevention",
        label: CATEGORY_LABELS.prevention,
        allocated: 120_000_000,
        spent: 82_000_000,
      },
      {
        category: "preparedness",
        label: CATEGORY_LABELS.preparedness,
        allocated: 110_000_000,
        spent: 95_500_000,
      },
      {
        category: "response",
        label: CATEGORY_LABELS.response,
        allocated: 130_000_000,
        spent: 78_000_000,
      },
      {
        category: "recovery",
        label: CATEGORY_LABELS.recovery,
        allocated: 60_000_000,
        spent: 32_000_000,
      },
    ],
    timeline: [
      {
        date: "2024-01-15",
        label: "Paglabas ng taunang DRRM fund",
        amount: 420_000_000,
        type: "release",
      },
      {
        date: "2024-03-22",
        label: "Pagbili ng early warning equipment",
        amount: 48_000_000,
        type: "disbursement",
      },
      {
        date: "2024-06-10",
        label: "Pondo para sa flood control drills",
        amount: 61_500_000,
        type: "disbursement",
      },
      {
        date: "2024-09-05",
        label: "Relief operations matapos ang bagyo",
        amount: 78_000_000,
        type: "disbursement",
      },
    ],
    source: TRANSPARENCY_SOURCE,
    fetchedAt: "",
  },
  samar: {
    province: "Samar",
    fiscalYear: FISCAL_YEAR,
    totalAllocated: 310_000_000,
    totalSpent: 164_000_000,
    lines: [
      {
        category: "prevention",
        label: CATEGORY_LABELS.prevention,
        allocated: 85_000_000,
        spent: 51_000_000,
      },
      {
        category: "preparedness",
        label: CATEGORY_LABELS.preparedness,
        allocated: 80_000_000,
        spent: 52_000_000,
      },
      {
        category: "response",
        label: CATEGORY_LABELS.response,
        allocated: 95_000_000,
        spent: 44_000_000,
      },
      {
        category: "recovery",
        label: CATEGORY_LABELS.recovery,
        allocated: 50_000_000,
        spent: 17_000_000,
      },
    ],
    timeline: [
      {
        date: "2024-01-18",
        label: "Paglabas ng taunang DRRM fund",
        amount: 310_000_000,
        type: "release",
      },
      {
        date: "2024-04-02",
        label: "Pagsasanay sa evacuation at rescue",
        amount: 38_000_000,
        type: "disbursement",
      },
      {
        date: "2024-07-19",
        label: "Pagpapatibay ng evacuation centers",
        amount: 52_000_000,
        type: "disbursement",
      },
      {
        date: "2024-10-11",
        label: "Pondo para sa post-disaster recovery",
        amount: 44_000_000,
        type: "disbursement",
      },
    ],
    source: TRANSPARENCY_SOURCE,
    fetchedAt: "",
  },
};

/** Whole-number utilization percentage (spent / allocated), clamped to 0–100. */
export function utilizationPct(spent: number, allocated: number): number {
  if (allocated <= 0) {
    return 0;
  }
  const pct = Math.round((spent / allocated) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Return the demo DRRM dataset for a province (case-insensitive), defaulting to
 * Leyte when unknown/blank. `fetchedAt` is stamped at call time.
 */
export function getTransparencyData(province?: string | null): ITransparencyData {
  const key = (province ?? "").trim().toLowerCase();
  const base =
    TRANSPARENCY_DATASETS[key] ??
    TRANSPARENCY_DATASETS[DEFAULT_TRANSPARENCY_PROVINCE.toLowerCase()];

  return { ...base, fetchedAt: new Date().toISOString() };
}

/** Collapse a full payload into the minimal chat-embed summary. */
export function toTransparencyEmbed(
  data: ITransparencyData,
): ITransparencyEmbedData {
  return {
    province: data.province,
    totalAllocated: data.totalAllocated,
    totalSpent: data.totalSpent,
    utilizationPct: utilizationPct(data.totalSpent, data.totalAllocated),
    source: data.source,
  };
}
