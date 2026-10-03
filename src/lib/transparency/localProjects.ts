import type {
  ILocalProject,
  ILocalProjectsResponse,
  IProjectCategory,
  IProjectStatus,
  ITransparencyEmbedData,
} from "@/types";

// DEMO per-project transparency data for M11, scoped to one locality
// (Calamba, Laguna). Project names, contractors and figures are ILLUSTRATIVE
// ONLY — not official records. Barangay names are real Calamba barangays.
// Figures only — no political commentary (G03). Attribution is REQUIRED.

export const LOCAL_PROJECTS_SOURCE =
  "Halimbawang datos (demo) — hindi opisyal na rekord ng LGU/COA";

export const LOCAL_PROJECTS_ERROR =
  "Hindi makuha ang listahan ng mga proyekto ngayon. Pakisubukan ulit.";

export const DEFAULT_MUNICIPALITY = "Calamba";
export const DEFAULT_PROVINCE = "Laguna";

/** Filipino labels per project category. */
export const PROJECT_CATEGORY_LABELS: Record<IProjectCategory, string> = {
  "flood-control": "Kontra-baha",
  drainage: "Kanal at drainage",
  "evacuation-center": "Likasan (evacuation center)",
  "early-warning": "Maagang babala",
  reforestation: "Pagtatanim ng puno",
  irrigation: "Irigasyon",
};

/** Filipino labels per project status. */
export const PROJECT_STATUS_LABELS: Record<IProjectStatus, string> = {
  ongoing: "Isinasagawa",
  completed: "Tapos na",
  delayed: "Naantala",
  planned: "Nakaplano",
};

const PROJECTS: ILocalProject[] = [
  {
    id: "cal-2026-001",
    name: "Pagpapatibay ng Dike sa Tabi ng Laguna de Bay",
    barangay: "Looc",
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    category: "flood-control",
    implementingOffice: "City Engineering Office",
    contractor: "Demo Builders Corp.",
    fundingSource: "LDRRMF — Mitigation Fund (70%)",
    approvedBudget: 48_500_000,
    disbursed: 29_100_000,
    progressPct: 62,
    status: "ongoing",
    startDate: "2026-02-10",
    targetEndDate: "2026-12-15",
    description:
      "Pagtaas at pagpapatibay ng 1.2 km na dike para hindi umapaw ang lawa sa mga bahay tuwing tag-ulan.",
    beneficiaries: "~2,300 pamilya sa lakeshore",
    milestones: [
      { date: "2026-02-10", label: "Groundbreaking at pagsisimula ng trabaho", done: true },
      { date: "2026-05-20", label: "Natapos ang unang 500 m ng dike", done: true },
      { date: "2026-09-01", label: "Pagpapatibay ng ikalawang bahagi", done: false },
      { date: "2026-12-15", label: "Final inspection at turnover", done: false },
    ],
  },
  {
    id: "cal-2026-002",
    name: "Bagong Drainage System sa Poblacion",
    barangay: "Parian",
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    category: "drainage",
    implementingOffice: "City Engineering Office",
    contractor: "Halimbawa Construction",
    fundingSource: "Local Development Fund (20% IRA/NTA)",
    approvedBudget: 18_750_000,
    disbursed: 18_200_000,
    progressPct: 100,
    status: "completed",
    startDate: "2025-08-04",
    targetEndDate: "2026-03-30",
    description:
      "Pinalaki at nilinis ang mga kanal sa kahabaan ng national highway para mabilis bumaba ang baha.",
    beneficiaries: "~900 pamilya at mga negosyo sa palengke",
    milestones: [
      { date: "2025-08-04", label: "Pagsisimula ng paghuhukay", done: true },
      { date: "2025-12-12", label: "Nailagay ang mga bagong box culvert", done: true },
      { date: "2026-03-28", label: "Turnover sa barangay", done: true },
    ],
  },
  {
    id: "cal-2026-003",
    name: "Multi-Purpose Evacuation Center",
    barangay: "Canlubang",
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    category: "evacuation-center",
    implementingOffice: "CDRRMO Calamba",
    contractor: "Sample Infra Inc.",
    fundingSource: "NDRRM Fund (national)",
    approvedBudget: 35_000_000,
    disbursed: 12_250_000,
    progressPct: 28,
    status: "delayed",
    startDate: "2025-11-15",
    targetEndDate: "2026-08-30",
    description:
      "Dalawang palapag na evacuation center na may kusina, palikuran, at lugar para sa PWD at mga nanay na nagpapasuso.",
    beneficiaries: "Kapasidad: 600 katao",
    milestones: [
      { date: "2025-11-15", label: "Groundbreaking", done: true },
      { date: "2026-03-10", label: "Natapos ang pundasyon", done: true },
      { date: "2026-06-01", label: "Naantala dahil sa pagbabago ng disenyo", done: true },
      { date: "2026-11-30", label: "Bagong target na pagtatapos", done: false },
    ],
  },
  {
    id: "cal-2026-004",
    name: "Flood Early Warning Sirens at Rain Gauges",
    barangay: "Real",
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    category: "early-warning",
    implementingOffice: "CDRRMO Calamba",
    contractor: "Demo Telemetry Solutions",
    fundingSource: "LDRRMF — Mitigation Fund (70%)",
    approvedBudget: 6_400_000,
    disbursed: 6_150_000,
    progressPct: 100,
    status: "completed",
    startDate: "2025-06-01",
    targetEndDate: "2025-10-31",
    description:
      "Naglagay ng 4 na sirena at 3 automated rain gauge na konektado sa CDRRMO para sa mabilis na babala.",
    beneficiaries: "~3,500 residente sa tabi ng ilog",
    milestones: [
      { date: "2025-06-01", label: "Pagbili ng kagamitan", done: true },
      { date: "2025-09-15", label: "Na-install ang mga sirena", done: true },
      { date: "2025-10-30", label: "Community drill at turnover", done: true },
    ],
  },
  {
    id: "cal-2026-005",
    name: "Reforestation sa Paanan ng Bundok Makiling",
    barangay: "Bucal",
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    category: "reforestation",
    implementingOffice: "City ENRO",
    contractor: "Samahan ng Magsasaka (community-based)",
    fundingSource: "Climate Change Expenditure (LGU)",
    approvedBudget: 3_200_000,
    disbursed: 1_440_000,
    progressPct: 45,
    status: "ongoing",
    startDate: "2026-06-15",
    targetEndDate: "2027-06-15",
    description:
      "Pagtatanim ng 15,000 katutubong puno para mabawasan ang landslide at pagbaha sa ibaba.",
    beneficiaries: "Mga barangay sa paanan ng Makiling",
    milestones: [
      { date: "2026-06-15", label: "Paghahanda ng seedlings", done: true },
      { date: "2026-08-20", label: "Naitanim ang unang 6,000 puno", done: true },
      { date: "2027-02-01", label: "Ikalawang yugto ng pagtatanim", done: false },
    ],
  },
  {
    id: "cal-2026-006",
    name: "Small Water Impounding para sa mga Sakahan",
    barangay: "Halang",
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    category: "irrigation",
    implementingOffice: "City Agriculture Office",
    contractor: "Halimbawa Agri-Works",
    fundingSource: "DA Climate Resiliency Program",
    approvedBudget: 9_800_000,
    disbursed: 2_940_000,
    progressPct: 30,
    status: "ongoing",
    startDate: "2026-04-01",
    targetEndDate: "2027-01-31",
    description:
      "Imbakan ng tubig-ulan para may patubig ang palayan kahit tag-init o El Niño.",
    beneficiaries: "~180 magsasaka, 120 ektarya",
    milestones: [
      { date: "2026-04-01", label: "Site survey at disenyo", done: true },
      { date: "2026-07-10", label: "Paghuhukay ng reservoir", done: true },
      { date: "2026-11-15", label: "Paglalagay ng irrigation canals", done: false },
    ],
  },
  {
    id: "cal-2026-007",
    name: "Slope Protection at Riprap sa Pansol Creek",
    barangay: "Pansol",
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    category: "flood-control",
    implementingOffice: "City Engineering Office",
    contractor: "Demo Builders Corp.",
    fundingSource: "LDRRMF — Mitigation Fund (70%)",
    approvedBudget: 12_600_000,
    disbursed: 0,
    progressPct: 0,
    status: "planned",
    startDate: "2026-11-01",
    targetEndDate: "2027-05-30",
    description:
      "Paglalagay ng riprap at slope protection para hindi gumuho ang pampang ng sapa tuwing malakas ang ulan.",
    beneficiaries: "~450 pamilya sa tabi ng sapa",
    milestones: [
      { date: "2026-09-20", label: "Naaprubahan ang budget", done: true },
      { date: "2026-10-15", label: "Public bidding", done: false },
      { date: "2026-11-01", label: "Target na pagsisimula", done: false },
    ],
  },
  {
    id: "cal-2026-008",
    name: "Rehabilitasyon ng Lecheria Evacuation Gym",
    barangay: "Lecheria",
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    category: "evacuation-center",
    implementingOffice: "CDRRMO Calamba",
    contractor: "Sample Infra Inc.",
    fundingSource: "LDRRMF — Quick Response Fund (30%)",
    approvedBudget: 7_250_000,
    disbursed: 5_075_000,
    progressPct: 74,
    status: "ongoing",
    startDate: "2026-05-05",
    targetEndDate: "2026-11-20",
    description:
      "Pagkukumpuni ng bubong, palikuran at kuryente ng gym na ginagamit na evacuation center.",
    beneficiaries: "Kapasidad: 350 katao",
    milestones: [
      { date: "2026-05-05", label: "Pagsisimula ng repair", done: true },
      { date: "2026-08-15", label: "Napalitan ang bubong", done: true },
      { date: "2026-11-20", label: "Turnover", done: false },
    ],
  },
];

/** Whole-number % of budget disbursed, clamped to 0–100. */
export function disbursedPct(project: Pick<ILocalProject, "approvedBudget" | "disbursed">): number {
  if (project.approvedBudget <= 0) {
    return 0;
  }
  const pct = Math.round((project.disbursed / project.approvedBudget) * 100);
  return Math.max(0, Math.min(100, pct));
}

export interface ILocalProjectsFilter {
  barangay?: string | null;
  status?: string | null;
}

function isStatus(value: string): value is IProjectStatus {
  return value in PROJECT_STATUS_LABELS;
}

/** Return the locality's projects, optionally filtered by barangay/status. */
export function getLocalProjects(filter: ILocalProjectsFilter = {}): ILocalProjectsResponse {
  const barangay = (filter.barangay ?? "").trim().toLowerCase();
  const status = (filter.status ?? "").trim().toLowerCase();

  const projects = PROJECTS.filter(
    (project) =>
      (barangay.length === 0 || project.barangay.toLowerCase() === barangay) &&
      (status.length === 0 || !isStatus(status) || project.status === status),
  );

  return {
    municipality: DEFAULT_MUNICIPALITY,
    province: DEFAULT_PROVINCE,
    projects,
    barangays: Array.from(new Set(PROJECTS.map((p) => p.barangay))).sort((a, b) =>
      a.localeCompare(b),
    ),
    totalBudget: projects.reduce((sum, p) => sum + p.approvedBudget, 0),
    totalDisbursed: projects.reduce((sum, p) => sum + p.disbursed, 0),
    isDemo: true,
    source: LOCAL_PROJECTS_SOURCE,
    fetchedAt: new Date().toISOString(),
  };
}

/** Look up one project by id. */
export function getLocalProjectById(id: string): ILocalProject | undefined {
  return PROJECTS.find((project) => project.id === id);
}

/** Find a project whose barangay is mentioned in free text (for chat). */
export function findBarangayInText(text: string): string | undefined {
  const lower = text.toLowerCase();
  return PROJECTS.map((p) => p.barangay).find((b) => lower.includes(b.toLowerCase()));
}

/** Chat-embed summary of the locality (or one barangay's) projects. */
export function toLocalProjectsEmbed(barangay?: string): ITransparencyEmbedData {
  const data = getLocalProjects({ barangay });
  const label = barangay
    ? `Brgy. ${barangay}, ${data.municipality}`
    : `${data.municipality}, ${data.province}`;
  return {
    province: `${label} · ${data.projects.length} proyekto`,
    totalAllocated: data.totalBudget,
    totalSpent: data.totalDisbursed,
    utilizationPct:
      data.totalBudget > 0 ? Math.round((data.totalDisbursed / data.totalBudget) * 100) : 0,
    source: data.source,
  };
}

const peso = new Intl.NumberFormat("fil-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** Compact plain-text digest of every project, injected into the AI prompt. */
export function localProjectsDigest(): string {
  const lines = PROJECTS.map(
    (p) =>
      `- [${p.id}] ${p.name} — Brgy. ${p.barangay}; ${PROJECT_CATEGORY_LABELS[p.category]}; ` +
      `status: ${PROJECT_STATUS_LABELS[p.status]}; budget ${peso.format(p.approvedBudget)}, ` +
      `nailabas ${peso.format(p.disbursed)} (${disbursedPct(p)}%); pisikal na progreso ${p.progressPct}%; ` +
      `${p.startDate} hanggang ${p.targetEndDate}; ${p.implementingOffice}; contractor: ${p.contractor}; ` +
      `pondo: ${p.fundingSource}.`,
  );
  return [
    `Mga lokal na climate/DRRM project sa ${DEFAULT_MUNICIPALITY}, ${DEFAULT_PROVINCE} (DEMO DATA — sabihin sa user na halimbawang datos ito):`,
    ...lines,
  ].join("\n");
}
