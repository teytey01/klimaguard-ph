// transparency domain data (M11)
export {
  CATEGORY_LABELS,
  DEFAULT_TRANSPARENCY_PROVINCE,
  getTransparencyData,
  toTransparencyEmbed,
  TRANSPARENCY_ERROR,
  TRANSPARENCY_SOURCE,
  utilizationPct,
} from "@/lib/transparency/transparencyData";

export {
  DEFAULT_MUNICIPALITY,
  DEFAULT_PROVINCE,
  disbursedPct,
  findBarangayInText,
  getLocalProjectById,
  getLocalProjects,
  LOCAL_PROJECTS_ERROR,
  LOCAL_PROJECTS_SOURCE,
  localProjectsDigest,
  PROJECT_CATEGORY_LABELS,
  PROJECT_STATUS_LABELS,
  toLocalProjectsEmbed,
} from "@/lib/transparency/localProjects";
export type { ILocalProjectsFilter } from "@/lib/transparency/localProjects";

export type {
  IBudgetCategory,
  IBudgetLine,
  IFundTimelineEntry,
  ITransparencyData,
  ITransparencyEmbedData,
} from "@/types";
