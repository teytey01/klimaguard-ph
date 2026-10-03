import type {
  IconName,
  ICropChoice,
  IGrowthStage,
  IOnboardingState,
  IUserRole,
} from "@/types";
import type { ITranslationKey } from "@/lib/i18n";

// Static config for the onboarding flow. Role cards, crop/stage options, and
// the default draft (location pre-filled to Santa Cruz, Laguna per the Stitch
// screens; the app's env default is Calamba, also Laguna / CALABARZON).

/** A role card for onboarding step 1. */
export interface IRoleCard {
  role: IUserRole;
  icon: IconName;
  titleKey: ITranslationKey;
  tagKey: ITranslationKey;
  descKey: ITranslationKey;
  linkKey: ITranslationKey;
  /** Marks the Agri-Priority badge (farmer). */
  priority?: boolean;
}

export const ROLE_CARDS: IRoleCard[] = [
  {
    role: "resident",
    icon: "shield",
    titleKey: "ob.role.resident",
    tagKey: "ob.role.residentTag",
    descKey: "ob.role.residentDesc",
    linkKey: "ob.role.residentLink",
  },
  {
    role: "farmer",
    icon: "sprout",
    titleKey: "ob.role.farmer",
    tagKey: "ob.role.farmerTag",
    descKey: "ob.role.farmerDesc",
    linkKey: "ob.role.farmerLink",
    priority: true,
  },
  {
    role: "barangay",
    icon: "radio",
    titleKey: "ob.role.barangay",
    tagKey: "ob.role.barangayTag",
    descKey: "ob.role.barangayDesc",
    linkKey: "ob.role.barangayLink",
  },
  {
    role: "lgu",
    icon: "command",
    titleKey: "ob.role.lgu",
    tagKey: "ob.role.lguTag",
    descKey: "ob.role.lguDesc",
    linkKey: "ob.role.lguLink",
  },
];

/** Crop options for the farmer detail step. */
export interface ICropOption {
  value: ICropChoice;
  icon: IconName;
  labelKey: ITranslationKey;
}

export const CROP_OPTIONS: ICropOption[] = [
  { value: "rice", icon: "sprout", labelKey: "ob.details.cropRice" },
  { value: "corn", icon: "leaf", labelKey: "ob.details.cropCorn" },
  { value: "vegetable", icon: "leaf", labelKey: "ob.details.cropVegetable" },
  { value: "aquaculture", icon: "fish", labelKey: "ob.details.cropAqua" },
];

/** Growth-stage options. */
export interface IStageOption {
  value: IGrowthStage;
  labelKey: ITranslationKey;
}

export const STAGE_OPTIONS: IStageOption[] = [
  { value: "new", labelKey: "ob.details.stageNew" },
  { value: "growing", labelKey: "ob.details.stageGrowing" },
  { value: "harvest", labelKey: "ob.details.stageHarvest" },
];

/** Default onboarding draft. Location pre-filled to Santa Cruz, Laguna. */
export const DEFAULT_ONBOARDING: IOnboardingState = {
  role: null,
  location: {
    region: "Region IV-A (CALABARZON)",
    province: "Laguna",
    municipality: "Calamba",
    barangay: "Parian",
  },
  permissions: {
    emergencyAlerts: true,
    smsFallback: true,
    evacuationGuidance: true,
  },
};

// --- Location dropdown data (demo-grade, CALABARZON focus) ---
//
// Minimal cascading dataset for the onboarding location step. Default is
// Calamba, Laguna (the app's env default). Santa Cruz is also included because
// the Stitch design references it. Not exhaustive — enough for a working demo.

export interface IMunicipalityOption {
  name: string;
  /** Center for the map. */
  lat: number;
  lon: number;
  barangays: string[];
}

export interface IProvinceOption {
  name: string;
  municipalities: IMunicipalityOption[];
}

export interface IRegionOption {
  name: string;
  provinces: IProvinceOption[];
}

export const PH_REGIONS: IRegionOption[] = [
  {
    name: "Region IV-A (CALABARZON)",
    provinces: [
      {
        name: "Laguna",
        municipalities: [
          {
            name: "Calamba",
            lat: 14.2117,
            lon: 121.1653,
            barangays: [
              "Parian",
              "Real",
              "Mayapa",
              "Canlubang",
              "Halang",
              "Lingga",
              "Lecheria",
              "Banlic",
              "Bucal",
              "Pansol",
            ],
          },
          {
            name: "Santa Cruz",
            lat: 14.2792,
            lon: 121.4166,
            barangays: [
              "Poblacion I",
              "Poblacion II",
              "San Roque",
              "Pagsawitan",
              "Bubukal",
              "Patimbao",
              "Alipit",
              "Gatid",
            ],
          },
          {
            name: "Los Baños",
            lat: 14.1699,
            lon: 121.2434,
            barangays: ["Batong Malake", "Anos", "Bayog", "Mayondon", "Tadlak"],
          },
        ],
      },
      {
        name: "Cavite",
        municipalities: [
          {
            name: "Dasmariñas",
            lat: 14.3294,
            lon: 120.9367,
            barangays: ["Burol", "Salitran", "Zone I", "Paliparan", "Sampaloc"],
          },
        ],
      },
    ],
  },
];

/** OpenStreetMap embed URL centered on a point (no API key). */
export function osmEmbedUrl(lat: number, lon: number): string {
  const d = 0.08;
  const bbox = `${lon - d}%2C${lat - d}%2C${lon + d}%2C${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}
