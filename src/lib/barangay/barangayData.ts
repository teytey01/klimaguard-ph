import type {
  IBarangayOpsState,
  IBarangayReliefId,
  IBarangayView,
  IconName,
} from "@/types";
import type { ITranslationKey } from "@/lib/i18n";

// Static config + initial demo data for the Barangay Official dashboard
// (the ONE static data file; scope-reduced: max 2–3 items per list). Figures
// follow the Stitch "Barangay San Roque, Santa Cruz" screen and match the
// municipal dashboard (San Roque Central Gym 300/400, 1,240 at risk in
// Purok 3 & 4, 2 resolved / 0 pending reports, Seawall 85%). Facility names
// are templated on the official's own barangay. Demo content strings are
// Filipino-only by design; UI labels go through t().

/** Citizen hotline shown on the incident card (demo). */
export const BARANGAY_HOTLINE = "0917-555-ROQUE";

export const PUROK_OPTIONS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"];

export interface IBarangayTabDef {
  id: IBarangayView;
  labelKey: ITranslationKey;
  icon: IconName;
}

/** The six design tabs (top tab bar). */
export const BARANGAY_TABS: IBarangayTabDef[] = [
  { id: "ops", labelKey: "brgy.tab.ops", icon: "chart" },
  { id: "evacuation", labelKey: "brgy.tab.evacuation", icon: "home" },
  { id: "tanod", labelKey: "brgy.tab.tanod", icon: "users" },
  { id: "river", labelKey: "brgy.tab.river", icon: "water" },
  { id: "relief", labelKey: "brgy.tab.relief", icon: "warehouse" },
  { id: "reports", labelKey: "brgy.tab.reports", icon: "scroll" },
];

/** Sidebar "Active Modules" (Barangay Official scope, v6 matrix). */
export const BARANGAY_MODULES: IBarangayTabDef[] = [
  { id: "ops", labelKey: "brgy.mod.ops", icon: "command" },
  { id: "chat", labelKey: "brgy.mod.chat", icon: "radio" },
  { id: "weather", labelKey: "brgy.mod.weather", icon: "cloud" },
  { id: "drrm", labelKey: "brgy.mod.drrm", icon: "alert-triangle" },
  { id: "safety", labelKey: "brgy.mod.safety", icon: "broadcast" },
  { id: "agriculture", labelKey: "brgy.mod.agriculture", icon: "sprout" },
  { id: "planning", labelKey: "brgy.mod.planning", icon: "map" },
  { id: "analytics", labelKey: "brgy.mod.analytics", icon: "chart" },
  { id: "transparency", labelKey: "brgy.mod.transparency", icon: "building" },
  { id: "audit", labelKey: "brgy.mod.audit", icon: "lock" },
];

export const RELIEF_LABEL_KEY: Record<IBarangayReliefId, ITranslationKey> = {
  food: "brgy.relief.food",
  water: "brgy.relief.water",
  firstAid: "brgy.relief.firstAid",
};

/** Pre-disaster checklist (RA 10121), label key per item id. */
export const CHECKLIST_LABEL_KEY: Record<string, ITranslationKey> = {
  broadcast: "brgy.check.broadcast",
  preemptive: "brgy.check.preemptive",
  report: "brgy.check.report",
};

/** Static Power & Telecom card rows (demo telemetry). */
export interface IConnectivityRow {
  labelKey: ITranslationKey;
  detailKey: ITranslationKey;
  value: string;
}

export const CONNECTIVITY_ROWS: IConnectivityRow[] = [
  { labelKey: "brgy.conn.lora", detailKey: "brgy.conn.loraDetail", value: "OPERATIONAL" },
  { labelKey: "brgy.conn.solar", detailKey: "brgy.conn.solarDetail", value: "94%" },
  { labelKey: "brgy.conn.sat", detailKey: "brgy.conn.satDetail", value: "READY" },
];

/** A compact "label · value" row for the small M4/M5/M6/M10 panels. */
export interface IBarangayInfoRow {
  /** Demo content, Filipino-only. */
  label: string;
  value: string;
  tone?: "normal" | "alert" | "muted";
}

/** M5 area-wide advisory rows (demo, Filipino). */
export const AGRI_ROWS: IBarangayInfoRow[] = [
  { label: "Babala sa peste (buong barangay)", value: "Rice black bug — katamtaman sa mabababang palayan" },
  { label: "El Niño / La Niña (pagpapayo)", value: "La Niña watch — irekomenda ang flood-tolerant na palay" },
  { label: "Payo sa anihan (view only)", value: "Purok 5: anihin sa loob ng 3–5 araw bago ang susunod na ulan" },
];

/** M4 community evacuation + DANA guide steps (demo, Filipino). */
export const SAFETY_STEPS: string[] = [
  "Unahing ilikas ang Senior/PWD/sanggol sa Purok 3 at 4.",
  "I-rehistro ang bawat pamilya pagdating sa evacuation center.",
  "Pagkatapos ng bagyo: bilangin ang casualties at nasirang bahay, isumite ang DANA sa loob ng 3 oras.",
];

/** M6 barangay hazard profile + SGLG (demo, Filipino). */
export const PLANNING_ROWS: IBarangayInfoRow[] = [
  { label: "Hazard profile", value: "Baha: MATAAS · Bagyo: katamtaman · Landslide: mababa", tone: "alert" },
  { label: "Climate projection (2050)", value: "+1.0–1.2°C · ulan sa tag-ulan +10–20%" },
  { label: "SGLG compliance (sariling barangay)", value: "4/5 indicators pasado (80%)" },
];

/** M6 next barangay deadline (days from today). */
export const NEXT_DEADLINE = { label: "Taunang update ng BDRRM Plan", daysFromNow: 15 };

/** M10 barangay analytics static rows (demo, Filipino). */
export const ANALYTICS_ROWS: IBarangayInfoRow[] = [
  { label: "Panganib sa baha (barangay)", value: "85/100 — Purok 3 at 4", tone: "alert" },
  { label: "Huling malaking sakuna", value: "2024 Bagyong Kristine — 214 pamilya" },
];

/** M11: projects in the same municipality. Only own-barangay rows are editable. */
const OTHER_PROJECT = {
  id: "other-1",
  name: "Pagsawitan Evacuation Center Retrofit",
  barangay: "Pagsawitan",
  completionPct: 60,
  status: "ongoing" as const,
  editable: false,
};

/** Municipality center fallback (Santa Cruz, Laguna). */
export const DEFAULT_BARANGAY_CENTER = { lat: 14.2792, lon: 121.4166 };

/** Relative-time translation key + count for an ISO timestamp. */
export function agoKey(
  iso: string,
  now: Date,
): { key: ITranslationKey; n: number } {
  const secs = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (secs < 60) {
    return { key: "brgy.ago.seconds", n: secs };
  }
  if (secs < 3600) {
    return { key: "brgy.ago.minutes", n: Math.floor(secs / 60) };
  }
  if (secs < 86_400) {
    return { key: "brgy.ago.hours", n: Math.floor(secs / 3600) };
  }
  return { key: "brgy.ago.days", n: Math.floor(secs / 86_400) };
}

/** "14:15" in Asia/Manila. */
export function manilaTime(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Manila",
  }).format(new Date(iso));
}

function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

/** Fresh initial operations state for one barangay (in memory). */
export function createInitialBarangayOps(
  barangay: string,
  now: Date = new Date(),
): IBarangayOpsState {
  // 6-hour gauge trend 2.20 → 3.10 m (+0.15 m/hr), one reading per hour.
  const levels = [2.2, 2.38, 2.55, 2.7, 2.85, 2.98, 3.1];
  const history = levels.map((levelM, i) => ({
    at: minutesAgo(now, (levels.length - 1 - i) * 60),
    levelM,
  }));
  const todayCount = new Date(now);
  todayCount.setUTCHours(6, 15, 0, 0); // 14:15 PST today

  return {
    barangay,
    centers: [
      { id: "gym", name: `${barangay} Central Gym`, purok: "Purok 1", occupancy: 300, capacity: 400, active: true },
      { id: "elem", name: `${barangay} Elem.`, purok: "Purok 2", occupancy: 0, capacity: 250, active: false },
    ],
    teams: [
      { id: "alfa", name: "Team Alfa", members: 3, status: "patrol", assignment: "Patrol Purok 3 Dike", purok: "Purok 3", updatedAt: minutesAgo(now, 45) },
      { id: "bravo", name: "Team Bravo", members: 3, status: "patrol", assignment: "Patrol Purok 4 Spillway", purok: "Purok 4", updatedAt: minutesAgo(now, 45) },
      { id: "charlie-delta", name: "Team Charlie & Delta", members: 6, status: "security", assignment: "Gym security & logistics", purok: "Purok 1", updatedAt: minutesAgo(now, 90) },
    ],
    river: {
      id: "R-04",
      station: "Santa Cruz River Bank – Sector B",
      levelM: 3.1,
      history,
      normalMaxM: 3.5,
      alertM: 4.5,
      criticalM: 5.5,
      lastPingAt: new Date(now.getTime() - 12_000).toISOString(),
    },
    relief: [
      { id: "food", quantity: 450, unit: "packs", note: "DSWD family food packs · Barangay Hall Cache" },
      { id: "water", quantity: 600, unit: "gal", note: "Ligtas inumin" },
      { id: "firstAid", quantity: 35, unit: "kits", note: "Handa sa triage" },
    ],
    stockCount: { at: todayCount.toISOString(), by: "Kagawad on duty" },
    distributions: [
      { id: "dist-1", purok: "Purok 3", familiesServed: 60, familiesTarget: 142, packsGiven: 60, at: minutesAgo(now, 120) },
    ],
    reports: [
      {
        id: "rep-1",
        title: "Clogged Culvert & Minor Runoff",
        location: "Purok 3, malapit sa kapilya",
        status: "resolved",
        response: "Nalinis ng Tanod Team Alfa.",
        reportedAt: minutesAgo(now, 75),
        resolvedAt: minutesAgo(now, 30),
      },
      {
        id: "rep-2",
        title: "Fallen Acacia Branch obstructing alleyway",
        location: "Purok 2 access road",
        status: "resolved",
        response: "Inalis ng chainsaw crew.",
        reportedAt: minutesAgo(now, 180),
        resolvedAt: minutesAgo(now, 120),
      },
    ],
    checklist: Object.keys(CHECKLIST_LABEL_KEY).map((id) => ({ id, done: false })),
    checklistActivatedAt: null,
    dana: {
      startedAt: null,
      submittedAt: null,
      affectedFamilies: 260,
      affectedPersons: 1240,
      dead: 0,
      injured: 0,
      missing: 0,
      housesDamaged: 0,
      agricultureDamagePhp: 185_000,
      needs: "",
      sitrep: null,
    },
    qrf: {
      bdrrmf: 2_000_000,
      allocated: 600_000,
      entries: [
        { id: "qrf-1", label: "Relief pack restock (DSWD augmentation)", amount: 45_000, at: minutesAgo(now, 300) },
      ],
    },
    population: [
      { purok: "Purok 3", label: "Riverside", individuals: 680, families: 142, vulnerable: 104, evacuated: 180, unaccounted: 0 },
      { purok: "Purok 4", label: "Flood Basin", individuals: 560, families: 118, vulnerable: 90, evacuated: 120, unaccounted: 0 },
    ],
    projects: [
      { id: "seawall", name: `${barangay} Seawall`, barangay, completionPct: 85, status: "ongoing", editable: true },
      { id: "drainage", name: `${barangay} Drainage Upgrade`, barangay, completionPct: 40, status: "ongoing", editable: true },
      OTHER_PROJECT,
    ],
    cdraStepsDone: 3,
    lccapSectionsDone: 2,
    cropDamagePhp: 185_000,
    audit: [],
  };
}
