import type {
  IMunAuditEntry,
  IMunBudgetLine,
  IMunCcetTag,
  IMunEmergencyLevel,
  IMunEvacCenter,
  IMunEvacStatus,
  IMunicipalState,
  IMunProjectStatus,
} from "@/types";
import type { IMunTranslationKey } from "@/lib/i18n/munEn";
import { smsProvider } from "@/lib/sms";
import { MUN_BARANGAY_COUNT, MUN_PDRRMC, MUN_SEED_STATE, bdrrmcLabel, buildSeed } from "./dashboardData";
import { consolidatedDana, evacTotals, totalAffectedHouseholds } from "./municipalSelectors";
import { formatPhp, formatTimeManila } from "./municipalFormat";

// Client store for every Municipal Official edit. Same pattern as
// src/lib/sms: module state + listeners, read with useSyncExternalStore.
// In memory only (demo-grade). Every successful action appends a
// WHO / WHEN / WHAT audit entry. Scope is Calamba only.

export const MUN_SMS_SOURCE = "MDRRMO Calamba";

export type IMunStoreResult =
  | { ok: true; info?: string; count?: number }
  | { ok: false; errorKey: IMunTranslationKey; vars?: Record<string, string | number> };

let state: IMunicipalState | null = null;
const listeners = new Set<() => void>();

function fail(errorKey: IMunTranslationKey, vars?: Record<string, string | number>): IMunStoreResult {
  return { ok: false, errorKey, vars };
}

// In-memory only (scope reduction): edits + audit log live for the session.
function load(): IMunicipalState {
  state ??= MUN_SEED_STATE;
  return state;
}
function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeMunicipal(listener: () => void): () => void {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMunicipalSnapshot(): IMunicipalState {
  return load();
}

export function getMunicipalServerSnapshot(): IMunicipalState {
  return MUN_SEED_STATE;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Commit a new state with one audit entry (newest first). */
function commit(
  next: IMunicipalState,
  actor: string,
  action: string,
  target: string,
  detail: string,
): void {
  const entry: IMunAuditEntry = {
    id: makeId("aud"),
    at: new Date().toISOString(),
    actor,
    action,
    target,
    detail,
  };
  state = { ...next, audit: [entry, ...next.audit].slice(0, 300) };
  emit();
}

/** Derive a center's status from its occupancy (standby only while empty). */
export function deriveEvacStatus(center: IMunEvacCenter, occupancy: number): IMunEvacStatus {
  if (center.status === "closed") {
    return "closed";
  }
  if (occupancy === 0 && center.status === "standby") {
    return "standby";
  }
  const ratio = center.capacity > 0 ? occupancy / center.capacity : 0;
  if (ratio >= 1) {
    return "full";
  }
  if (ratio >= 0.85) {
    return "near-full";
  }
  return "open";
}

// --- Actions ---

export function updateEvacOccupancy(actor: string, centerId: string, occupancy: number): IMunStoreResult {
  const s = load();
  const center = s.centers.find((c) => c.id === centerId);
  if (!center) {
    return fail("mun.err.notFound");
  }
  if (!Number.isInteger(occupancy) || occupancy < 0 || occupancy > center.capacity) {
    return fail("mun.err.occupancy");
  }
  const status = deriveEvacStatus(center, occupancy);
  commit(
    { ...s, centers: s.centers.map((c) => (c.id === centerId ? { ...c, occupancy, status } : c)) },
    actor,
    "Evacuation occupancy",
    center.name,
    `${center.occupancy} → ${occupancy}/${center.capacity} (${status})`,
  );
  return { ok: true };
}

export function setEvacStatus(actor: string, centerId: string, open: boolean): IMunStoreResult {
  const s = load();
  const center = s.centers.find((c) => c.id === centerId);
  if (!center) {
    return fail("mun.err.notFound");
  }
  if (!open && center.occupancy > 0) {
    return fail("mun.err.occupancy");
  }
  const status: IMunEvacStatus = open
    ? deriveEvacStatus({ ...center, status: "open" }, center.occupancy)
    : "standby";
  commit(
    { ...s, centers: s.centers.map((c) => (c.id === centerId ? { ...c, status } : c)) },
    actor,
    open ? "Binuksan ang center" : "Ibinalik sa standby",
    center.name,
    `${center.status} → ${status}`,
  );
  return { ok: true };
}

export function reviewDana(
  actor: string,
  barangayId: string,
  decision: "approved" | "returned",
  note: string,
): IMunStoreResult {
  const s = load();
  const report = s.dana.find((d) => d.barangayId === barangayId);
  const brgy = s.barangays.find((b) => b.id === barangayId);
  if (!report || !brgy) {
    return fail("mun.err.notFound");
  }
  if (report.status !== "submitted") {
    return fail("mun.err.danaState");
  }
  const trimmed = note.trim();
  if (decision === "returned" && trimmed.length < 3) {
    return fail("mun.err.noteRequired");
  }
  commit(
    {
      ...s,
      dana: s.dana.map((d) =>
        d.barangayId === barangayId ? { ...d, status: decision, reviewNote: trimmed || undefined } : d,
      ),
    },
    actor,
    decision === "approved" ? "Inaprubahan ang DANA" : "Ibinalik ang DANA",
    `Brgy. ${brgy.name}`,
    trimmed || "—",
  );
  return { ok: true };
}

export function setProjectProgress(
  actor: string,
  projectId: string,
  completionPct: number,
  status: IMunProjectStatus,
): IMunStoreResult {
  const s = load();
  const project = s.projects.find((p) => p.id === projectId);
  if (!project) {
    return fail("mun.err.notFound");
  }
  if (!Number.isFinite(completionPct) || completionPct < 0 || completionPct > 100) {
    return fail("mun.err.progress");
  }
  const pctValue = Math.round(completionPct);
  const finalStatus: IMunProjectStatus = pctValue === 100 ? "completed" : status;
  commit(
    {
      ...s,
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, completionPct: pctValue, status: finalStatus, updatedAt: new Date().toISOString() }
          : p,
      ),
    },
    actor,
    "Project status",
    `${project.name} (${project.barangay})`,
    `${project.completionPct}% ${project.status} → ${pctValue}% ${finalStatus}`,
  );
  return { ok: true };
}

export function respondReport(actor: string, id: string, response: string, resolve: boolean): IMunStoreResult {
  const s = load();
  const report = s.reports.find((r) => r.id === id);
  if (!report) {
    return fail("mun.err.notFound");
  }
  const text = response.trim() || report.response || "";
  if (text.length < 5) {
    return fail("mun.err.response");
  }
  const status = resolve ? "resolved" : "responded";
  commit(
    {
      ...s,
      reports: s.reports.map((r) =>
        r.id === id ? { ...r, response: text, status, updatedAt: new Date().toISOString() } : r,
      ),
    },
    actor,
    resolve ? "Nalutas ang report" : "Tumugon sa report",
    `Brgy. ${report.barangay}: ${report.title}`,
    text,
  );
  return { ok: true };
}

export function submitReport(actor: string, barangay: string, title: string, body: string): IMunStoreResult {
  const s = load();
  if (!s.barangays.some((b) => b.name === barangay)) {
    return fail("mun.err.barangay");
  }
  const t = title.trim();
  const b = body.trim();
  if (t.length < 4 || b.length < 10) {
    return fail("mun.err.reportFields");
  }
  const now = new Date().toISOString();
  commit(
    {
      ...s,
      reports: [
        { id: makeId("rpt"), barangay, title: t, body: b, status: "open", createdAt: now, updatedAt: now },
        ...s.reports,
      ],
    },
    actor,
    "Nag-submit ng report",
    `Brgy. ${barangay}`,
    t,
  );
  return { ok: true };
}

export function upsertBudgetLine(
  actor: string,
  line: Omit<IMunBudgetLine, "id"> & { id?: string },
): IMunStoreResult {
  const s = load();
  if (line.item.trim().length < 2 || line.office.trim().length < 2) {
    return fail("mun.err.budgetFields");
  }
  if (!Number.isFinite(line.amountPhp) || line.amountPhp <= 0) {
    return fail("mun.err.amount");
  }
  const existing = line.id ? s.budget.find((l) => l.id === line.id) : undefined;
  const clean: IMunBudgetLine = {
    id: existing?.id ?? makeId("aip"),
    item: line.item.trim(),
    office: line.office.trim(),
    amountPhp: Math.round(line.amountPhp),
    ccet: line.ccet,
    ccetCode: line.ccetCode?.trim() || undefined,
  };
  commit(
    {
      ...s,
      budget: existing ? s.budget.map((l) => (l.id === clean.id ? clean : l)) : [...s.budget, clean],
    },
    actor,
    existing ? "In-edit ang budget line" : "Nag-upload ng budget line",
    clean.item,
    `${clean.office} · ${formatPhp(clean.amountPhp)}`,
  );
  return { ok: true };
}

/** Import `item,office,amount` CSV rows. Lines are appended, never overwritten. */
export function importBudgetCsv(actor: string, text: string): IMunStoreResult {
  const s = load();
  const rows = text
    .split(/\r?\n/)
    .map((r, i) => ({ raw: r.trim(), n: i + 1 }))
    .filter((r) => r.raw.length > 0);
  if (rows.length === 0) {
    return fail("mun.err.csvEmpty");
  }
  const bad: number[] = [];
  const lines: IMunBudgetLine[] = [];
  for (const row of rows) {
    // Allow a header row.
    if (row.n === rows[0].n && /^item\s*,/i.test(row.raw)) {
      continue;
    }
    const parts = row.raw.split(",").map((p) => p.trim());
    if (parts.length < 3) {
      bad.push(row.n);
      continue;
    }
    const amount = Number(parts.slice(2).join("").replace(/[₱\s]/g, ""));
    const item = parts[0];
    const office = parts[1];
    if (!item || !office || !Number.isFinite(amount) || amount <= 0) {
      bad.push(row.n);
      continue;
    }
    lines.push({ id: makeId("aip"), item, office, amountPhp: Math.round(amount), ccet: "none" });
  }
  if (bad.length > 0) {
    return fail("mun.err.csv", { lines: bad.join(", ") });
  }
  if (lines.length === 0) {
    return fail("mun.err.csvEmpty");
  }
  commit(
    { ...s, budget: [...s.budget, ...lines] },
    actor,
    "Nag-import ng budget CSV",
    `${lines.length} linya`,
    lines.map((l) => l.item).join("; "),
  );
  return { ok: true, count: lines.length };
}

export function tagCcet(actor: string, lineId: string, tag: IMunCcetTag, code?: string): IMunStoreResult {
  const s = load();
  const line = s.budget.find((l) => l.id === lineId);
  if (!line) {
    return fail("mun.err.notFound");
  }
  const ccetCode = tag === "none" ? undefined : code?.trim() || undefined;
  commit(
    { ...s, budget: s.budget.map((l) => (l.id === lineId ? { ...l, ccet: tag, ccetCode } : l)) },
    actor,
    "CCET tag",
    line.item,
    `${line.ccet} → ${tag}${ccetCode ? ` (${ccetCode})` : ""}`,
  );
  return { ok: true };
}

export function toggleChecklist(actor: string, id: string): IMunStoreResult {
  const s = load();
  const item = s.checklist.find((c) => c.id === id);
  if (!item) {
    return fail("mun.err.notFound");
  }
  commit(
    { ...s, checklist: s.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) },
    actor,
    "DRRM checklist",
    item.label,
    item.done ? "Ibinalik sa hindi pa tapos" : "Tapos na",
  );
  return { ok: true };
}

/** Signal raised: reset BDRRMC acks and SMS the checklist to every listed BDRRMC. */
export function triggerChecklist(actor: string): IMunStoreResult {
  const s = load();
  const recipients = s.barangays.map((b) => bdrrmcLabel(b.name));
  smsProvider.send(
    recipients,
    `MDRRMO Calamba: Signal ${s.emergencyLevel}. I-activate ang pre-disaster checklist ng BDRRMC at mag-ack sa KlimaGuard. -MDRRMO`,
    "hazard-alert",
    MUN_SMS_SOURCE,
  );
  commit(
    { ...s, barangays: s.barangays.map((b) => ({ ...b, checklistAck: false })) },
    actor,
    "Na-trigger ang DRRM checklist",
    "Lahat ng BDRRMC",
    `SMS sa ${recipients.length} BDRRMC`,
  );
  return { ok: true, count: recipients.length };
}

export function ackChecklist(actor: string, barangayId: string): IMunStoreResult {
  const s = load();
  const brgy = s.barangays.find((b) => b.id === barangayId);
  if (!brgy) {
    return fail("mun.err.notFound");
  }
  commit(
    { ...s, barangays: s.barangays.map((b) => (b.id === barangayId ? { ...b, checklistAck: true } : b)) },
    actor,
    "Checklist ack",
    `BDRRMC ${brgy.name}`,
    "Na-acknowledge",
  );
  return { ok: true };
}

export function dispatchRelief(
  actor: string,
  barangayId: string,
  foodPacks: number,
  waterKits: number,
): IMunStoreResult {
  const s = load();
  const brgy = s.barangays.find((b) => b.id === barangayId);
  if (!brgy) {
    return fail("mun.err.barangay");
  }
  if (!Number.isInteger(foodPacks) || !Number.isInteger(waterKits) || foodPacks < 0 || waterKits < 0 || foodPacks + waterKits === 0) {
    return fail("mun.err.qty");
  }
  if (foodPacks > s.depot.foodPacks || waterKits > s.depot.waterKits) {
    return fail("mun.err.stock");
  }
  commit(
    {
      ...s,
      depot: { ...s.depot, foodPacks: s.depot.foodPacks - foodPacks, waterKits: s.depot.waterKits - waterKits },
      barangays: s.barangays.map((b) =>
        b.id === barangayId
          ? {
              ...b,
              inventoryFoodPacks: b.inventoryFoodPacks + foodPacks,
              reliefDelivered: Math.min(b.reliefNeeded, b.reliefDelivered + foodPacks),
            }
          : b,
      ),
    },
    actor,
    "Relief dispatch",
    `Brgy. ${brgy.name}`,
    `${foodPacks} food packs · ${waterKits} water kits`,
  );
  return { ok: true };
}

export function allocateRcef(actor: string, barangayId: string, seedBags: number): IMunStoreResult {
  const s = load();
  const brgy = s.barangays.find((b) => b.id === barangayId);
  if (!brgy) {
    return fail("mun.err.barangay");
  }
  if (!Number.isInteger(seedBags) || seedBags <= 0) {
    return fail("mun.err.qty");
  }
  const existing = s.rcef.find((r) => r.barangayId === barangayId);
  const rcef = existing
    ? s.rcef.map((r) => (r.barangayId === barangayId ? { ...r, seedBags: r.seedBags + seedBags } : r))
    : [...s.rcef, { barangayId, seedBags }];
  commit({ ...s, rcef }, actor, "DA/RCEF allocation", `Brgy. ${brgy.name}`, `+${seedBags} seed bags`);
  return { ok: true };
}

/** Compose the Filipino municipal SitRep from live store totals. */
export function buildSitrepMessage(s: IMunicipalState): string {
  const evac = evacTotals(s);
  const dana = consolidatedDana(s);
  const time = formatTimeManila(new Date().toISOString());
  return (
    `SITREP MDRRMO Calamba ${time}H: ` +
    (s.emergencyActive ? `Alert Level ${s.emergencyLevel}. ` : "Normal na kondisyon. ") +
    `Apektadong pamilya: ${totalAffectedHouseholds(s).toLocaleString("en-PH")} sa 54 brgy. ` +
    `Evacuees ${evac.occupied}/${evac.capacity} (${evac.pct}%), ${evac.openCount}/${evac.total} center bukas. ` +
    `DANA: ${dana.reporting}/${s.dana.length} nag-report. ` +
    `Depo: ${s.depot.foodPacks} food packs, ${s.depot.waterKits} water kits. -MDRRMO`
  );
}

export function broadcastSitrep(actor: string): IMunStoreResult {
  const s = load();
  const message = buildSitrepMessage(s);
  const recipients = [MUN_PDRRMC, ...s.barangays.map((b) => bdrrmcLabel(b.name))];
  smsProvider.send(recipients, message, "digest", MUN_SMS_SOURCE);
  commit(
    {
      ...s,
      sitreps: [
        {
          id: makeId("sit"),
          direction: "up",
          from: "MDRRMC Calamba",
          to: MUN_PDRRMC,
          summary: message,
          at: new Date().toISOString(),
        },
        ...s.sitreps,
      ],
    },
    actor,
    "SitRep broadcast",
    `${MUN_PDRRMC} + ${s.barangays.length} BDRRMC`,
    message,
  );
  return { ok: true, count: recipients.length, info: formatTimeManila(new Date().toISOString()) };
}

export function sendBdrrmcDirective(actor: string, barangayIds: string[] | "all", message: string): IMunStoreResult {
  const s = load();
  const text = message.trim();
  if (text.length < 10) {
    return fail("mun.err.message");
  }
  const targets = barangayIds === "all" ? s.barangays : s.barangays.filter((b) => barangayIds.includes(b.id));
  if (targets.length === 0) {
    return fail("mun.err.barangay");
  }
  const recipients = targets.map((b) => bdrrmcLabel(b.name));
  smsProvider.send(recipients, `${text} -MDRRMO Calamba`, "hazard-alert", MUN_SMS_SOURCE);
  const to = barangayIds === "all" ? "Lahat ng BDRRMC" : recipients.join(", ");
  commit(
    {
      ...s,
      sitreps: [
        { id: makeId("sit"), direction: "down", from: "MDRRMC Calamba", to, summary: text, at: new Date().toISOString() },
        ...s.sitreps,
      ],
    },
    actor,
    "Direktiba sa BDRRMC",
    to,
    text,
  );
  return { ok: true, count: recipients.length };
}

/** Resident alert broadcast (M4) to one barangay or all. */
export function broadcastResidentAlert(actor: string, barangay: string | "all", message: string): IMunStoreResult {
  const s = load();
  const text = message.trim();
  if (text.length < 10) {
    return fail("mun.err.message");
  }
  if (barangay !== "all" && !s.barangays.some((b) => b.name === barangay)) {
    return fail("mun.err.barangay");
  }
  const recipients =
    barangay === "all"
      ? s.barangays.map((b) => `Mga residente ng Brgy. ${b.name}`)
      : [`Mga residente ng Brgy. ${barangay}`];
  smsProvider.send(recipients, text, "hazard-alert", MUN_SMS_SOURCE);
  commit(s, actor, "Resident alert broadcast", barangay === "all" ? "Lahat ng barangay" : `Brgy. ${barangay}`, text);
  return { ok: true, count: recipients.length };
}

/** Auto-send the DANA form to every BDRRMC (post-disaster, emergency mode). */
export function sendDanaForms(actor: string): IMunStoreResult {
  const s = load();
  const pending = s.barangays.filter((b) => {
    const d = s.dana.find((x) => x.barangayId === b.id);
    return !d || d.status === "not-submitted" || d.status === "returned";
  });
  const recipients = pending.map((b) => bdrrmcLabel(b.name));
  if (recipients.length === 0) {
    return { ok: true, count: 0 };
  }
  smsProvider.send(
    recipients,
    "MDRRMO Calamba: Isumite ang initial DANA ng inyong barangay sa loob ng 3 oras via KlimaGuard. -MDRRMO",
    "digest",
    MUN_SMS_SOURCE,
  );
  commit(s, actor, "DANA form auto-send", `${recipients.length} BDRRMC`, recipients.join(", "));
  return { ok: true, count: recipients.length };
}

export function setLccapProgress(actor: string, id: string, progressPct: number): IMunStoreResult {
  const s = load();
  const section = s.lccap.find((l) => l.id === id);
  if (!section) {
    return fail("mun.err.notFound");
  }
  if (!Number.isFinite(progressPct) || progressPct < 0 || progressPct > 100) {
    return fail("mun.err.progress");
  }
  const p = Math.round(progressPct);
  const status = p === 100 ? "adopted" : p >= 75 ? "review" : "draft";
  commit(
    { ...s, lccap: s.lccap.map((l) => (l.id === id ? { ...l, progressPct: p, status } : l)) },
    actor,
    "LCCAP progress",
    section.title,
    `${section.progressPct}% → ${p}% (${status})`,
  );
  return { ok: true };
}

export function toggleCdraStep(actor: string, id: string): IMunStoreResult {
  const s = load();
  const step = s.cdra.find((c) => c.id === id);
  if (!step) {
    return fail("mun.err.notFound");
  }
  commit(
    {
      ...s,
      cdra: s.cdra.map((c) =>
        c.id === id ? { ...c, done: !c.done, barangaysDone: !c.done ? MUN_BARANGAY_COUNT : c.barangaysDone } : c,
      ),
    },
    actor,
    "CDRA step",
    step.title,
    step.done ? "Ibinalik sa ginagawa" : "Tapos (lahat consolidated)",
  );
  return { ok: true };
}

export function toggleClupClimate(actor: string, id: string): IMunStoreResult {
  const s = load();
  const zone = s.clup.find((z) => z.id === id);
  if (!zone) {
    return fail("mun.err.notFound");
  }
  commit(
    { ...s, clup: s.clup.map((z) => (z.id === id ? { ...z, climateInformed: !z.climateInformed } : z)) },
    actor,
    "CLUP zone",
    zone.zone,
    zone.climateInformed ? "Inalis ang climate-informed" : "Minarkahang climate-informed",
  );
  return { ok: true };
}

export function setEmergency(actor: string, active: boolean, level: IMunEmergencyLevel): IMunStoreResult {
  const s = load();
  commit(
    { ...s, emergencyActive: active, emergencyLevel: level },
    actor,
    "Emergency protocol",
    "Calamba MDRRMC",
    active ? `Aktibo · Level ${level}` : "Naka-off",
  );
  return { ok: true };
}

export function resetMunicipalState(actor: string): IMunStoreResult {
  const seed = buildSeed();
  commit(seed, actor, "Reset ng demo data", "Municipal state", "Ibinalik sa seed");
  return { ok: true };
}
