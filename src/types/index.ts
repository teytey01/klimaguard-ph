// shared types

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

/** Shape returned by the /api/chat Route Handler (the Amazon Quick stand-in). */
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

/** A single day in the 7-day forecast. */
export interface IForecastDay {
  /** ISO date, yyyy-MM-dd. */
  date: string;
  weatherCode: number;
  highC: number;
  lowC: number;
  rainChance: number;
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
  source: IWeatherSource;
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
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
