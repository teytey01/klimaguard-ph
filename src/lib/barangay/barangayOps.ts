import type {
  IBarangayAuditCategory,
  IBarangayDanaForm,
  IBarangayDistribution,
  IBarangayEvacCenter,
  IBarangayEvacStatus,
  IBarangayIncidentReport,
  IBarangayOpsState,
  IBarangayPopulation,
  IBarangayProjectStatus,
  IBarangayQrf,
  IBarangayReliefId,
  IBarangayRiverReading,
  IBarangayRiverSensor,
  IBarangayRiverStatus,
  IBarangayTeamStatus,
} from "@/types";

// Pure Barangay Official operations logic. Every mutation returns a NEW state
// and never touches storage or React, so it is unit-tested with `node --test`.
// Keep this file self-contained: type-only imports (erased at runtime).

/** Barangay DANA must reach the MDRRMC within 3 hours (v6 matrix, M7). */
export const DANA_DEADLINE_MS = 3 * 60 * 60 * 1000;

/** Audit trail cap (newest first). */
export const AUDIT_LIMIT = 200;

/** River history kept for the trend/sparkline. */
export const RIVER_HISTORY_LIMIT = 12;

// --- Generic helpers ---

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Integer percentage (0–100) of part / total; 0 when total is 0. */
export function percent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return clampInt((part / total) * 100, 0, 100);
}

/**
 * Snap a percentage to a static Tailwind width class. Classes are listed
 * literally so Tailwind v4's scanner generates them (no inline styles):
 * w-0 w-[5%] w-[10%] w-[15%] w-[20%] w-[25%] w-[30%] w-[35%] w-[40%] w-[45%]
 * w-[50%] w-[55%] w-[60%] w-[65%] w-[70%] w-[75%] w-[80%] w-[85%] w-[90%]
 * w-[95%] w-full
 */
export function widthClass(pct: number): string {
  const snapped = Math.min(100, Math.max(0, Math.round(pct / 5) * 5));
  if (snapped === 0) {
    return "w-0";
  }
  if (snapped === 100) {
    return "w-full";
  }
  return `w-[${snapped}%]`;
}

// --- Audit ---

/** Prepend an audit entry (WHO / WHEN / WHAT), capped at AUDIT_LIMIT. */
export function appendAudit(
  state: IBarangayOpsState,
  who: string,
  what: string,
  category: IBarangayAuditCategory,
  now: Date,
  id: string,
): IBarangayOpsState {
  const entry = { id, at: now.toISOString(), who, what, category };
  return { ...state, audit: [entry, ...state.audit].slice(0, AUDIT_LIMIT) };
}

// --- Evacuation centers (own centers only) ---

/** standby (inactive) · full (≥100%) · near-full (≥80%) · open. */
export function evacStatus(center: IBarangayEvacCenter): IBarangayEvacStatus {
  if (!center.active) {
    return "standby";
  }
  const ratio = center.capacity > 0 ? center.occupancy / center.capacity : 1;
  if (ratio >= 1) {
    return "full";
  }
  if (ratio >= 0.8) {
    return "near-full";
  }
  return "open";
}

/** Set a center's occupancy, clamped to 0..capacity. */
export function setOccupancy(
  state: IBarangayOpsState,
  id: string,
  occupancy: number,
): IBarangayOpsState {
  return {
    ...state,
    centers: state.centers.map((c) =>
      c.id === id ? { ...c, occupancy: clampInt(occupancy, 0, c.capacity) } : c,
    ),
  };
}

/** Open a standby center, or close an active one (only when empty). */
export function toggleCenterActive(
  state: IBarangayOpsState,
  id: string,
): IBarangayOpsState {
  return {
    ...state,
    centers: state.centers.map((c) => {
      if (c.id !== id) {
        return c;
      }
      if (c.active && c.occupancy > 0) {
        return c; // can't close a shelter with evacuees inside
      }
      return { ...c, active: !c.active };
    }),
  };
}

// --- Tanod / BDRRMC teams ---

/** Dispatch a team to a purok with an assignment. */
export function dispatchTeam(
  state: IBarangayOpsState,
  teamId: string,
  purok: string,
  assignment: string,
  now: Date,
): IBarangayOpsState {
  return {
    ...state,
    teams: state.teams.map((t) =>
      t.id === teamId
        ? {
            ...t,
            status: "dispatched",
            purok,
            assignment: assignment.trim() || t.assignment,
            updatedAt: now.toISOString(),
          }
        : t,
    ),
  };
}

export function setTeamStatus(
  state: IBarangayOpsState,
  teamId: string,
  status: IBarangayTeamStatus,
  now: Date,
): IBarangayOpsState {
  return {
    ...state,
    teams: state.teams.map((t) =>
      t.id === teamId ? { ...t, status, updatedAt: now.toISOString() } : t,
    ),
  };
}

/** Responders on duty (every team not on standby). */
export function activeResponders(state: IBarangayOpsState): number {
  return state.teams
    .filter((t) => t.status !== "standby")
    .reduce((sum, t) => sum + t.members, 0);
}

// --- River telemetry ---

/** normal (< normalMax) · watch (< alert) · alert (< critical) · critical. */
export function riverStatus(sensor: IBarangayRiverSensor): IBarangayRiverStatus {
  if (sensor.levelM < sensor.normalMaxM) {
    return "normal";
  }
  if (sensor.levelM < sensor.alertM) {
    return "watch";
  }
  if (sensor.levelM < sensor.criticalM) {
    return "alert";
  }
  return "critical";
}

/** Log a gauge reading (meters, 0–10), keeping the last RIVER_HISTORY_LIMIT. */
export function logRiverReading(
  state: IBarangayOpsState,
  levelM: number,
  now: Date,
): IBarangayOpsState {
  const level = Math.round(Math.min(10, Math.max(0, levelM)) * 100) / 100;
  const at = now.toISOString();
  const history = [...state.river.history, { at, levelM: level }].slice(
    -RIVER_HISTORY_LIMIT,
  );
  return {
    ...state,
    river: { ...state.river, levelM: level, history, lastPingAt: at },
  };
}

/** Average rise (m/hr) between the first and last reading; 0 if < 2 points. */
export function trendPerHour(history: IBarangayRiverReading[]): number {
  if (history.length < 2) {
    return 0;
  }
  const first = history[0];
  const last = history[history.length - 1];
  const hours =
    (new Date(last.at).getTime() - new Date(first.at).getTime()) / 3_600_000;
  if (hours <= 0) {
    return 0;
  }
  return Math.round(((last.levelM - first.levelM) / hours) * 100) / 100;
}

/** SVG polyline `points` for a sparkline in a w×h box. */
export function sparklinePoints(
  history: IBarangayRiverReading[],
  w: number,
  h: number,
): string {
  if (history.length === 0) {
    return "";
  }
  const levels = history.map((r) => r.levelM);
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  const span = max - min || 1;
  const step = history.length > 1 ? w / (history.length - 1) : 0;
  return levels
    .map((lvl, i) => {
      const x = Math.round(i * step * 10) / 10;
      const y = Math.round((h - ((lvl - min) / span) * h) * 10) / 10;
      return `${x},${y}`;
    })
    .join(" ");
}

// --- Relief goods ---

/** Set an inventory quantity (non-negative int) and stamp the stock count. */
export function setReliefQty(
  state: IBarangayOpsState,
  id: IBarangayReliefId,
  quantity: number,
  who: string,
  now: Date,
): IBarangayOpsState {
  return {
    ...state,
    relief: state.relief.map((r) =>
      r.id === id ? { ...r, quantity: clampInt(quantity, 0, 1_000_000) } : r,
    ),
    stockCount: { at: now.toISOString(), by: who },
  };
}

export interface IDistributionInput {
  purok: string;
  familiesServed: number;
  familiesTarget: number;
  packsGiven: number;
}

export type IDistributionError = "invalid" | "stock";

/** Record a distribution batch and deduct the food packs from inventory. */
export function addDistribution(
  state: IBarangayOpsState,
  input: IDistributionInput,
  now: Date,
  id: string,
): { state: IBarangayOpsState; error: IDistributionError | null } {
  const served = Math.round(input.familiesServed);
  const target = Math.round(input.familiesTarget);
  const packs = Math.round(input.packsGiven);
  if (
    !input.purok ||
    !Number.isFinite(served) ||
    !Number.isFinite(target) ||
    !Number.isFinite(packs) ||
    served <= 0 ||
    target <= 0 ||
    packs <= 0 ||
    served > target
  ) {
    return { state, error: "invalid" };
  }
  const food = state.relief.find((r) => r.id === "food");
  if (!food || packs > food.quantity) {
    return { state, error: "stock" };
  }
  const entry: IBarangayDistribution = {
    id,
    purok: input.purok,
    familiesServed: served,
    familiesTarget: target,
    packsGiven: packs,
    at: now.toISOString(),
  };
  return {
    state: {
      ...state,
      relief: state.relief.map((r) =>
        r.id === "food" ? { ...r, quantity: r.quantity - packs } : r,
      ),
      distributions: [entry, ...state.distributions],
    },
    error: null,
  };
}

// --- Incident reports (own barangay) ---

export function addReport(
  state: IBarangayOpsState,
  title: string,
  location: string,
  now: Date,
  id: string,
): IBarangayOpsState {
  const report: IBarangayIncidentReport = {
    id,
    title: title.trim(),
    location: location.trim(),
    status: "pending",
    reportedAt: now.toISOString(),
  };
  return { ...state, reports: [report, ...state.reports] };
}

export function respondReport(
  state: IBarangayOpsState,
  id: string,
  response: string,
): IBarangayOpsState {
  return {
    ...state,
    reports: state.reports.map((r) =>
      r.id === id && r.status !== "resolved"
        ? { ...r, status: "responded", response: response.trim() }
        : r,
    ),
  };
}

export function resolveReport(
  state: IBarangayOpsState,
  id: string,
  response: string,
  now: Date,
): IBarangayOpsState {
  return {
    ...state,
    reports: state.reports.map((r) =>
      r.id === id
        ? {
            ...r,
            status: "resolved",
            response: response.trim() || r.response,
            resolvedAt: now.toISOString(),
          }
        : r,
    ),
  };
}

/** Pending = not yet resolved (pending + responded). */
export function reportCounts(reports: IBarangayIncidentReport[]): {
  pending: number;
  resolved: number;
} {
  const resolved = reports.filter((r) => r.status === "resolved").length;
  return { pending: reports.length - resolved, resolved };
}

// --- Pre-disaster checklist ---

export function toggleChecklist(
  state: IBarangayOpsState,
  id: string,
): IBarangayOpsState {
  return {
    ...state,
    checklist: state.checklist.map((c) =>
      c.id === id ? { ...c, done: !c.done } : c,
    ),
  };
}

export function activateChecklist(
  state: IBarangayOpsState,
  now: Date,
): IBarangayOpsState {
  if (state.checklistActivatedAt) {
    return state;
  }
  return { ...state, checklistActivatedAt: now.toISOString() };
}

// --- DANA (3-hour deadline) ---

export function startDana(state: IBarangayOpsState, now: Date): IBarangayOpsState {
  if (state.dana.startedAt) {
    return state;
  }
  return {
    ...state,
    dana: { ...state.dana, startedAt: now.toISOString(), submittedAt: null, sitrep: null },
  };
}

export type IDanaPatch = Partial<
  Omit<IBarangayDanaForm, "startedAt" | "submittedAt" | "sitrep">
>;

export function updateDana(
  state: IBarangayOpsState,
  patch: IDanaPatch,
): IBarangayOpsState {
  return { ...state, dana: { ...state.dana, ...patch } };
}

/** Milliseconds left before the 3-hour deadline; negative = overdue. */
export function danaRemainingMs(dana: IBarangayDanaForm, now: Date): number | null {
  if (!dana.startedAt) {
    return null;
  }
  return new Date(dana.startedAt).getTime() + DANA_DEADLINE_MS - now.getTime();
}

/** "hh:mm:ss" for a positive ms value (overdue values use the absolute). */
export function formatCountdown(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

const pesoFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPeso(amount: number): string {
  return pesoFormat.format(amount);
}

function manilaStamp(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

/** Barangay SitRep (BDRRMC → MDRRMC), Filipino, plain text. */
export function buildSitrep(
  state: IBarangayOpsState,
  barangay: string,
  municipality: string,
  now: Date,
): string {
  const d = state.dana;
  const atRisk = state.population.reduce((s, p) => s + p.individuals, 0);
  const evacuated = state.population.reduce((s, p) => s + p.evacuated, 0);
  const unaccounted = state.population.reduce((s, p) => s + p.unaccounted, 0);
  const shelters = state.centers
    .filter((c) => c.active)
    .map((c) => `${c.name} ${c.occupancy}/${c.capacity}`)
    .join("; ");
  const food = state.relief.find((r) => r.id === "food")?.quantity ?? 0;
  const served = state.distributions.reduce((s, x) => s + x.familiesServed, 0);
  const counts = reportCounts(state.reports);
  return [
    `SITUATION REPORT — BDRRMC Barangay ${barangay} → MDRRMC ${municipality}`,
    `Petsa/Oras: ${manilaStamp(now)} (PST)`,
    "",
    "1. APEKTADONG POPULASYON",
    `   Apektadong pamilya: ${d.affectedFamilies} · Apektadong indibidwal: ${d.affectedPersons}`,
    `   Nasa panganib (Purok): ${atRisk} · Nailikas: ${evacuated} · Hindi pa natutunton: ${unaccounted}`,
    "2. EVACUATION CENTERS",
    `   ${shelters || "Walang bukas na evacuation center"}`,
    "3. CASUALTIES",
    `   Patay: ${d.dead} · Sugatan: ${d.injured} · Nawawala: ${d.missing}`,
    "4. PINSALA",
    `   Nasirang bahay: ${d.housesDamaged}`,
    `   Agrikultura: ${formatPeso(d.agricultureDamagePhp)}`,
    "5. RELIEF",
    `   Food packs na natitira: ${food} · Pamilyang napagsilbihan: ${served}`,
    `   Insidente: ${counts.resolved} resolved / ${counts.pending} pending`,
    "6. QUICK RESPONSE FUND",
    `   Nagastos: ${formatPeso(qrfSpent(state.qrf))} · Natitira: ${formatPeso(qrfRemaining(state.qrf))}`,
    "7. MGA PANGANGAILANGAN",
    `   ${d.needs.trim() || "Wala pang naiulat"}`,
  ].join("\n");
}

export type IDanaError = "not-started" | "invalid" | "already-submitted";

/** Validate and submit the DANA; stores the generated SitRep. */
export function submitDana(
  state: IBarangayOpsState,
  barangay: string,
  municipality: string,
  now: Date,
): { state: IBarangayOpsState; error: IDanaError | null } {
  const d = state.dana;
  if (!d.startedAt) {
    return { state, error: "not-started" };
  }
  if (d.submittedAt) {
    return { state, error: "already-submitted" };
  }
  const numbers = [
    d.affectedFamilies,
    d.affectedPersons,
    d.dead,
    d.injured,
    d.missing,
    d.housesDamaged,
    d.agricultureDamagePhp,
  ];
  if (
    numbers.some((n) => !Number.isFinite(n) || n < 0) ||
    d.affectedPersons < d.affectedFamilies
  ) {
    return { state, error: "invalid" };
  }
  const sitrep = buildSitrep(state, barangay, municipality, now);
  return {
    state: { ...state, dana: { ...d, submittedAt: now.toISOString(), sitrep } },
    error: null,
  };
}

/** Clear the submitted DANA so a new assessment can be started. */
export function resetDana(state: IBarangayOpsState): IBarangayOpsState {
  return {
    ...state,
    dana: { ...state.dana, startedAt: null, submittedAt: null, sitrep: null },
  };
}

// --- QRF ---

export function qrfSpent(qrf: IBarangayQrf): number {
  return qrf.entries.reduce((s, e) => s + e.amount, 0);
}

export function qrfRemaining(qrf: IBarangayQrf): number {
  return qrf.allocated - qrfSpent(qrf);
}

export type IQrfError = "invalid" | "over-limit";

export function addQrfEntry(
  state: IBarangayOpsState,
  label: string,
  amount: number,
  now: Date,
  id: string,
): { state: IBarangayOpsState; error: IQrfError | null } {
  if (!label.trim() || !Number.isFinite(amount) || amount <= 0) {
    return { state, error: "invalid" };
  }
  if (amount > qrfRemaining(state.qrf)) {
    return { state, error: "over-limit" };
  }
  const entry = { id, label: label.trim(), amount: Math.round(amount), at: now.toISOString() };
  return {
    state: { ...state, qrf: { ...state.qrf, entries: [entry, ...state.qrf.entries] } },
    error: null,
  };
}

// --- Affected population (barangay only) ---

export function setPopulation(
  state: IBarangayOpsState,
  purok: string,
  patch: Partial<Pick<IBarangayPopulation, "evacuated" | "unaccounted">>,
): IBarangayOpsState {
  return {
    ...state,
    population: state.population.map((p) => {
      if (p.purok !== purok) {
        return p;
      }
      const evacuated =
        patch.evacuated === undefined ? p.evacuated : clampInt(patch.evacuated, 0, p.individuals);
      const unaccounted =
        patch.unaccounted === undefined
          ? p.unaccounted
          : clampInt(patch.unaccounted, 0, p.individuals);
      return { ...p, evacuated, unaccounted };
    }),
  };
}

// --- Projects (M11: edit OWN barangay only) ---

export function setProjectProgress(
  state: IBarangayOpsState,
  id: string,
  completionPct: number,
  status?: IBarangayProjectStatus,
): IBarangayOpsState {
  return {
    ...state,
    projects: state.projects.map((p) => {
      if (p.id !== id || !p.editable) {
        return p;
      }
      const pct = clampInt(completionPct, 0, 100);
      const nextStatus: IBarangayProjectStatus =
        pct === 100 ? "completed" : status && status !== "completed" ? status : pct > 0 ? "ongoing" : "planned";
      return { ...p, completionPct: pct, status: nextStatus };
    }),
  };
}

// --- M5 / M6 ---

export function setCropDamage(state: IBarangayOpsState, php: number): IBarangayOpsState {
  const value = clampInt(php, 0, 1_000_000_000);
  return {
    ...state,
    cropDamagePhp: value,
    // Feeds the DANA agriculture line while it hasn't been submitted.
    dana: state.dana.submittedAt ? state.dana : { ...state.dana, agricultureDamagePhp: value },
  };
}

/** Barangay CDRA has 6 CCC-HLURB steps. */
export const CDRA_TOTAL_STEPS = 6;

/** LCCAP barangay input covers 5 plan sections (RA 9729). */
export const LCCAP_TOTAL_SECTIONS = 5;

/** Mark the next barangay CDRA step complete (capped at 6). */
export function advanceCdra(state: IBarangayOpsState): IBarangayOpsState {
  if (state.cdraStepsDone >= CDRA_TOTAL_STEPS) {
    return state;
  }
  return { ...state, cdraStepsDone: state.cdraStepsDone + 1 };
}
