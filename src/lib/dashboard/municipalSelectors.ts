import { differenceInCalendarDays, parseISO } from "date-fns";
import type {
  IMunBarangay,
  IMunCcetTag,
  IMunDeadline,
  IMunEvacCenter,
  IMunicipalDashboardData,
  IMunicipalState,
  ITransparencyData,
} from "@/types";
import { CATEGORY_LABELS, TRANSPARENCY_SOURCE } from "@/lib/transparency/transparencyData";
import { MUN_FUND } from "./dashboardData";
import { pct } from "./municipalFormat";

// Pure selectors over the municipal state. Cards derive their numbers from
// here — never hard-coded — so every edit recomputes the whole dashboard.

export function totalAffectedHouseholds(state: IMunicipalState): number {
  return state.barangays.reduce((s, b) => s + b.affectedHouseholds, 0);
}

export function totalAtRiskResidents(state: IMunicipalState): number {
  return state.barangays.reduce((s, b) => s + b.atRiskResidents, 0);
}

export interface IMunEvacTotals {
  occupied: number;
  capacity: number;
  pct: number;
  openCount: number;
  total: number;
  bedsRemaining: number;
  primaryHub: IMunEvacCenter | undefined;
}

export function isCenterOpen(c: IMunEvacCenter): boolean {
  return c.status !== "standby" && c.status !== "closed";
}

export function evacTotals(state: IMunicipalState): IMunEvacTotals {
  const occupied = state.centers.reduce((s, c) => s + c.occupancy, 0);
  const capacity = state.centers.reduce((s, c) => s + c.capacity, 0);
  return {
    occupied,
    capacity,
    pct: pct(occupied, capacity),
    openCount: state.centers.filter(isCenterOpen).length,
    total: state.centers.length,
    bedsRemaining: Math.max(0, capacity - occupied),
    primaryHub: state.centers.find((c) => c.isPrimaryHub),
  };
}

export interface IMunFundSummary {
  fiscalYear: number;
  allocated: number;
  spent: number;
  pct: number;
  /** 30% Quick Response Fund. */
  qrf: number;
  /** 70% pre-disaster / mitigation. */
  mitigation: number;
}

export function fundSummary(): IMunFundSummary {
  return {
    fiscalYear: MUN_FUND.fiscalYear,
    allocated: MUN_FUND.allocated,
    spent: MUN_FUND.spent,
    pct: pct(MUN_FUND.spent, MUN_FUND.allocated),
    qrf: Math.round(MUN_FUND.allocated * 0.3),
    mitigation: Math.round(MUN_FUND.allocated * 0.7),
  };
}

export interface IMunDanaTotals {
  reporting: number;
  approved: number;
  submitted: number;
  returned: number;
  notSubmitted: number;
  affectedFamilies: number;
  casualties: number;
  housesDamaged: number;
  infraDamagePhp: number;
  agriDamagePhp: number;
}

/** Sums over submitted + approved DANA (consolidated municipal DANA). */
export function consolidatedDana(state: IMunicipalState): IMunDanaTotals {
  const counted = state.dana.filter((d) => d.status === "submitted" || d.status === "approved");
  return {
    reporting: counted.length,
    approved: state.dana.filter((d) => d.status === "approved").length,
    submitted: state.dana.filter((d) => d.status === "submitted").length,
    returned: state.dana.filter((d) => d.status === "returned").length,
    notSubmitted: state.dana.filter((d) => d.status === "not-submitted").length,
    affectedFamilies: counted.reduce((s, d) => s + d.affectedFamilies, 0),
    casualties: counted.reduce((s, d) => s + d.casualties, 0),
    housesDamaged: counted.reduce((s, d) => s + d.housesDamaged, 0),
    infraDamagePhp: counted.reduce((s, d) => s + d.infraDamagePhp, 0),
    agriDamagePhp: counted.reduce((s, d) => s + d.agriDamagePhp, 0),
  };
}

export function municipalCropDamage(state: IMunicipalState): number {
  return state.barangays.reduce((s, b) => s + b.cropDamagePhp, 0);
}

export function complianceRanking(state: IMunicipalState): IMunBarangay[] {
  return [...state.barangays].sort((a, b) => b.complianceScore - a.complianceScore);
}

export function riskRanking(state: IMunicipalState): IMunBarangay[] {
  return [...state.barangays].sort((a, b) => b.riskIndex - a.riskIndex);
}

export function averageCompliance(state: IMunicipalState): number {
  if (state.barangays.length === 0) {
    return 0;
  }
  return Math.round(
    state.barangays.reduce((s, b) => s + b.complianceScore, 0) / state.barangays.length,
  );
}

export type IMunDeadlineBadge = "overdue" | "7" | "15" | "30" | "later";

export interface IMunDeadlineView extends IMunDeadline {
  daysLeft: number;
  badge: IMunDeadlineBadge;
}

export function pendingDeadlines(state: IMunicipalState, today: Date = new Date()): IMunDeadlineView[] {
  return state.deadlines
    .map((d) => {
      const daysLeft = differenceInCalendarDays(parseISO(d.dueDate), today);
      const badge: IMunDeadlineBadge =
        daysLeft < 0 ? "overdue" : daysLeft <= 7 ? "7" : daysLeft <= 15 ? "15" : daysLeft <= 30 ? "30" : "later";
      return { ...d, daysLeft, badge };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export interface IMunReportCounts {
  open: number;
  responded: number;
  resolved: number;
  pending: number;
}

export function reportCounts(state: IMunicipalState, barangay?: string): IMunReportCounts {
  const list = barangay ? state.reports.filter((r) => r.barangay === barangay) : state.reports;
  const open = list.filter((r) => r.status === "open").length;
  const responded = list.filter((r) => r.status === "responded").length;
  const resolved = list.filter((r) => r.status === "resolved").length;
  return { open, responded, resolved, pending: open + responded };
}

export function ccetTotals(state: IMunicipalState): Record<IMunCcetTag, number> {
  const totals: Record<IMunCcetTag, number> = { adaptation: 0, mitigation: 0, none: 0 };
  for (const line of state.budget) {
    totals[line.ccet] += line.amountPhp;
  }
  return totals;
}

export function bdrrmcOnlineCount(state: IMunicipalState): number {
  return state.barangays.filter((b) => b.bdrrmcOnline).length;
}

export function pcicTotals(state: IMunicipalState): { enrolled: number; farmers: number; pct: number } {
  const enrolled = state.barangays.reduce((s, b) => s + b.pcicEnrolled, 0);
  const farmers = state.barangays.reduce((s, b) => s + b.farmers, 0);
  return { enrolled, farmers, pct: pct(enrolled, farmers) };
}

export function barangayName(state: IMunicipalState, id: string): string {
  return state.barangays.find((b) => b.id === id)?.name ?? id;
}

/**
 * Derive an `ITransparencyData` shape from the municipal fund roll-up so the
 * existing BudgetTracker (context="official") renders the LDRRMF breakdown.
 * The 70/30 split is expressed as mitigation (prevention+preparedness) vs.
 * QRF (response+recovery) to fit the four DRRM pillars BudgetTracker expects.
 */
export function toTransparencyData(data: IMunicipalDashboardData): ITransparencyData {
  const { fund, summary } = data;
  const spentRatio = fund.allocated > 0 ? fund.spent / fund.allocated : 0;
  const mitigationSpent = Math.round(fund.mitigationFund * spentRatio);
  const qrfSpent = Math.round(fund.quickResponseFund * spentRatio);

  return {
    province: `${summary.municipality}, ${summary.province}`,
    fiscalYear: fund.fiscalYear,
    totalAllocated: fund.allocated,
    totalSpent: fund.spent,
    lines: [
      {
        category: "prevention",
        label: CATEGORY_LABELS.prevention,
        allocated: Math.round(fund.mitigationFund * 0.55),
        spent: Math.round(mitigationSpent * 0.55),
      },
      {
        category: "preparedness",
        label: CATEGORY_LABELS.preparedness,
        allocated: Math.round(fund.mitigationFund * 0.45),
        spent: Math.round(mitigationSpent * 0.45),
      },
      {
        category: "response",
        label: CATEGORY_LABELS.response,
        allocated: Math.round(fund.quickResponseFund * 0.6),
        spent: Math.round(qrfSpent * 0.6),
      },
      {
        category: "recovery",
        label: CATEGORY_LABELS.recovery,
        allocated: Math.round(fund.quickResponseFund * 0.4),
        spent: Math.round(qrfSpent * 0.4),
      },
    ],
    timeline: [
      {
        date: `${fund.fiscalYear}-01-15`,
        label: "Paglabas ng taunang LDRRMF (70/30 split)",
        amount: fund.allocated,
        type: "release",
      },
      {
        date: `${fund.fiscalYear}-02-01`,
        label: "Mitigation Fund (70%) — pag-iwas at paghahanda",
        amount: fund.mitigationFund,
        type: "release",
      },
      {
        date: `${fund.fiscalYear}-02-01`,
        label: "Quick Response Fund (30%) — standby",
        amount: fund.quickResponseFund,
        type: "release",
      },
    ],
    source: TRANSPARENCY_SOURCE,
    fetchedAt: data.fetchedAt,
  };
}
