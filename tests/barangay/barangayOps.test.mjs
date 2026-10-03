// Unit tests for the pure Barangay Official ops logic. Runs on Node's
// built-in test runner with native TypeScript type stripping (no deps):
//   npm test
import { test } from "node:test";
import assert from "node:assert/strict";

import * as ops from "../../src/lib/barangay/barangayOps.ts";

/** Minimal initial state mirroring barangayData's San Roque demo figures. */
function initial() {
  const now = new Date("2026-10-04T06:00:00Z");
  return {
    barangay: "San Roque",
    centers: [
      { id: "gym", name: "San Roque Central Gym", purok: "Purok 1", occupancy: 300, capacity: 400, active: true },
      { id: "elem", name: "San Roque Elem.", purok: "Purok 2", occupancy: 0, capacity: 250, active: false },
    ],
    teams: [
      { id: "alfa", name: "Team Alfa", members: 3, status: "patrol", assignment: "Patrol Purok 3 Dike", purok: "Purok 3", updatedAt: now.toISOString() },
      { id: "bravo", name: "Team Bravo", members: 3, status: "patrol", assignment: "Patrol Purok 4 Spillway", purok: "Purok 4", updatedAt: now.toISOString() },
      { id: "charlie", name: "Team Charlie", members: 3, status: "security", assignment: "Gym security", purok: "Purok 1", updatedAt: now.toISOString() },
      { id: "delta", name: "Team Delta", members: 3, status: "logistics", assignment: "Gym logistics", purok: "Purok 1", updatedAt: now.toISOString() },
    ],
    river: {
      id: "R-04",
      station: "Santa Cruz River Bank – Sector B",
      levelM: 3.1,
      history: [
        { at: "2026-10-04T00:00:00Z", levelM: 2.2 },
        { at: "2026-10-04T06:00:00Z", levelM: 3.1 },
      ],
      normalMaxM: 3.5,
      alertM: 4.5,
      criticalM: 5.5,
      lastPingAt: now.toISOString(),
    },
    relief: [
      { id: "food", quantity: 450, unit: "packs", note: "" },
      { id: "water", quantity: 600, unit: "gal", note: "" },
      { id: "firstAid", quantity: 35, unit: "kits", note: "" },
    ],
    stockCount: { at: now.toISOString(), by: "Kagawad on duty" },
    distributions: [],
    reports: [
      { id: "r1", title: "Clogged Culvert", location: "Purok 3", status: "resolved", reportedAt: now.toISOString(), resolvedAt: now.toISOString() },
      { id: "r2", title: "Fallen Acacia Branch", location: "Purok 2", status: "resolved", reportedAt: now.toISOString(), resolvedAt: now.toISOString() },
    ],
    checklist: [{ id: "broadcast", done: false }],
    checklistActivatedAt: null,
    dana: {
      startedAt: null, submittedAt: null, affectedFamilies: 260, affectedPersons: 1240,
      dead: 0, injured: 0, missing: 0, housesDamaged: 0,
      agricultureDamagePhp: 185000, needs: "", sitrep: null,
    },
    qrf: { bdrrmf: 2000000, allocated: 600000, entries: [{ id: "q1", label: "Restock", amount: 45000, at: now.toISOString() }] },
    population: [
      { purok: "Purok 3", label: "Riverside", individuals: 680, families: 142, vulnerable: 104, evacuated: 180, unaccounted: 0 },
      { purok: "Purok 4", label: "Flood Basin", individuals: 560, families: 118, vulnerable: 90, evacuated: 120, unaccounted: 0 },
    ],
    projects: [
      { id: "seawall", name: "San Roque Seawall", barangay: "San Roque", completionPct: 85, status: "ongoing", editable: true },
      { id: "other", name: "Other Brgy Project", barangay: "Pagsawitan", completionPct: 60, status: "ongoing", editable: false },
    ],
    cdraStepsDone: 5,
    lccapSectionsDone: 2,
    cropDamagePhp: 185000,
    audit: [],
  };
}

const NOW = new Date("2026-10-04T07:00:00Z");

test("evacStatus thresholds: open / near-full / full / standby", () => {
  const s = initial();
  assert.equal(ops.evacStatus(s.centers[0]), "open"); // 300/400
  assert.equal(ops.evacStatus({ ...s.centers[0], occupancy: 340 }), "near-full");
  assert.equal(ops.evacStatus({ ...s.centers[0], occupancy: 400 }), "full");
  assert.equal(ops.evacStatus(s.centers[1]), "standby");
});

test("setOccupancy clamps to capacity", () => {
  const s = ops.setOccupancy(initial(), "gym", 9999);
  assert.equal(s.centers[0].occupancy, 400);
  assert.equal(ops.setOccupancy(initial(), "gym", -5).centers[0].occupancy, 0);
});

test("toggleCenterActive refuses to close an occupied shelter", () => {
  const s = initial();
  assert.equal(ops.toggleCenterActive(s, "gym").centers[0].active, true);
  assert.equal(ops.toggleCenterActive(s, "elem").centers[1].active, true);
});

test("dispatchTeam updates status, purok, assignment, timestamp", () => {
  const s = ops.dispatchTeam(initial(), "charlie", "Purok 5", "Check canal", NOW);
  const team = s.teams.find((x) => x.id === "charlie");
  assert.equal(team.status, "dispatched");
  assert.equal(team.purok, "Purok 5");
  assert.equal(team.assignment, "Check canal");
  assert.equal(team.updatedAt, NOW.toISOString());
  assert.equal(ops.activeResponders(s), 12);
  assert.equal(ops.activeResponders(ops.setTeamStatus(s, "alfa", "standby", NOW)), 9);
});

test("riverStatus at 3.10 / 3.60 / 4.60 / 5.60", () => {
  const r = initial().river;
  assert.equal(ops.riverStatus({ ...r, levelM: 3.1 }), "normal");
  assert.equal(ops.riverStatus({ ...r, levelM: 3.6 }), "watch");
  assert.equal(ops.riverStatus({ ...r, levelM: 4.6 }), "alert");
  assert.equal(ops.riverStatus({ ...r, levelM: 5.6 }), "critical");
});

test("logRiverReading + trendPerHour (+0.15 m/hr over 6h)", () => {
  assert.equal(ops.trendPerHour(initial().river.history), 0.15);
  const s = ops.logRiverReading(initial(), 4.6, NOW);
  assert.equal(s.river.levelM, 4.6);
  assert.equal(s.river.history.at(-1).levelM, 4.6);
  assert.equal(ops.riverStatus(s.river), "alert");
  assert.ok(ops.sparklinePoints(s.river.history, 80, 20).split(" ").length === 3);
});

test("reportCounts initial 0 pending / 2 resolved, then add → respond → resolve", () => {
  let s = initial();
  assert.deepEqual(ops.reportCounts(s.reports), { pending: 0, resolved: 2 });
  s = ops.addReport(s, "Baha sa kanto", "Purok 4", NOW, "r3");
  assert.deepEqual(ops.reportCounts(s.reports), { pending: 1, resolved: 2 });
  s = ops.respondReport(s, "r3", "Papunta na ang Tanod");
  assert.equal(s.reports[0].status, "responded");
  assert.deepEqual(ops.reportCounts(s.reports), { pending: 1, resolved: 2 });
  s = ops.resolveReport(s, "r3", "", NOW);
  assert.equal(s.reports[0].response, "Papunta na ang Tanod");
  assert.deepEqual(ops.reportCounts(s.reports), { pending: 0, resolved: 3 });
});

test("addDistribution deducts food packs and validates stock", () => {
  const ok = ops.addDistribution(initial(), { purok: "Purok 3", familiesServed: 40, familiesTarget: 142, packsGiven: 40 }, NOW, "d1");
  assert.equal(ok.error, null);
  assert.equal(ok.state.relief[0].quantity, 410);
  assert.equal(ok.state.distributions.length, 1);
  const tooMany = ops.addDistribution(initial(), { purok: "Purok 3", familiesServed: 10, familiesTarget: 142, packsGiven: 999 }, NOW, "d2");
  assert.equal(tooMany.error, "stock");
  const invalid = ops.addDistribution(initial(), { purok: "Purok 3", familiesServed: 200, familiesTarget: 142, packsGiven: 5 }, NOW, "d3");
  assert.equal(invalid.error, "invalid");
});

test("DANA 3-hour countdown, overdue, submit generates SitRep", () => {
  let s = initial();
  assert.equal(ops.danaRemainingMs(s.dana, NOW), null);
  assert.equal(ops.submitDana(s, "San Roque", "Santa Cruz", NOW).error, "not-started");
  s = ops.startDana(s, NOW);
  assert.equal(ops.danaRemainingMs(s.dana, NOW), ops.DANA_DEADLINE_MS);
  const later = new Date(NOW.getTime() + ops.DANA_DEADLINE_MS + 60_000);
  assert.ok(ops.danaRemainingMs(s.dana, later) < 0);
  assert.equal(ops.formatCountdown(ops.DANA_DEADLINE_MS), "03:00:00");
  const bad = ops.updateDana(s, { affectedPersons: 10 });
  assert.equal(ops.submitDana(bad, "San Roque", "Santa Cruz", NOW).error, "invalid");
  const done = ops.submitDana(s, "San Roque", "Santa Cruz", NOW);
  assert.equal(done.error, null);
  assert.ok(done.state.dana.submittedAt);
  const sitrep = done.state.dana.sitrep;
  assert.match(sitrep, /Barangay San Roque/);
  assert.match(sitrep, /MDRRMC Santa Cruz/);
  assert.match(sitrep, /1240/);
  assert.match(sitrep, /San Roque Central Gym 300\/400/);
  assert.equal(ops.submitDana(done.state, "San Roque", "Santa Cruz", NOW).error, "already-submitted");
});

test("QRF rejects over-limit and invalid amounts", () => {
  const s = initial();
  assert.equal(ops.qrfRemaining(s.qrf), 555000);
  assert.equal(ops.addQrfEntry(s, "Too much", 600000, NOW, "q2").error, "over-limit");
  assert.equal(ops.addQrfEntry(s, "", 100, NOW, "q3").error, "invalid");
  assert.equal(ops.addQrfEntry(s, "Zero", 0, NOW, "q4").error, "invalid");
  const ok = ops.addQrfEntry(s, "Sandbags", 20000, NOW, "q5");
  assert.equal(ok.error, null);
  assert.equal(ops.qrfRemaining(ok.state.qrf), 535000);
});

test("setProjectProgress edits only own-barangay (editable) projects", () => {
  const s = ops.setProjectProgress(initial(), "other", 10);
  assert.equal(s.projects[1].completionPct, 60);
  const own = ops.setProjectProgress(initial(), "seawall", 100);
  assert.equal(own.projects[0].completionPct, 100);
  assert.equal(own.projects[0].status, "completed");
});

test("setCropDamage pre-fills DANA agriculture until submitted", () => {
  const s = ops.setCropDamage(initial(), 250000);
  assert.equal(s.dana.agricultureDamagePhp, 250000);
});

test("appendAudit records WHO / WHEN / WHAT newest first", () => {
  let s = ops.appendAudit(initial(), "Kap. Reyes (Barangay Official)", "first", "system", NOW, "a1");
  s = ops.appendAudit(s, "Kap. Reyes (Barangay Official)", "second", "tanod", NOW, "a2");
  assert.equal(s.audit[0].what, "second");
  assert.equal(s.audit[1].who, "Kap. Reyes (Barangay Official)");
  assert.equal(s.audit[0].at, NOW.toISOString());
});

test("advanceCdra caps at 6 steps", () => {
  const s = ops.advanceCdra(initial());
  assert.equal(s.cdraStepsDone, 6);
  assert.equal(ops.advanceCdra(s), s);
});

test("widthClass snaps to static classes", () => {
  assert.equal(ops.widthClass(0), "w-0");
  assert.equal(ops.widthClass(75), "w-[75%]");
  assert.equal(ops.widthClass(99), "w-full");
});
