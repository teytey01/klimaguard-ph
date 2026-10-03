import type { IAdvisoryInput, ICropProfile, IEnsoPhase } from "@/types";

// Static, demo-grade agronomic data for common Philippine crops.
// Thresholds are drawn from DA crop calendars + PhilRice guidance and are
// intentionally hardcoded for the hackathon demo (the brief allows this).
// The crop list is location-agnostic — advisory suitability is derived live
// from Open-Meteo weather for whatever location the user selects. Only the
// crop profiles, the ENSO phase, and the offline chat seed live here.

/** Shared attribution — rendered on every advisory output (REQUIRED). */
export const AGRI_SOURCE = "Ayon sa DA / PhilRice / Open-Meteo";

/**
 * Common PH crop set: rice (palay), coconut (niyog), and root crops
 * (gabi, kamote). Nationally relevant; thresholds are coarse demo values,
 * not field-calibrated.
 */
export const PH_CROPS: ICropProfile[] = [
  {
    id: "palay",
    name: "Palay (bigas)",
    shortName: "palay",
    emoji: "🌾",
    idealTempC: { min: 22, max: 32 },
    heavyRainChance: 70,
    blastHumidity: 85,
    source: AGRI_SOURCE,
  },
  {
    id: "niyog",
    name: "Niyog (coconut)",
    shortName: "niyog",
    emoji: "🥥",
    idealTempC: { min: 24, max: 34 },
    heavyRainChance: 80,
    source: AGRI_SOURCE,
  },
  {
    id: "gabi",
    name: "Gabi",
    shortName: "gabi",
    emoji: "🌱",
    idealTempC: { min: 21, max: 30 },
    heavyRainChance: 75,
    source: AGRI_SOURCE,
  },
  {
    id: "kamote",
    name: "Kamote",
    shortName: "kamote",
    emoji: "🍠",
    idealTempC: { min: 20, max: 30 },
    heavyRainChance: 65,
    source: AGRI_SOURCE,
  },
];

/** Resolve a crop profile by id, defaulting to palay (the PH staple). */
export function getCropProfile(id: string): ICropProfile {
  return PH_CROPS.find((c) => c.id === id) ?? PH_CROPS[0];
}

/**
 * Demo ENSO phase. No live ENSO feed exists in the repo; flip this constant to
 * "el-nino" or "la-nina" to exercise the impact-warning text.
 */
export const DEMO_ENSO_PHASE: IEnsoPhase = "neutral";

/**
 * Deterministic, offline weather seed for the synchronous chat demo path
 * (`buildReply` has no live weather access). Mild typical PH conditions:
 * warm, moderate humidity, low rain + wind so planting/spray stay favorable.
 */
export const DEMO_ADVISORY_INPUT: IAdvisoryInput = {
  current: {
    temperatureC: 30,
    weatherCode: 2,
    humidity: 78,
    rainChance: 20,
    windSpeedKmh: 10,
  },
  forecast: [
    { date: "", weatherCode: 2, highC: 32, lowC: 24, rainChance: 20 },
    { date: "", weatherCode: 2, highC: 32, lowC: 24, rainChance: 30 },
    { date: "", weatherCode: 3, highC: 31, lowC: 24, rainChance: 40 },
  ],
  ensoPhase: DEMO_ENSO_PHASE,
};
