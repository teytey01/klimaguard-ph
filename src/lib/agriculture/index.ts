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

export type {
  IAdvisoryInput,
  ICropAdvisory,
  ICropProfile,
  ICropSuitability,
  IEnsoPhase,
  IPlantingVerdict,
  ISprayVerdict,
} from "@/types";
