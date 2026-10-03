// shared types

import type { IconName } from "@/components/common/Icon";

// Re-export so consumers can import IconName from "@/types" alongside the
// domain types that reference it.
export type { IconName } from "@/components/common/Icon";

/** Who authored a chat message. */
export type MessageRole = "user" | "agent";

/**
 * Placeholder embed shapes for the inline cards the agent can attach to a
 * message. For M1 the real WeatherCard / AlertBanner / CropAdvisory components
 * are later modules, so the `data` payloads are intentionally minimal. They
 * exist to wire up (and type-check) the embedding path end to end.
 */
export interface IWeatherEmbedData {
  location: string;
  summary: string;
  temperatureC: number;
  source: string;
}

export interface IAlertEmbedData {
  title: string;
  message: string;
  severity: "info" | "warning" | "emergency";
  source: string;
}

export interface ICropEmbedData {
  crop: string;
  advice: string;
  source: string;
}

/**
 * Minimal transparency summary for the inline chat embed. Mirrors how
 * `IWeatherEmbedData` is a small subset of the full payload — NOT the whole
 * `ITransparencyData`.
 */
export interface ITransparencyEmbedData {
  province: string;
  totalAllocated: number;
  totalSpent: number;
  /** Utilization as a whole-number percentage (spent / allocated). */
  utilizationPct: number;
  source: string;
}

/** Discriminated union of inline cards an agent message may embed. */
export type IMessageEmbed =
  | { kind: "weather"; data: IWeatherEmbedData }
  | { kind: "alert"; data: IAlertEmbedData }
  | { kind: "crop"; data: ICropEmbedData }
  | { kind: "transparency"; data: ITransparencyEmbedData };

/** A single chat message in the conversation. */
export interface IMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  embed?: IMessageEmbed;
}

/** A single tappable suggestion ("One Action" principle). */
export interface ISuggestion {
  id: string;
  label: string;
}

/** One prior turn sent to /api/chat so the AI keeps conversation context. */
export interface IChatHistoryTurn {
  role: "user" | "agent";
  content: string;
}

/** Language the user picked in the EN/FIL toggle; the AI replies in it. */
export type IChatLanguage = "fil" | "en";

/** Request body accepted by the /api/chat Route Handler. */
export interface IChatRequest {
  message: string;
  history?: IChatHistoryTurn[];
  /** Defaults to Filipino when omitted. */
  language?: IChatLanguage;
}

/** Shape returned by the /api/chat Route Handler (Groq-backed KlimaChat). */
export interface IChatResponse {
  reply: string;
  suggestion?: ISuggestion;
  embed?: IMessageEmbed;
}

// === M2 Weather + M8 Location ===

/** A selected place the weather is shown for. */
export interface ILocation {
  name: string;
  province: string;
  lat: number;
  lon: number;
  region?: string;
}

/** A normalized geocoding hit (province = Open-Meteo `admin1`). */
export interface IGeocodingResult {
  name: string;
  admin1: string;
  lat: number;
  lon: number;
  country_code: string;
}

/** Response shape of the /api/geocoding Route Handler. */
export interface IGeocodingResponse {
  results: IGeocodingResult[];
}

/** Which provider the weather data came from (used for attribution). */
export type IWeatherSource = "Open-Meteo" | "PAGASA";

/** Current conditions for the selected location. */
export interface ICurrentWeather {
  temperatureC: number;
  /** Apparent ("feels like") temperature, °C. */
  feelsLikeC: number;
  weatherCode: number;
  humidity: number;
  rainChance: number;
  windSpeedKmh: number;
}

/** A single day in the daily forecast (up to 10 days). */
export interface IForecastDay {
  /** ISO date, yyyy-MM-dd. */
  date: string;
  weatherCode: number;
  highC: number;
  lowC: number;
  rainChance: number;
  /** Which provider produced this day (attribution per day when merged). */
  source?: IWeatherSource;
  /** PAGASA TenDay extras — rainfall amount (mm/day), not a probability. */
  rainfallMm?: number;
  /** PAGASA descriptors, e.g. "LIGHT RAINS" / "PARTLY CLOUDY". */
  rainfallDesc?: string;
  cloudDesc?: string;
  meanC?: number;
  humidity?: number;
  /** Wind speed in m/s as PAGASA reports it. */
  windMs?: number;
}

/** Metadata about a PAGASA TenDay forecast issuance. */
export interface IPagasaTenDayMeta {
  /** ISO date the forecast was issued. */
  issued: string;
  /** ISO date the forecast is valid until (inclusive). */
  validUntil: string;
  /** Underlying model, e.g. "GFS by NOAA". */
  model: string;
  location: string;
}

/**
 * One day of a PAGASA TenDay forecast, before normalization to `IForecastDay`.
 * Mirrors the fields PAGASA's TenDay payload is expected to expose. Kept
 * distinct from `IForecastDay` so the PAGASA-specific shape (and its
 * attribution) is explicit at the wrapper boundary.
 */
export interface IPagasaForecast {
  /** ISO date, yyyy-MM-dd. */
  date: string;
  /** Raw PAGASA sky-condition description (English), e.g. "Cloudy skies". */
  description: string;
  highC: number;
  lowC: number;
  /** Rainfall probability, % (0 when PAGASA omits it). */
  rainChance: number;
  /** Attribution — always "PAGASA" for this shape. */
  source: Extract<IWeatherSource, "PAGASA">;
}

/**
 * Flat current-conditions shape returned by `getCurrentWeather()` in
 * `lib/api/weather.ts`. This is the compact, display-ready view (Filipino
 * `condition` label already resolved) consumed directly by WeatherCard-style
 * UI. It is intentionally distinct from the nested `IWeatherData` payload the
 * /api/weather Route Handler returns.
 */
export interface IOpenMeteoCurrentWeather {
  /** Rounded air temperature, °C. */
  temperature: number;
  /** Rounded apparent ("feels like") temperature, °C. */
  feelsLike: number;
  /** Filipino weather description incl. emoji, e.g. "Umuulan 🌧️". */
  condition: string;
  /** Relative humidity, %. */
  humidity: number;
  /** Precipitation probability, %. */
  rainChance: number;
  /** Wind speed, km/h. */
  windSpeed: number;
  /** ISO timestamp of when the data was fetched. */
  lastUpdated: string;
  /** Attribution — always "Open-Meteo" here. */
  source: IWeatherSource;
}

/** Full weather payload returned by the /api/weather Route Handler. */
export interface IWeatherData {
  location: ILocation;
  current: ICurrentWeather;
  forecast: IForecastDay[];
  /** Provider of the CURRENT conditions. */
  source: IWeatherSource;
  /** Present when any forecast days come from a PAGASA TenDay issuance. */
  pagasaTenDay?: IPagasaTenDayMeta;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
  /**
   * True when the live provider was unreachable (e.g. Open-Meteo daily quota /
   * HTTP 429) and this is the last-known-good reading served from cache rather
   * than fresh data. The UI shows a Filipino "maaaring luma na" note.
   */
  stale?: boolean;
  /** Optional Filipino notice shown with stale data. */
  notice?: string;
}

// === M5 Agriculture ===

/** Climate suitability verdict for a crop. */
export type ICropSuitability = "good" | "caution" | "bad";

/** Whether it is safe to plant now. */
export type IPlantingVerdict = "go" | "wait";

/** Whether conditions suit spraying (wind + rain). */
export type ISprayVerdict = "ideal" | "marginal" | "avoid";

/** ENSO phase driving El Niño / La Niña impact warnings. */
export type IEnsoPhase = "el-nino" | "la-nina" | "neutral";

/** Static per-crop profile + agronomic thresholds (DA / PhilRice demo data). */
export interface ICropProfile {
  /** Stable id, e.g. "palay" | "niyog" | "gabi" | "kamote". */
  id: string;
  /** Filipino display name, e.g. "Palay (bigas)". */
  name: string;
  /** Short name used in action lines, e.g. "palay". */
  shortName: string;
  emoji: string;
  idealTempC: { min: number; max: number };
  /** rainChance (%) above which planting the next few days is risky. */
  heavyRainChance: number;
  /** Rice-blast humidity (%) trigger (palay only). */
  blastHumidity?: number;
  /** Attribution string shown on every advisory output. REQUIRED. */
  source: string;
}

/** Inputs the pure advisory derivation functions operate on. */
export interface IAdvisoryInput {
  current: ICurrentWeather;
  forecast: IForecastDay[];
  ensoPhase: IEnsoPhase;
}

/** A fully derived advisory for one crop. */
export interface ICropAdvisory {
  crop: string;
  emoji: string;
  suitability: ICropSuitability;
  /** Filipino label: "Mainam" / "Mag-ingat" / "Huwag muna". */
  suitabilityLabel: string;
  /** One actionable Filipino line. */
  action: string;
  planting: { verdict: IPlantingVerdict; message: string };
  spray: { verdict: ISprayVerdict; message: string };
  /** Pest/disease warnings, e.g. rice-blast; empty when none. */
  pestWarnings: string[];
  /** Present only when the ENSO phase is relevant (not neutral). */
  ensoWarning?: string;
  /** Attribution — REQUIRED. */
  source: string;
}

/** Response shape of the /api/agriculture Route Handler. */
export interface IAgricultureResponse {
  location: ILocation;
  advisories: ICropAdvisory[];
  source: string;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
}

// === M11 Transparency ===

/** The four DRRM (Disaster Risk Reduction and Management) spending pillars. */
export type IBudgetCategory =
  | "prevention"
  | "preparedness"
  | "response"
  | "recovery";

/** One category line of a province's DRRM budget. */
export interface IBudgetLine {
  category: IBudgetCategory;
  /** Filipino display label, e.g. "Pag-iwas". */
  label: string;
  /** Pesos allocated to this category. */
  allocated: number;
  /** Pesos spent from this category. */
  spent: number;
}

/** A dated fund release or disbursement in the DRRM timeline. */
export interface IFundTimelineEntry {
  /** ISO date, yyyy-MM-dd. */
  date: string;
  /** Filipino description of the event. */
  label: string;
  /** Pesos involved in this event. */
  amount: number;
  type: "release" | "disbursement";
}

/** Full DRRM transparency payload returned by the /api/transparency route. */
export interface ITransparencyData {
  province: string;
  fiscalYear: number;
  totalAllocated: number;
  totalSpent: number;
  lines: IBudgetLine[];
  timeline: IFundTimelineEntry[];
  /** Attribution — REQUIRED on every data surface. */
  source: string;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
}

// === M11 Transparency — per-project local tracker ===

/** Implementation status of a local climate/DRRM project. */
export type IProjectStatus = "ongoing" | "completed" | "delayed" | "planned";

/** What kind of climate/DRRM work a project is. */
export type IProjectCategory =
  | "flood-control"
  | "drainage"
  | "evacuation-center"
  | "early-warning"
  | "reforestation"
  | "irrigation";

/** One dated progress update / milestone on a project. */
export interface IProjectMilestone {
  /** ISO date, yyyy-MM-dd. */
  date: string;
  /** Filipino description of what happened. */
  label: string;
  done: boolean;
}

/** A single locally implemented climate/DRRM project (demo data). */
export interface ILocalProject {
  id: string;
  /** Filipino-friendly project name. */
  name: string;
  barangay: string;
  municipality: string;
  province: string;
  category: IProjectCategory;
  implementingOffice: string;
  contractor: string;
  fundingSource: string;
  /** Approved budget, PHP. */
  approvedBudget: number;
  /** Amount disbursed so far, PHP. */
  disbursed: number;
  /** Physical accomplishment, 0–100. */
  progressPct: number;
  status: IProjectStatus;
  /** ISO dates, yyyy-MM-dd. */
  startDate: string;
  targetEndDate: string;
  /** Short Filipino description. */
  description: string;
  /** Who benefits, e.g. "~1,200 pamilya". */
  beneficiaries: string;
  milestones: IProjectMilestone[];
}

/** Response of the /api/transparency route (per-project tracker). */
export interface ILocalProjectsResponse {
  municipality: string;
  province: string;
  projects: ILocalProject[];
  /** Distinct barangays across ALL projects (for filters). */
  barangays: string[];
  totalBudget: number;
  totalDisbursed: number;
  /** True while the dataset is illustrative demo data. */
  isDemo: boolean;
  /** Attribution — REQUIRED on every data surface. */
  source: string;
  fetchedAt: string;
}

// === M3/M4 Farmer additions: crop damage risk + farm/livestock safety ===

/** A user-facing string in both UI languages (Filipino is the default). */
export interface IBilingualText {
  fil: string;
  en: string;
}

/** Crop damage risk level (M3 farmer view). */
export type ICropDamageRiskLevel = "low" | "moderate" | "high" | "severe";

/** One crop's expected exposure under the current hazard. */
export interface ICropExposure {
  cropId: string;
  emoji: string;
  name: IBilingualText;
  impact: IBilingualText;
}

/** Derived crop damage risk + livestock protection advisory for a farmer. */
export interface ICropDamageRisk {
  level: ICropDamageRiskLevel;
  label: IBilingualText;
  /** Why this level — e.g. signal, heavy rain, strong wind, heat. */
  drivers: IBilingualText[];
  crops: ICropExposure[];
  /** One immediate action for crops. */
  cropAction: IBilingualText;
  /** Livestock protection advisory lines (most urgent first). */
  livestock: IBilingualText[];
  /** Attribution — REQUIRED. */
  source: string;
}

/** A checklist item in the farm/livestock safety advisor (M4 farmer view). */
export interface IFarmSafetyItem {
  id: string;
  text: IBilingualText;
}

/** A section of the farm/livestock safety advisor. */
export interface IFarmSafetySection {
  id: "crops" | "livestock" | "equipment";
  title: IBilingualText;
  subtitle: IBilingualText;
  icon: IconName;
  items: IFarmSafetyItem[];
}

// === M3 Hazard Alerts + M4 Safety Advisor ===

export interface IHazardAlert {
  signalLevel: 1 | 2 | 3 | 4 | 5;
  typhoonName: string;
  affectedAreas: string[];
  timestamp: string;
  severity: "advisory" | "warning" | "emergency";
}

export interface IEvacuationCenter {
  name: string;
  distance: string;
  capacity: string;
  directionsUrl: string;
}

export interface IHotline {
  label: string;
  number: string;
  tel: string;
}

export interface IAlertState {
  hasActiveHazard: boolean;
  alert: IHazardAlert | null;
  evacuationCenters: IEvacuationCenter[];
  hotlines: IHotline[];
  source: string;
  fetchedAt: string;
}

// === M6/M7 Municipal Command Center (Municipal Official dashboard) ===
//
// Types backing the MDRRMO command-center dashboard. Scope is the Municipal
// Official column of the v6 Feature Access Matrix: municipal-wide affected
// population, all evacuation centers, LDRRMF compliance, CDRA risk, relief
// logistics, inter-agency sync, and transparency command directives. All
// data surfaces REQUIRE a `source` attribution string.

/** Operational posture for the whole municipality. */
export type ICommandStatus = "normal" | "monitoring" | "activated";

/** A single operational-summary pill in the command title bar. */
export interface ICommandSummaryItem {
  /** Short Filipino/English label, e.g. "EOC SITREP". */
  label: string;
  /** Value, e.g. "LIVE", "Signal 2". */
  value: string;
  /** Visual tone of the pill. */
  tone: "accent" | "neutral" | "alert";
}

/** The municipal command title + operational summary bar. */
export interface ICommandSummary {
  /** Active module badge text, e.g. "M7 DRRM OPS & PLANNING". */
  activeModule: string;
  title: string;
  municipality: string;
  province: string;
  region: string;
  /** One-line consolidated feed description. */
  subtitle: string;
  status: ICommandStatus;
  summaryItems: ICommandSummaryItem[];
}

/** One entry in the 11-module municipal navigation bar. */
export interface IModuleNavItem {
  /** Module id, e.g. "M1".."M11". */
  id: string;
  /** Display label, e.g. "Overview", "DRRM Operations". */
  label: string;
  /** Inline SVG icon name (no external asset dependency). */
  icon: IconName;
  /** `operations` = amber active-capable; `planning` = brown (M6/M7/M10). */
  kind: "operations" | "planning";
  /** Whether this is the currently active module tab. */
  active?: boolean;
}

/** Delta direction for a stat, drives the trend indicator. */
export type IStatTrend = "up" | "down" | "flat";

/** Severity/health tone for a stat card badge. */
export type IStatTone = "good" | "caution" | "critical" | "info";

/** A single headline stat tile in the command grid. */
export interface ICommandStat {
  id: string;
  /** Filipino-first label, e.g. "Apektadong Pamilya". */
  label: string;
  /** Primary value, pre-formatted for display, e.g. "1,420". */
  value: string;
  /** Optional unit/suffix, e.g. "pamilya", "shelters". */
  unit?: string;
  /** Short context line under the value. */
  detail: string;
  /** Small status badge text, e.g. "ALL 26", "ACTIVE". */
  badge?: string;
  tone: IStatTone;
  trend?: IStatTrend;
  icon: IconName;
}

/** Live occupancy for one evacuation center (municipal-wide view, M4/M7). */
export interface IEvacuationStatus {
  name: string;
  barangay: string;
  /** Current number of evacuees. */
  occupancy: number;
  /** Maximum capacity. */
  capacity: number;
  status: "open" | "near-full" | "full";
}

/** LDRRMF compliance roll-up (reuses the transparency utilization math). */
export interface IFundCompliance {
  fiscalYear: number;
  /** Pesos appropriated for the LDRRMF (full 70/30 split). */
  allocated: number;
  spent: number;
  /** Whole-number utilization %, 0–100. */
  utilizationPct: number;
  /** 70% mitigation fund share, pesos. */
  mitigationFund: number;
  /** 30% Quick Response Fund share, pesos. */
  quickResponseFund: number;
  /** COA/DILG compliance tier label, e.g. "Tier-1". */
  complianceTier: string;
}

/** Relief logistics depot status (M5/M7 logistics & relief). */
export interface IReliefLogistics {
  /** Ready-to-deploy family food packs. */
  foodPacks: number;
  /** Water purification capacity, liters/day. */
  waterCapacityLpd: number;
  rescueUnits: number;
  rescueBoats: number;
  /** Warehouse readiness note (Filipino). */
  note: string;
}

/** CDRA (Climate & Disaster Risk Assessment) composite verdict (M6). */
export interface ICdraRisk {
  /** Composite score, 0–10. */
  score: number;
  /** Filipino verdict label, e.g. "Mababa / Stable". */
  verdict: string;
  tone: IStatTone;
  /** Methodology attribution, e.g. "CCC-HLURB CDRA". */
  methodology: string;
}

/** Inter-agency / PAGASA-OCD sync status (M9 inter-agency hub). */
export interface IAgencySync {
  agency: string;
  status: "synced" | "pending" | "offline";
  /** Filipino detail line. */
  detail: string;
}

/** A single official command directive (M11 transparency / governance). */
export interface ICommandDirective {
  title: string;
  authority: string;
  /** Legal basis, e.g. "LDRRM Resolution No. 04". */
  reference: string;
  status: "enforced" | "pending" | "under-review";
}

/**
 * Full municipal command-center payload. Everything the Municipal Official
 * dashboard renders, aggregated for one municipality. Demo-grade until live
 * NDRRMC/COA/PAGASA feeds land; `source` + `fetchedAt` are REQUIRED.
 */
export interface IMunicipalDashboardData {
  summary: ICommandSummary;
  modules: IModuleNavItem[];
  stats: ICommandStat[];
  evacuation: IEvacuationStatus[];
  fund: IFundCompliance;
  relief: IReliefLogistics;
  cdra: ICdraRisk;
  agencies: IAgencySync[];
  directives: ICommandDirective[];
  /** Total affected households, municipal-wide. */
  affectedHouseholds: number;
  /** Number of barangays covered. */
  barangaysCovered: number;
  /** Attribution — REQUIRED on every data surface. */
  source: string;
  /** ISO timestamp of when the data was assembled. */
  fetchedAt: string;
}

// === Municipal Official (lgu) Command Center — editable operations state ===
//
// Municipal-wide state (v6 matrix, Municipal Official column): all 26
// barangays, all evacuation centers, consolidated DANA, projects/reports of
// ANY barangay in the municipality, municipal budget + CCET tags, CLUP zones,
// sitreps up (PDRRMC) / down (BDRRMCs), and an audit log of every edit.
// Demo-grade, persisted client-side (localStorage). Never crosses municipalities.

export type IMunEvacStatus = "open" | "near-full" | "full" | "standby" | "closed";

export interface IMunEvacCenter {
  id: string;
  name: string;
  barangay: string;
  occupancy: number;
  capacity: number;
  status: IMunEvacStatus;
  isPrimaryHub?: boolean;
  supplies: string;
}

export type IMunHazard = "flood" | "landslide" | "storm-surge" | "liquefaction";

export type IMunSetting = "coastal" | "riverine" | "upland" | "urban";

export type IMunPestRisk = "low" | "medium" | "high";

export interface IMunBarangay {
  id: string;
  name: string;
  lat: number;
  lon: number;
  setting: IMunSetting;
  population: number;
  hazards: IMunHazard[];
  /** Composite risk index, 0–10. */
  riskIndex: number;
  atRiskResidents: number;
  atRiskNote?: string;
  affectedHouseholds: number;
  /** Compliance score, 0–100. */
  complianceScore: number;
  bdrrmcOnline: boolean;
  ldrrmfAllocated: number;
  ldrrmfSpent: number;
  cropDamagePhp: number;
  pestRisk: IMunPestRisk;
  pestNote: string;
  livestockHeads: number;
  pcicEnrolled: number;
  farmers: number;
  inventoryFoodPacks: number;
  reliefDelivered: number;
  reliefNeeded: number;
  checklistAck: boolean;
}

export type IMunDanaStatus = "not-submitted" | "submitted" | "approved" | "returned";

export interface IMunDanaReport {
  barangayId: string;
  status: IMunDanaStatus;
  submittedAt?: string;
  affectedFamilies: number;
  casualties: number;
  housesDamaged: number;
  infraDamagePhp: number;
  agriDamagePhp: number;
  reviewNote?: string;
}

export type IMunProjectStatus = "planned" | "ongoing" | "completed" | "delayed";

export interface IMunProject {
  id: string;
  name: string;
  /** Barangay name, or "Munisipyo" for municipal-wide projects. */
  barangay: string;
  budgetPhp: number;
  completionPct: number;
  status: IMunProjectStatus;
  contractor: string;
  updatedAt: string;
}

export interface IMunReport {
  id: string;
  barangay: string;
  title: string;
  body: string;
  status: IReportStatus;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export type IMunCcetTag = "adaptation" | "mitigation" | "none";

export interface IMunBudgetLine {
  id: string;
  item: string;
  office: string;
  amountPhp: number;
  ccet: IMunCcetTag;
  ccetCode?: string;
}

export interface IMunChecklistItem {
  id: string;
  label: string;
  done: boolean;
  phase: "pre" | "during" | "post";
}

export interface IMunSitrep {
  id: string;
  direction: "up" | "down";
  from: string;
  to: string;
  summary: string;
  at: string;
}

export type IMunDirectiveStatus = "enforced" | "signed" | "in-progress" | "pending";

export interface IMunDirective {
  id: string;
  title: string;
  detail: string;
  badge: string;
  status: IMunDirectiveStatus;
}

export interface IMunDeadline {
  id: string;
  /** "municipal" or a barangay name. */
  scope: string;
  title: string;
  /** yyyy-MM-dd */
  dueDate: string;
  basis: string;
}

export interface IMunLccapSection {
  id: string;
  title: string;
  progressPct: number;
  status: "draft" | "review" | "adopted";
}

export interface IMunCdraStep {
  id: string;
  title: string;
  barangaysDone: number;
  done: boolean;
}

export interface IMunClupZone {
  id: string;
  zone: string;
  areaHa: number;
  hazardOverlap: IMunHazard[];
  climateInformed: boolean;
}

export interface IMunAuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

export interface IMunDepot {
  foodPacks: number;
  waterKits: number;
  rescueTrucks: number;
  rubberBoats: number;
}

export interface IMunRcefAllocation {
  barangayId: string;
  seedBags: number;
}

export type IMunEmergencyLevel = 1 | 2 | 3 | 4 | 5;

export interface IMunicipalState {
  version: number;
  barangays: IMunBarangay[];
  centers: IMunEvacCenter[];
  dana: IMunDanaReport[];
  projects: IMunProject[];
  reports: IMunReport[];
  budget: IMunBudgetLine[];
  checklist: IMunChecklistItem[];
  sitreps: IMunSitrep[];
  directives: IMunDirective[];
  deadlines: IMunDeadline[];
  lccap: IMunLccapSection[];
  cdra: IMunCdraStep[];
  clup: IMunClupZone[];
  depot: IMunDepot;
  rcef: IMunRcefAllocation[];
  emergencyActive: boolean;
  emergencyLevel: IMunEmergencyLevel;
  audit: IMunAuditEntry[];
}

/** Result of a municipal store action (Filipino error on failure). */
export type IMunActionResult = { ok: true } | { ok: false; error: string };

export type IMunModuleTab =
  | "overview"
  | "m1"
  | "m2"
  | "m3"
  | "m4"
  | "m5"
  | "m6"
  | "m7"
  | "m8"
  | "m9"
  | "m10"
  | "m11"
  | "settings";

export type IMunPrintMode = "none" | "dana" | "toc";

// === Onboarding + Auth (resident sign-in, OTP, SMS) ===

/** The four KlimaGuard roles (v6 Feature Access Matrix). */
export type IUserRole = "resident" | "farmer" | "barangay" | "lgu";

/** Primary crop options for the farmer onboarding step. */
export type ICropChoice = "rice" | "corn" | "vegetable" | "aquaculture";

/** Crop growth stage (drives harvest-priority advisories). */
export type IGrowthStage = "new" | "growing" | "harvest";

/** A resolved onboarding location (defaults to Calamba, Laguna). */
export interface IOnboardingLocation {
  region: string;
  province: string;
  municipality: string;
  barangay: string;
}

/** The critical permission toggles on the final onboarding step. */
export interface IOnboardingPermissions {
  emergencyAlerts: boolean;
  smsFallback: boolean;
  evacuationGuidance: boolean;
}

/** Farmer-specific details collected on step 3. */
export interface IFarmerDetails {
  crop: ICropChoice;
  stage: IGrowthStage;
}

/** Resident-specific details collected on step 3. */
export interface IResidentDetails {
  householdSize: number;
  hasVulnerableMembers: boolean;
}

/**
 * The full onboarding draft, assembled across the 4 steps. Role-specific
 * blocks are optional until the matching step is completed.
 */
export interface IOnboardingState {
  role: IUserRole | null;
  location: IOnboardingLocation;
  resident?: IResidentDetails;
  farmer?: IFarmerDetails;
  permissions: IOnboardingPermissions;
  /** SMS opt-in number (E.164-ish, "+63XXXXXXXXXX"); from the verified session. */
  smsNumber?: string;
}

/** OTP verification status for the sign-in flow. */
export type IOtpStatus = "idle" | "sending" | "sent" | "verifying" | "verified";

/** Transient OTP state for the sign-in screen. */
export interface IOtpState {
  status: IOtpStatus;
  /** The number the code was sent to, in display form. */
  sentTo: string | null;
  error: string | null;
}

/**
 * A verified resident session. Persisted to localStorage (demo-grade — no
 * server session). Name + mobile are collected and OTP-verified for Residents.
 */
export interface IAuthSession {
  /** Server user id (DB-backed sessions). */
  id?: string;
  name: string;
  /**
   * Masked display copy of the mobile number, e.g. "+63 917 ••• 4567". The
   * raw number is never sent to the client — the DB stores only an HMAC hash.
   */
  mobile: string;
  role: IUserRole;
  verified: boolean;
  /** ISO timestamp of verification. */
  verifiedAt: string;
  /** True once the 4-step onboarding is saved (officials are pre-onboarded). */
  onboarded?: boolean;
  /** Officials only: pre-assigned identity. */
  username?: string;
  position?: string;
  department?: string;
  /** Barangay-level location scope (barangay is "" for municipal officials). */
  location?: IOnboardingLocation;
}

/** Response shape of GET /api/auth/me. */
export interface IAuthMeResponse {
  session: IAuthSession | null;
}

// === SMS (simulated broadcast) ===

/** Kind of SMS the system sends. */
export type ISmsKind = "otp" | "hazard-alert" | "digest";

/** A single simulated SMS broadcast entry for the on-screen log. */
export interface ISmsBroadcast {
  id: string;
  kind: ISmsKind;
  /** Recipient numbers (display form) this message targeted. */
  recipients: string[];
  message: string;
  /** ISO timestamp. */
  sentAt: string;
  /** Attribution source, e.g. "NDRRMC", "KlimaGuard PH". */
  source: string;
}

// === M11 Community reports (DB-backed) ===

export type IReportStatus = "open" | "responded" | "resolved";

/** Client-safe community report. Reporter identity is never included. */
export interface ICommunityReport {
  id: string;
  title: string;
  body: string;
  status: IReportStatus;
  barangay: string;
  municipality: string;
  /** Official response, when one exists. */
  response?: string;
  createdAt: string;
  updatedAt: string;
  /** True when the signed-in viewer submitted this report. */
  mine: boolean;
}

/** Response shape of GET /api/reports. */
export interface IReportsResponse {
  reports: ICommunityReport[];
  /** Whether the viewer may respond (officials in scope). */
  canRespond: boolean;
  /** Human-readable scope, e.g. "Brgy. Parian, Calamba". */
  scopeLabel: string;
}

// === Barangay Official dashboard ===
//
// Barangay-scoped operations state (v6 matrix, Barangay Official column):
// own evacuation centers, Tanod/BDRRMC teams, river telemetry, barangay relief
// inventory + distribution, incident log, pre-disaster checklist, barangay
// DANA (3-hour deadline to MDRRMC), barangay QRF, own projects, and an audit
// trail of every official edit (WHO / WHEN / WHAT). Demo-grade, localStorage.

/** Every view the Barangay dashboard can render (tabs + sidebar modules). */
export type IBarangayView =
  | "ops"
  | "evacuation"
  | "tanod"
  | "river"
  | "relief"
  | "reports"
  | "chat"
  | "weather"
  | "drrm"
  | "safety"
  | "agriculture"
  | "planning"
  | "analytics"
  | "transparency"
  | "audit";

export type IBarangayEvacStatus = "standby" | "open" | "near-full" | "full";

/** One of the barangay's OWN evacuation centers (status is derived). */
export interface IBarangayEvacCenter {
  id: string;
  name: string;
  purok: string;
  occupancy: number;
  capacity: number;
  /** False = standby (not yet opened). */
  active: boolean;
}

export type IBarangayTeamStatus =
  | "patrol"
  | "standby"
  | "security"
  | "logistics"
  | "dispatched";

/** A BDRRMC / Barangay Tanod response team. */
export interface IBarangayTanodTeam {
  id: string;
  name: string;
  members: number;
  status: IBarangayTeamStatus;
  assignment: string;
  purok: string;
  /** ISO timestamp of the last status change. */
  updatedAt: string;
}

export type IBarangayRiverStatus = "normal" | "watch" | "alert" | "critical";

export interface IBarangayRiverReading {
  /** ISO timestamp. */
  at: string;
  levelM: number;
}

/** River gauge telemetry with the barangay's warning thresholds (meters). */
export interface IBarangayRiverSensor {
  id: string;
  station: string;
  levelM: number;
  history: IBarangayRiverReading[];
  normalMaxM: number;
  alertM: number;
  criticalM: number;
  /** ISO timestamp of the last sensor ping / manual reading. */
  lastPingAt: string;
}

export type IBarangayReliefId = "food" | "water" | "firstAid";

/** One line of the barangay relief goods inventory. */
export interface IBarangayReliefItem {
  id: IBarangayReliefId;
  quantity: number;
  unit: string;
  note: string;
}

/** Who/when of the last physical stock count. */
export interface IBarangayStockCount {
  at: string;
  by: string;
}

/** A relief distribution batch (barangay relief distribution tracker). */
export interface IBarangayDistribution {
  id: string;
  purok: string;
  familiesServed: number;
  familiesTarget: number;
  packsGiven: number;
  at: string;
}

export type IBarangayReportStatus = "pending" | "responded" | "resolved";

/** A BDRRMC-verified citizen incident (hotline / KlimaChat / walk-in). */
export interface IBarangayIncidentReport {
  id: string;
  title: string;
  location: string;
  status: IBarangayReportStatus;
  response?: string;
  reportedAt: string;
  resolvedAt?: string;
}

/** A toggleable checklist item (pre-disaster checklist, CDRA steps). */
export interface IBarangayChecklistItem {
  id: string;
  done: boolean;
}

/** Barangay DANA form (Damage Assessment and Needs Analysis). */
export interface IBarangayDanaForm {
  startedAt: string | null;
  submittedAt: string | null;
  affectedFamilies: number;
  affectedPersons: number;
  dead: number;
  injured: number;
  missing: number;
  housesDamaged: number;
  /** Auto-filled from the M5 barangay crop-damage total. */
  agricultureDamagePhp: number;
  needs: string;
  /** Generated situation report, set on submit to MDRRMC. */
  sitrep: string | null;
}

export interface IBarangayQrfEntry {
  id: string;
  label: string;
  amount: number;
  at: string;
}

/** Barangay Quick Response Fund (30% of the BDRRMF). */
export interface IBarangayQrf {
  /** Total BDRRMF, pesos. */
  bdrrmf: number;
  /** QRF allocation (30% of BDRRMF), pesos. */
  allocated: number;
  entries: IBarangayQrfEntry[];
}

/** Affected population per purok (barangay scope only). */
export interface IBarangayPopulation {
  purok: string;
  label: string;
  individuals: number;
  families: number;
  vulnerable: number;
  evacuated: number;
  unaccounted: number;
}

export type IBarangayProjectStatus = "planned" | "ongoing" | "completed";

/** An infrastructure project (M11). Only own-barangay rows are editable. */
export interface IBarangayProject {
  id: string;
  name: string;
  barangay: string;
  completionPct: number;
  status: IBarangayProjectStatus;
  editable: boolean;
}

export type IBarangayAuditCategory =
  | "evacuation"
  | "tanod"
  | "river"
  | "relief"
  | "reports"
  | "drrm"
  | "safety"
  | "agriculture"
  | "planning"
  | "transparency"
  | "system";

/** One audited official edit: WHO / WHEN / WHAT (in memory). */
export interface IBarangayAuditEntry {
  id: string;
  at: string;
  who: string;
  what: string;
  category: IBarangayAuditCategory;
}

/** The whole barangay operations state (in memory, demo-grade). */
export interface IBarangayOpsState {
  barangay: string;
  centers: IBarangayEvacCenter[];
  teams: IBarangayTanodTeam[];
  river: IBarangayRiverSensor;
  relief: IBarangayReliefItem[];
  stockCount: IBarangayStockCount;
  distributions: IBarangayDistribution[];
  reports: IBarangayIncidentReport[];
  checklist: IBarangayChecklistItem[];
  checklistActivatedAt: string | null;
  dana: IBarangayDanaForm;
  qrf: IBarangayQrf;
  population: IBarangayPopulation[];
  projects: IBarangayProject[];
  /** Barangay CDRA progress (of 6 CCC-HLURB steps). */
  cdraStepsDone: number;
  /** LCCAP barangay input progress (of 5 plan sections). */
  lccapSectionsDone: number;
  cropDamagePhp: number;
  audit: IBarangayAuditEntry[];
}
