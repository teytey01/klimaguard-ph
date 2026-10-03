// agriculture domain logic (M5)
export {
  AGRI_SOURCE,
  DEMO_ADVISORY_INPUT,
  DEMO_ENSO_PHASE,
  getCropProfile,
  PH_CROPS,
} from "@/lib/agriculture/cropData";

export {
  buildCropAdvisories,
  buildCropAdvisory,
  buildCropAdvisoryById,
  derivePestWarnings,
  derivePlanting,
  deriveEnsoWarning,
  deriveSprayWindow,
  deriveSuitability,
} from "@/lib/agriculture/advisory";

export {
  assessCropDamageRisk,
  CROP_RISK_LABELS,
  FARM_HAZARD_SOURCE,
  FARM_SAFETY_SECTIONS,
} from "@/lib/agriculture/farmHazard";
export type { IFarmHazardInput } from "@/lib/agriculture/farmHazard";

export type {
  IAdvisoryInput,
  ICropAdvisory,
  ICropProfile,
  ICropSuitability,
  IEnsoPhase,
  IPlantingVerdict,
  ISprayVerdict,
} from "@/types";
