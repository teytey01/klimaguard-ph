import { addDays, format } from "date-fns";
import type {
  IAgencySync,
  IEnsoPhase,
  IHotline,
  IMunicipalDashboardData,
  IMunicipalState,
  IMunBarangay,
  IMunBudgetLine,
  IMunChecklistItem,
  IMunDanaReport,
  IMunEvacCenter,
  ICommandStat,
  IEvacuationStatus,
  IModuleNavItem,
  ILocation,
} from "@/types";
import type { IconName } from "@/components/common/Icon";
import { utilizationPct } from "@/lib/transparency/transparencyData";

// Static, demo-grade data for the MDRRMO Municipal Command Center (Municipal
// Official view, M6/M7). No live NDRRMC/COA/PAGASA feed is wired yet, so these
// are realistic-looking mock figures for the hackathon demo. Figures only — no
// political commentary. Attribution is REQUIRED on every surface.

/** Shared attribution for the municipal command center. */
export const COMMAND_SOURCE =
  "Consolidated: NDRRMC · PAGASA · COA/DBM · OCD Region IV-A";

/** Graceful Filipino fallback message for the dashboard. */
export const COMMAND_ERROR =
  "Hindi makuha ang municipal command data ngayon. Pakisubukan ulit.";

const MUNICIPALITY = "Calamba";
const PROVINCE = "Laguna";
const REGION = "CALABARZON (Region IV-A)";
const BARANGAYS_COVERED = 54;
const AFFECTED_HOUSEHOLDS = 1420;
const FISCAL_YEAR = 2024;

// LDRRMF appropriation for the municipality (full 70/30 split per RA 10121).
const LDRRMF_ALLOCATED = 45_200_000;
const LDRRMF_SPENT = 28_100_000; // ≈ 62% utilization
const MITIGATION_FUND = Math.round(LDRRMF_ALLOCATED * 0.7); // 70% share
const QUICK_RESPONSE_FUND = Math.round(LDRRMF_ALLOCATED * 0.3); // 30% QRF

/** The 11-module municipal navigation bar (M1–M11, Municipal Official). */
const MODULES: IModuleNavItem[] = [
  { id: "M1", label: "Overview", icon: "command", kind: "operations", active: true },
  { id: "M2", label: "Hazard Risk", icon: "alert-triangle", kind: "operations" },
  { id: "M3", label: "Population Triage", icon: "users", kind: "operations" },
  { id: "M4", label: "Evac Shelters", icon: "home", kind: "operations" },
  { id: "M5", label: "Logistics & Relief", icon: "box", kind: "operations" },
  { id: "M6", label: "CDRA & Works", icon: "building", kind: "planning" },
  { id: "M7", label: "DRRM Operations", icon: "radio", kind: "planning" },
  { id: "M8", label: "Hydro & Telemetry", icon: "water", kind: "operations" },
  { id: "M9", label: "Inter-Agency Hub", icon: "link", kind: "operations" },
  { id: "M10", label: "LGU Transparency", icon: "chart", kind: "planning" },
  { id: "M11", label: "Post-DANA Analytics", icon: "chart", kind: "operations" },
];

/** Municipal-wide evacuation center occupancy (M4/M7 — all centers). */
const EVACUATION: IEvacuationStatus[] = [
  {
    name: "Calamba Elementary School",
    barangay: "Barangay 1 (Poblacion)",
    occupancy: 312,
    capacity: 400,
    status: "near-full",
  },
  {
    name: "Bucal Covered Court",
    barangay: "Bucal",
    occupancy: 180,
    capacity: 250,
    status: "open",
  },
  {
    name: "Real Barangay Hall Gymnasium",
    barangay: "Real",
    occupancy: 240,
    capacity: 240,
    status: "full",
  },
  {
    name: "Canlubang National High School",
    barangay: "Canlubang",
    occupancy: 95,
    capacity: 300,
    status: "open",
  },
  {
    name: "Halang Multi-Purpose Hall",
    barangay: "Halang",
    occupancy: 60,
    capacity: 180,
    status: "open",
  },
  {
    name: "Looc Evacuation Center",
    barangay: "Looc",
    occupancy: 220,
    capacity: 220,
    status: "full",
  },
];

/** Headline command stats grid (municipal-wide). */
const STATS: ICommandStat[] = [
  {
    id: "affected-households",
    label: "Apektadong Pamilya",
    value: AFFECTED_HOUSEHOLDS.toLocaleString("en-PH"),
    unit: "pamilya",
    detail: `Sa ${BARANGAYS_COVERED} barangay ng Calamba, Laguna.`,
    badge: `BUONG ${BARANGAYS_COVERED}`,
    tone: "caution",
    trend: "up",
    icon: "users",
  },
  {
    id: "evac-shelters",
    label: "Evacuation Shelters",
    value: "4 / 6",
    unit: "bukas",
    detail: "66% kapasidad na — 2 sentro na puno. Monitor ang occupancy.",
    badge: "AKTIBO",
    tone: "caution",
    trend: "up",
    icon: "home",
  },
  {
    id: "ldrrmf",
    label: "LDRRM Fund Compliance",
    value: `${utilizationPct(LDRRMF_SPENT, LDRRMF_ALLOCATED)}%`,
    unit: "nagamit",
    detail: "₱28.1M sa ₱45.2M. COA Tier-1 verified ang paggastos.",
    badge: "COA TIER-1",
    tone: "good",
    trend: "flat",
    icon: "chart",
  },
  {
    id: "cdra",
    label: "CDRA Risk Index",
    value: "Mababa",
    unit: "/ Stable",
    detail: "Composite score 2.4 / 10 batay sa municipal telemetry.",
    badge: "STABLE",
    tone: "good",
    trend: "down",
    icon: "shield",
  },
  {
    id: "hydro",
    label: "San Cristobal River Hydrology",
    value: "4.12",
    unit: "m",
    detail: "Stage Level: Normal. +1.26m pababa sa 5.50m critical spillway.",
    badge: "LINK OK",
    tone: "good",
    trend: "down",
    icon: "water",
  },
  {
    id: "relief-depot",
    label: "Strategic Relief Depot",
    value: (4820).toLocaleString("en-PH"),
    unit: "food packs",
    detail: "+310 Water Purification Kits — handa sa agarang deployment.",
    badge: "DEPOT A",
    tone: "info",
    trend: "flat",
    icon: "box",
  },
];

/**
 * Assemble the municipal command-center payload. `fetchedAt` is stamped at
 * call time so the "last updated" surface is always current.
 */
export function getMunicipalDashboardData(): IMunicipalDashboardData {
  return {
    summary: {
      activeModule: "M7 DRRM OPS & PLANNING",
      title: "MDRRMO Municipal Command Center",
      municipality: MUNICIPALITY,
      province: PROVINCE,
      region: REGION,
      subtitle:
        `Consolidated tactical intelligence feed across ${BARANGAYS_COVERED} lakeshore, riverine and upland barangays. COA Tier-1 verified telemetry.`,
      status: "activated",
      summaryItems: [
        { label: "EOC SITREP", value: "RUNNING", tone: "accent" },
        { label: "Signal", value: "No. 2", tone: "alert" },
        { label: "BDRRMCs Online", value: `${BARANGAYS_COVERED}/${BARANGAYS_COVERED}`, tone: "neutral" },
      ],
    },
    modules: MODULES,
    stats: STATS,
    evacuation: EVACUATION,
    fund: {
      fiscalYear: FISCAL_YEAR,
      allocated: LDRRMF_ALLOCATED,
      spent: LDRRMF_SPENT,
      utilizationPct: utilizationPct(LDRRMF_SPENT, LDRRMF_ALLOCATED),
      mitigationFund: MITIGATION_FUND,
      quickResponseFund: QUICK_RESPONSE_FUND,
      complianceTier: "Tier-1",
    },
    relief: {
      foodPacks: 4820,
      waterCapacityLpd: 310,
      rescueUnits: 10,
      rescueBoats: 4,
      note: "Handa sa agarang deployment mula sa Strategic Relief Depot A.",
    },
    cdra: {
      score: 2.4,
      verdict: "Mababa / Stable",
      tone: "good",
      methodology: "CCC-HLURB CDRA methodology",
    },
    agencies: [
      {
        agency: "PAGASA + OCD Sync",
        status: "synced",
        detail: "Normal OCD Region IV-A link. Doppler early warning confirmed.",
      },
      {
        agency: "OCD CALABARZON",
        status: "synced",
        detail: "Tactical uplink active — SITREP forwarding tuloy-tuloy.",
      },
      {
        agency: "PDRRMC Laguna",
        status: "pending",
        detail: "Naghihintay ng pag-apruba sa consolidated DANA report.",
      },
    ],
    directives: [
      {
        title: "Preemptive Evacuation",
        authority: "Mayor's Office / MDRRMO",
        reference: "LDRRM Resolution No. 04",
        status: "enforced",
      },
      {
        title: "Relief Goods Re-pre-positioning",
        authority: "MSWDO",
        reference: "Disaster reserves AIP line",
        status: "under-review",
      },
      {
        title: "Riverine Barangay Inspection",
        authority: "MDRRMO",
        reference: "See coastal bulkhead integrity checklist",
        status: "pending",
      },
    ],
    affectedHouseholds: AFFECTED_HOUSEHOLDS,
    barangaysCovered: BARANGAYS_COVERED,
    source: COMMAND_SOURCE,
    fetchedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Municipal Official (lgu) Command Center — editable seed + static references
// ===========================================================================
//
// Scope: City of Calamba, Laguna ONLY. Nothing below references any
// other municipality (v6 matrix §10/§14: no cross-municipality data).
// SCOPE REDUCTION: headline counts say 54 barangays, but lists carry only the
// 5 featured barangays (incl. Parian with the agreed figures) and other
// lists keep 2–3 items. Demo content strings are Filipino (UI chrome uses t()).

/** The municipality this command center covers (fixed scope). */
export const MUN_LOCATION: ILocation = {
  name: "Calamba",
  province: "Laguna",
  lat: 14.2117,
  lon: 121.1653,
  region: "CALABARZON",
};

/** Attribution for every municipal data surface. */
export const MUN_SOURCE =
  "Pinagmulan: MDRRMO Calamba · NDRRMC · PAGASA · COA/DBM (demo data)";

/** OpenStreetMap embed centred on Calamba, Laguna (14.2117N 121.1653E). */
export const MUN_OSM_EMBED =
  "https://www.openstreetmap.org/export/embed.html?bbox=121.11%2C14.16%2C121.22%2C14.26&layer=mapnik&marker=14.2117%2C121.1653";

/** Full-page OSM link for the same view. */
export const MUN_OSM_LINK =
  "https://www.openstreetmap.org/?mlat=14.2117&mlon=121.1653#map=14/14.2117/121.1653";

/** Headline barangay count (lists show only the featured 5). */
export const MUN_BARANGAY_COUNT = 54;

const BARANGAYS: IMunBarangay[] = [
  { id: "parian", name: "Parian", lat: 14.2135, lon: 121.16, setting: "coastal", population: 5200, hazards: ["flood", "storm-surge"], riskIndex: 7.8, atRiskResidents: 1240, atRiskNote: "Purok 3 & 4", affectedHouseholds: 520, complianceScore: 92, bdrrmcOnline: true, ldrrmfAllocated: 1_500_000, ldrrmfSpent: 960_000, cropDamagePhp: 1_850_000, pestRisk: "high", pestNote: "Rice black bug sa lakeshore paddies.", livestockHeads: 420, pcicEnrolled: 180, farmers: 240, inventoryFoodPacks: 600, reliefDelivered: 300, reliefNeeded: 520, checklistAck: false },
  { id: "lingga", name: "Lingga", lat: 14.2205, lon: 121.182, setting: "riverine", population: 6100, hazards: ["flood"], riskIndex: 7.2, atRiskResidents: 980, affectedHouseholds: 380, complianceScore: 78, bdrrmcOnline: true, ldrrmfAllocated: 1_400_000, ldrrmfSpent: 770_000, cropDamagePhp: 1_420_000, pestRisk: "high", pestNote: "Brown planthopper — mataas na humidity.", livestockHeads: 380, pcicEnrolled: 150, farmers: 260, inventoryFoodPacks: 520, reliefDelivered: 200, reliefNeeded: 380, checklistAck: false },
  { id: "palingon", name: "Palingon", lat: 14.224, lon: 121.172, setting: "riverine", population: 4800, hazards: ["flood", "liquefaction"], riskIndex: 6.9, atRiskResidents: 760, affectedHouseholds: 260, complianceScore: 74, bdrrmcOnline: true, ldrrmfAllocated: 1_200_000, ldrrmfSpent: 696_000, cropDamagePhp: 1_100_000, pestRisk: "medium", pestNote: "Rice bug sa gilid ng ilog.", livestockHeads: 300, pcicEnrolled: 120, farmers: 210, inventoryFoodPacks: 400, reliefDelivered: 120, reliefNeeded: 260, checklistAck: false },
  { id: "bucal", name: "Bucal", lat: 14.188, lon: 121.17, setting: "riverine", population: 5600, hazards: ["flood", "landslide"], riskIndex: 6.5, atRiskResidents: 690, affectedHouseholds: 180, complianceScore: 66, bdrrmcOnline: false, ldrrmfAllocated: 1_300_000, ldrrmfSpent: 585_000, cropDamagePhp: 980_000, pestRisk: "medium", pestNote: "Leaf folder sa palayan.", livestockHeads: 340, pcicEnrolled: 140, farmers: 230, inventoryFoodPacks: 420, reliefDelivered: 80, reliefNeeded: 180, checklistAck: false },
  { id: "brgy-1", name: "Barangay 1 (Poblacion)", lat: 14.2117, lon: 121.1653, setting: "urban", population: 3100, hazards: ["flood"], riskIndex: 4.2, atRiskResidents: 210, affectedHouseholds: 80, complianceScore: 90, bdrrmcOnline: true, ldrrmfAllocated: 1_200_000, ldrrmfSpent: 840_000, cropDamagePhp: 40_000, pestRisk: "low", pestNote: "Walang aktibong outbreak.", livestockHeads: 20, pcicEnrolled: 5, farmers: 10, inventoryFoodPacks: 260, reliefDelivered: 80, reliefNeeded: 80, checklistAck: true },
];

const CENTERS: IMunEvacCenter[] = [
  { id: "sc-convention", name: "Calamba City Central Evacuation Hub", barangay: "Barangay 1 (Poblacion)", occupancy: 350, capacity: 350, status: "full", isPrimaryHub: true, supplies: "Food packs, tubig, medical station" },
  { id: "sr-gym", name: "Parian Covered Gym", barangay: "Parian", occupancy: 300, capacity: 400, status: "open", supplies: "Food packs, sleeping mats" },
  { id: "sr-elem", name: "Parian Elementary School", barangay: "Parian", occupancy: 0, capacity: 250, status: "standby", supplies: "Naka-standby" },
  { id: "lingga-court", name: "Lingga Covered Court", barangay: "Lingga", occupancy: 98, capacity: 100, status: "near-full", supplies: "Food packs, generator" },
  { id: "san-hall", name: "Palingon Multi-Purpose Hall", barangay: "Palingon", occupancy: 64, capacity: 70, status: "near-full", supplies: "Food packs, tubig" },
  { id: "bucal-court", name: "Bucal Covered Court", barangay: "Bucal", occupancy: 0, capacity: 30, status: "standby", supplies: "Naka-standby" },
];

/** Build a fresh seed. Dates are relative to `now` so deadline badges stay meaningful. */
export function buildSeed(now: Date = new Date()): IMunicipalState {
  const iso = (mins: number) => new Date(now.getTime() - mins * 60_000).toISOString();
  const day = (d: number) => format(addDays(now, d), "yyyy-MM-dd");
  const dana: IMunDanaReport[] = [
    { barangayId: "parian", status: "submitted", submittedAt: iso(40), affectedFamilies: 520, casualties: 0, housesDamaged: 18, infraDamagePhp: 2_400_000, agriDamagePhp: 1_850_000 },
    { barangayId: "lingga", status: "submitted", submittedAt: iso(80), affectedFamilies: 380, casualties: 0, housesDamaged: 12, infraDamagePhp: 1_100_000, agriDamagePhp: 1_420_000 },
    { barangayId: "palingon", status: "submitted", submittedAt: iso(120), affectedFamilies: 260, casualties: 0, housesDamaged: 9, infraDamagePhp: 650_000, agriDamagePhp: 1_100_000 },
    { barangayId: "bucal", status: "not-submitted", affectedFamilies: 180, casualties: 0, housesDamaged: 0, infraDamagePhp: 0, agriDamagePhp: 980_000 },
    { barangayId: "brgy-1", status: "approved", submittedAt: iso(200), affectedFamilies: 80, casualties: 0, housesDamaged: 2, infraDamagePhp: 150_000, agriDamagePhp: 40_000, reviewNote: "Na-validate ng MDRRMO." },
  ];
  const budget: IMunBudgetLine[] = [
    { id: "aip-1", item: "San Cristobal River Dredging Ph.2", office: "MEO", amountPhp: 12_500_000, ccet: "adaptation", ccetCode: "A-WS-01" },
    { id: "aip-2", item: "Solar Street Lights (Poblacion)", office: "MEO", amountPhp: 2_400_000, ccet: "mitigation", ccetCode: "M-EN-01" },
    { id: "aip-3", item: "Relief Goods Pre-positioning", office: "MSWDO", amountPhp: 3_000_000, ccet: "none" },
  ];
  const checklist: IMunChecklistItem[] = [
    { id: "pre-1", phase: "pre", label: "I-pre-position ang relief goods sa lahat ng evacuation center", done: true },
    { id: "dur-1", phase: "during", label: "I-monitor ang occupancy ng lahat ng center bawat oras", done: false },
    { id: "post-1", phase: "post", label: "Kolektahin at i-consolidate ang DANA ng lahat ng barangay", done: false },
  ];

  return {
    version: 1,
    barangays: BARANGAYS.map((b) => ({ ...b })),
    centers: CENTERS.map((c) => ({ ...c })),
    dana,
    projects: [
      { id: "prj-seawall", name: "Parian Lakeshore Dike", barangay: "Parian", budgetPhp: 5_200_000, completionPct: 85, status: "ongoing", contractor: "Laguna Coastal Builders (demo)", updatedAt: iso(600) },
      { id: "prj-dredging", name: "San Cristobal River Dredging Ph.2", barangay: "Munisipyo", budgetPhp: 12_500_000, completionPct: 40, status: "ongoing", contractor: "DPWH Laguna (demo)", updatedAt: iso(1440) },
      { id: "prj-drainage", name: "Bucal Drainage Upgrade", barangay: "Bucal", budgetPhp: 2_100_000, completionPct: 60, status: "delayed", contractor: "MEO Calamba", updatedAt: iso(2880) },
    ],
    reports: [
      { id: "rpt-sr-1", barangay: "Parian", title: "Baradong kanal sa Purok 3", body: "Umaapaw ang tubig sa kalsada kapag umuulan nang malakas.", status: "resolved", response: "Nalinis na ng BDRRMC at MEO ang kanal.", createdAt: iso(4320), updatedAt: iso(2880) },
      { id: "rpt-sr-2", barangay: "Parian", title: "Sirang ilaw papuntang evacuation", body: "Madilim ang daan papuntang Central Gym sa gabi.", status: "resolved", response: "Napalitan na ang ilaw (MEO work order).", createdAt: iso(2880), updatedAt: iso(1440) },
      { id: "rpt-lingga-1", barangay: "Lingga", title: "Kulang ang tubig sa covered court", body: "Halos puno na ang Lingga Covered Court at kulang ang inuming tubig.", status: "open", createdAt: iso(90), updatedAt: iso(90) },
      { id: "rpt-pag-1", barangay: "Bucal", title: "Bitak sa riverbank wall", body: "May nakitang bitak sa pader sa tabi ng ilog, Sitio Ibaba.", status: "open", createdAt: iso(180), updatedAt: iso(180) },
    ],
    budget,
    checklist,
    sitreps: [
      { id: "sit-1", direction: "up", from: "BDRRMC Parian", to: "MDRRMC Calamba", summary: "300/400 sa Central Gym; 1,240 residente at-risk sa Purok 3 & 4. DANA naipadala.", at: iso(45) },
      { id: "sit-2", direction: "up", from: "BDRRMC Lingga", to: "MDRRMC Calamba", summary: "Covered Court halos puno (98/100). Humihingi ng karagdagang tubig.", at: iso(80) },
    ],
    directives: [
      { id: "dir-evac", title: "Preemptive Evacuation", detail: "Lingga + Palingon riverbank households — sapilitang paglikas.", badge: "ENFORCED", status: "enforced" },
      { id: "dir-relief", title: "Relief Release Authorization", detail: "Batch 3 — ₱1.2M food at non-food items mula sa QRF.", badge: "SIGNED - BATCH 3", status: "signed" },
      { id: "dir-eng", title: "Engineering Bypass Re-inspection", detail: "Parian coastal bulkhead — structural re-inspection ng MEO.", badge: "IN PROGRESS", status: "in-progress" },
    ],
    deadlines: [
      { id: "dl-ccet", scope: "municipal", title: "CCET submission sa DBM/CCC", dueDate: day(6), basis: "JMC 2015-01" },
      { id: "dl-lccap", scope: "municipal", title: "LCCAP update", dueDate: day(12), basis: "RA 9729" },
      { id: "dl-pag", scope: "Bucal", title: "BDRRMF Q3 utilization report", dueDate: day(-2), basis: "JMC 2013-1" },
    ],
    lccap: [
      { id: "lc-1", title: "Climate Profile ng Calamba", progressPct: 100, status: "adopted" },
      { id: "lc-2", title: "Vulnerability Assessment", progressPct: 80, status: "review" },
      { id: "lc-3", title: "Adaptation at Mitigation Actions", progressPct: 50, status: "draft" },
    ],
    cdra: [
      { id: "cd-1", title: "Climate at hazard info + exposure database", barangaysDone: 54, done: true },
      { id: "cd-2", title: "Vulnerability at risk estimation", barangaysDone: 14, done: false },
      { id: "cd-3", title: "Decision areas at policy interventions", barangaysDone: 4, done: false },
    ],
    clup: [
      { id: "z-1", zone: "Lakeshore Residential", areaHa: 320, hazardOverlap: ["flood", "storm-surge"], climateInformed: false },
      { id: "z-2", zone: "Agricultural Lowland", areaHa: 1450, hazardOverlap: ["flood"], climateInformed: true },
      { id: "z-3", zone: "Riverbank Easement", areaHa: 95, hazardOverlap: ["flood", "liquefaction"], climateInformed: false },
    ],
    depot: { foodPacks: 4820, waterKits: 310, rescueTrucks: 6, rubberBoats: 4 },
    rcef: [{ barangayId: "parian", seedBags: 120 }],
    emergencyActive: true,
    emergencyLevel: 3,
    audit: [],
  };
}

/** Default seed (module-load time). */
export const MUN_SEED_STATE: IMunicipalState = buildSeed();

// --- Static (non-editable) references ---

export const MUN_HYDRO = {
  station: "San Cristobal Gauge 04",
  levelM: 4.12,
  criticalM: 5.5,
  marginM: 1.38,
  tidePeakM: 0.42,
  tidePeakAt: "21:15H",
  rateMPerHr: -0.05,
};

export const MUN_STATION = {
  name: "San Cristobal Bridge (Brgy. Real)",
  hydraulicCapacityPct: 58,
  note: "Walang backwater flow mula sa Laguna de Bay.",
};

/** CDRA composite (CCC-HLURB). */
export const MUN_CDRA = { score: 2.4, thresholdPct: 24 };

export const MUN_AGENCIES: IAgencySync[] = [
  { agency: "PAGASA & OCD Sync", status: "synced", detail: "Doppler early warning + OCD Region IV-A link normal." },
  { agency: "OCD CALABARZON TOC", status: "synced", detail: "Tactical uplink — SitRep forwarding tuloy-tuloy." },
  { agency: "PDRRMC Laguna", status: "pending", detail: "Naghihintay ng consolidated DANA ng Calamba." },
];

export interface IMunSiteTile {
  id: string;
  title: string;
  status: string;
  icon: IconName;
  /** Gradient classes (theme tokens). */
  gradient: string;
}

export const MUN_SITE_TILES: IMunSiteTile[] = [
  { id: "riverine", title: "Riverine Sector 4", status: "Active Sweep", icon: "boat", gradient: "from-navy to-teal" },
  { id: "depo", title: "Central Depo Log-1", status: "Dispatch Ready", icon: "truck", gradient: "from-teal to-navy" },
  { id: "gauge", title: "San Cristobal Gauge 04", status: "Telemetry 100%", icon: "water", gradient: "from-navy via-navy to-teal" },
];

export const MUN_TYPHOON = {
  name: "Severe Tropical Storm (demo)",
  windKph: 110,
  gustKph: 150,
  track: [
    { time: "12:00H", label: "210 km silangan ng Infanta, Quezon" },
    { time: "18:00H", label: "120 km silangan-hilagang-silangan ng Calamba" },
    { time: "00:00H", label: "Landfall forecast: hilagang Quezon" },
  ],
};

export interface IMunTrendRow {
  label: string;
  value: string;
  /** 0–100 relative magnitude for the bar. */
  magnitudePct: number;
}

export const MUN_PROJECTIONS: IMunTrendRow[] = [
  { label: "Temperatura (2036–2065)", value: "+1.2°C hanggang +1.8°C", magnitudePct: 60 },
  { label: "Ulan sa tag-ulan (JJA)", value: "+8% hanggang +15%", magnitudePct: 45 },
  { label: "Ulan sa tag-init (MAM)", value: "−10% hanggang −25%", magnitudePct: 55 },
];

export const MUN_DISASTER_HISTORY: IMunTrendRow[] = [
  { label: "2009 Bagyong Ondoy", value: "6,200 pamilya · ₱180M", magnitudePct: 100 },
  { label: "2020 Bagyong Ulysses", value: "2,900 pamilya · ₱64M", magnitudePct: 47 },
  { label: "2024 Bagyong Kristine", value: "3,300 pamilya · ₱75M", magnitudePct: 53 },
];

export const MUN_CROP_DAMAGE_TREND: IMunTrendRow[] = [
  { label: "Agosto", value: "₱2.3M", magnitudePct: 50 },
  { label: "Setyembre", value: "₱3.05M", magnitudePct: 66 },
  { label: "Oktubre", value: "₱4.6M", magnitudePct: 100 },
];

export const MUN_CROP_CALENDAR: string[] = [
  "Palay (wet season): tanim Hunyo–Hulyo · ani Oktubre–Nobyembre.",
  "Palay (dry season): tanim Disyembre–Enero · ani Abril–Mayo.",
];

/** Harvest-timing guidance (view only per matrix). */
export const MUN_HARVEST_TIMING =
  "Palay sa Parian at Lingga: 85–90% hinog — anihin bago ang landfall kung ligtas.";

export const MUN_LIVESTOCK_ADVISORY: string[] = [
  "Ilipat ang kalabaw, baka at baboy sa mataas na lugar bago tumaas ang tubig.",
  "Ihanda ang 3 araw na pakain at malinis na tubig.",
];

export const MUN_ENSO_STRATEGY: Record<IEnsoPhase, string> = {
  "el-nino": "Unahin ang drought-tolerant na binhi (RCEF) at i-schedule ang irigasyon.",
  "la-nina": "Unahin ang flood-tolerant na binhi sa lakeshore/riverine at mag-preposition ng buffer stock.",
  neutral: "Normal na distribusyon ayon sa DA crop calendar; panatilihin ang 10% seed buffer.",
};

export interface IMunGuideSection {
  id: string;
  title: string;
  steps: string[];
}

export const MUN_SAFETY_GUIDE: IMunGuideSection[] = [
  { id: "signal", title: "Ayon sa signal (1–5)", steps: ["Signal 1–2: ihanda ang go-bag; ilikas ang nasa riverbank.", "Signal 3: sapilitang paglikas sa high-risk na purok.", "Signal 4–5: manatili sa evacuation center hanggang may all-clear."] },
  { id: "go-bag", title: "Go-bag at kalusugan", steps: ["Tubig (3 araw), pagkain, gamot, flashlight, ID.", "Pakuluan ang inuming tubig; doxycycline ayon sa RHU."] },
  { id: "crop", title: "Pananim, hayop at kagamitan", steps: ["Anihin ang hinog na palay kung ligtas; itaas ang binhi at pump.", "Ilipat ang hayop sa mataas na lugar."] },
  { id: "dana", title: "Community evacuation at DANA", steps: ["Unahin ang PWD, senior, buntis at bata.", "Isumite ng BDRRMC ang initial DANA sa loob ng 3 oras."] },
];

export interface IMunIndicator {
  id: string;
  label: string;
  pass: boolean;
}

export const MUN_COMPLIANCE_INDICATORS: IMunIndicator[] = [
  { id: "ind-1", label: "Functional MDRRMC + approved LDRRM Plan", pass: true },
  { id: "ind-2", label: "LCCAP updated (RA 9729)", pass: false },
  { id: "ind-3", label: "CCET submitted (JMC 2015-01)", pass: false },
];

export const MUN_KNOWLEDGE_SOURCES: string[] = [
  "Panahon at PAGASA signals (10-weather.md)",
  "Agrikultura — DA / PhilRice (20-agriculture.md)",
  "DRRM — RA 10121, NDRRMC (30-drrm.md)",
];

export const MUN_HOTLINES: IHotline[] = [
  { label: "Emergency Hotline", number: "911", tel: "tel:911" },
  { label: "Philippine Red Cross", number: "143", tel: "tel:143" },
  { label: "NDRRMC", number: "(02) 8911-1406", tel: "tel:+6328911406" },
  { label: "PAGASA", number: "(02) 8284-0800", tel: "tel:+6328284080" },
];

/** SitRep recipients (labeled placeholders — no real numbers). */
export const MUN_PDRRMC = "PDRRMC Laguna";

export function bdrrmcLabel(barangayName: string): string {
  return `BDRRMC ${barangayName}`;
}

/** IDs of flood-control infrastructure projects shown on the stat card. */
export const MUN_FLOOD_PROJECT_IDS = ["prj-seawall", "prj-dredging"];

/**
 * Dev invariant check for the seed (brief data-consistency rules). Returns the
 * list of violated invariants — empty when the seed is consistent.
 */
export function assertMunSeedInvariants(state: IMunicipalState = MUN_SEED_STATE): string[] {
  const errors: string[] = [];
  const hh = state.barangays.reduce((s, b) => s + b.affectedHouseholds, 0);
  if (hh !== 1420) errors.push(`affectedHouseholds sum ${hh} ≠ 1420`);
  const sr = state.barangays.find((b) => b.name === "Parian");
  if (!sr || sr.atRiskResidents !== 1240 || sr.atRiskNote !== "Purok 3 & 4") errors.push("Parian at-risk ≠ 1,240 Purok 3 & 4");
  const gym = state.centers.find((c) => c.id === "sr-gym");
  if (!gym || gym.occupancy !== 300 || gym.capacity !== 400) errors.push("Parian Covered Gym ≠ 300/400");
  const elem = state.centers.find((c) => c.id === "sr-elem");
  if (!elem || elem.status !== "standby" || elem.capacity !== 250) errors.push("Parian Elem ≠ standby 250");
  const srReports = state.reports.filter((r) => r.barangay === "Parian");
  if (srReports.length !== 2 || srReports.some((r) => r.status !== "resolved")) errors.push("Parian reports ≠ 2 resolved / 0 pending");
  if (state.projects.find((p) => p.id === "prj-seawall")?.completionPct !== 85) errors.push("Parian Lakeshore Dike ≠ 85%");
  const occ = state.centers.reduce((s, c) => s + c.occupancy, 0);
  const cap = state.centers.reduce((s, c) => s + c.capacity, 0);
  if (occ !== 812 || cap !== 1200) errors.push(`centers ${occ}/${cap} ≠ 812/1200`);
  if (state.centers.filter((c) => c.status !== "standby" && c.status !== "closed").length !== 4) errors.push("open centers ≠ 4");
  if (utilizationPct(LDRRMF_SPENT, LDRRMF_ALLOCATED) !== 62) errors.push("LDRRMF ≠ 62%");
  return errors;
}

/** Municipal LDRRMF (shared with the legacy payload). */
export const MUN_FUND = {
  fiscalYear: FISCAL_YEAR,
  allocated: LDRRMF_ALLOCATED,
  spent: LDRRMF_SPENT,
};
