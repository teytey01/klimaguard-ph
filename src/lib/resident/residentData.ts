import type { IconName } from "@/types";
import type { ITranslationKey } from "@/lib/i18n";

// Static config for the Resident dashboard (view-only consumer role per the
// KlimaGuard documentation: Residents get M1 chat, M2 weather, M3 alerts,
// M4 safety, M11 transparency view-only — no M5/M6/M7/M10).

/** The resident dashboard tab ids. */
export type IResidentTab =
  | "weather"
  | "alerts"
  | "evacuation"
  | "familyKit"
  | "hotlines"
  | "relief"
  | "reports"
  | "chat"
  | "farmSafety";

export interface IResidentTabDef {
  id: IResidentTab;
  labelKey: ITranslationKey;
  icon: IconName;
  /** When set, the tab only shows for these roles. */
  roles?: Array<"resident" | "farmer" | "barangay" | "lgu">;
}

export const RESIDENT_TABS: IResidentTabDef[] = [
  { id: "weather", labelKey: "res.tab.weather", icon: "sun" },
  { id: "alerts", labelKey: "res.tab.alerts", icon: "alert-triangle" },
  { id: "evacuation", labelKey: "res.tab.evacuation", icon: "location" },
  // M4 farmer-only: crop protection, livestock evacuation, equipment checklist.
  { id: "farmSafety", labelKey: "res.tab.farmSafety", icon: "sprout", roles: ["farmer"] },
  { id: "familyKit", labelKey: "res.tab.familyKit", icon: "box" },
  { id: "hotlines", labelKey: "res.tab.hotlines", icon: "phone" },
  { id: "relief", labelKey: "res.tab.relief", icon: "warehouse" },
  { id: "reports", labelKey: "res.tab.reports", icon: "scroll" },
  { id: "chat", labelKey: "res.tab.chat", icon: "radio" },
];

/** Sidebar role-switcher entries. */
export interface IRoleNavDef {
  role: "resident" | "farmer" | "barangay" | "lgu";
  labelKey: ITranslationKey;
  icon: IconName;
  /** When set, selecting the role navigates to this route. */
  href?: string;
}

export const ROLE_NAV: IRoleNavDef[] = [
  { role: "resident", labelKey: "res.roleResident", icon: "shield" },
  { role: "farmer", labelKey: "res.roleFarmer", icon: "sprout" },
  { role: "barangay", labelKey: "res.roleBarangay", icon: "radio" },
  { role: "lgu", labelKey: "res.roleMunicipal", icon: "command" },
];

/** Sidebar "Active Modules" entries (resident scope). */
export interface IModuleNavDef {
  id: string;
  labelKey: ITranslationKey;
  icon: IconName;
  /** Which tab this module focuses when clicked. */
  tab: IResidentTab;
}

export const RESIDENT_MODULES: IModuleNavDef[] = [
  { id: "chat", labelKey: "res.modChat", icon: "radio", tab: "chat" },
  { id: "weather", labelKey: "res.modWeather", icon: "cloud", tab: "weather" },
  { id: "alerts", labelKey: "res.modAlerts", icon: "alert-triangle", tab: "alerts" },
  { id: "evac", labelKey: "res.modEvac", icon: "location", tab: "evacuation" },
  { id: "relief", labelKey: "res.modRelief", icon: "warehouse", tab: "relief" },
  { id: "settings", labelKey: "res.modSettings", icon: "command", tab: "weather" },
];

/** A family emergency kit checklist item. */
export interface IKitItem {
  id: string;
  labelKey: ITranslationKey;
}

export const FAMILY_KIT_ITEMS: IKitItem[] = [
  { id: "water", labelKey: "res.kit.water" },
  { id: "food", labelKey: "res.kit.food" },
  { id: "firstAid", labelKey: "res.kit.firstAid" },
  { id: "flashlight", labelKey: "res.kit.flashlight" },
  { id: "radio", labelKey: "res.kit.radio" },
  { id: "documents", labelKey: "res.kit.documents" },
  { id: "cash", labelKey: "res.kit.cash" },
  { id: "meds", labelKey: "res.kit.meds" },
  { id: "whistle", labelKey: "res.kit.whistle" },
  { id: "phone", labelKey: "res.kit.phone" },
];

/** Demo nearest-evacuation-center info for a resident in Calamba/Santa Cruz. */
export interface IResidentEvac {
  name: string;
  meters: number;
  minutes: number;
  route: string;
  capacity: string;
}

export const DEMO_EVAC: IResidentEvac = {
  name: "San Roque Central Gym",
  meters: 500,
  minutes: 6,
  route: "Dumiretso sa Rizal St.",
  capacity: "320 / 400",
};
