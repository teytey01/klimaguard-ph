import type {
  IBilingualText,
  ICropDamageRisk,
  ICropDamageRiskLevel,
  ICropExposure,
  IFarmSafetySection,
  IForecastDay,
  IHazardAlert,
  ICurrentWeather,
} from "@/types";

// Farmer-only additions to M3 (crop damage risk level + livestock protection
// advisory) and M4 (crop protection steps, livestock evacuation guide, farm
// equipment securing checklist) — per the v6 Feature Access Matrix.
// Pure, deterministic rules (DA/PAGASA-style guidance); no network calls.

export const FARM_HAZARD_SOURCE =
  "Batay sa PAGASA signal + Open-Meteo forecast · Gabay mula sa DA/PhilRice (demo rules)";

export interface IFarmHazardInput {
  alert: IHazardAlert | null;
  current?: ICurrentWeather | null;
  forecast?: IForecastDay[] | null;
}

const LEVEL_ORDER: ICropDamageRiskLevel[] = ["low", "moderate", "high", "severe"];

export const CROP_RISK_LABELS: Record<ICropDamageRiskLevel, IBilingualText> = {
  low: { fil: "Mababa", en: "Low" },
  moderate: { fil: "Katamtaman", en: "Moderate" },
  high: { fil: "Mataas", en: "High" },
  severe: { fil: "Napakataas", en: "Severe" },
};

function maxLevel(a: ICropDamageRiskLevel, b: ICropDamageRiskLevel): ICropDamageRiskLevel {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

const CROPS: Record<"palay" | "mais" | "gulay" | "saging" | "niyog", Omit<ICropExposure, "impact">> = {
  palay: { cropId: "palay", emoji: "🌾", name: { fil: "Palay", en: "Rice" } },
  mais: { cropId: "mais", emoji: "🌽", name: { fil: "Mais", en: "Corn" } },
  gulay: { cropId: "gulay", emoji: "🥬", name: { fil: "Gulay", en: "Vegetables" } },
  saging: { cropId: "saging", emoji: "🍌", name: { fil: "Saging", en: "Banana" } },
  niyog: { cropId: "niyog", emoji: "🥥", name: { fil: "Niyog", en: "Coconut" } },
};

/**
 * Derive the farmer's crop damage risk from the active typhoon signal plus
 * the next 3 days of forecast (rain chance, wind, heat).
 */
export function assessCropDamageRisk({ alert, current, forecast }: IFarmHazardInput): ICropDamageRisk {
  const next3 = (forecast ?? []).slice(0, 3);
  const maxRain = Math.max(current?.rainChance ?? 0, ...next3.map((d) => d.rainChance), 0);
  const maxHigh = Math.max(...next3.map((d) => d.highC), current?.temperatureC ?? 0, 0);
  const wind = current?.windSpeedKmh ?? 0;
  const signal = alert?.signalLevel ?? 0;

  let level: ICropDamageRiskLevel = "low";
  const drivers: IBilingualText[] = [];
  let flood = false;
  let windy = false;
  let hot = false;

  if (signal > 0) {
    level = maxLevel(level, signal >= 3 ? "severe" : signal === 2 ? "high" : "moderate");
    flood = true;
    windy = signal >= 2;
    drivers.push({
      fil: `Signal No. ${signal}${alert ? ` — ${alert.typhoonName}` : ""}`,
      en: `Signal No. ${signal}${alert ? ` — ${alert.typhoonName}` : ""}`,
    });
  }
  if (maxRain >= 80) {
    level = maxLevel(level, "high");
    flood = true;
    drivers.push({ fil: `Malakas na ulan, ${maxRain}% tsansa`, en: `Heavy rain, ${maxRain}% chance` });
  } else if (maxRain >= 60) {
    level = maxLevel(level, "moderate");
    flood = true;
    drivers.push({ fil: `Madalas na ulan, ${maxRain}% tsansa`, en: `Frequent rain, ${maxRain}% chance` });
  }
  if (wind >= 60) {
    level = maxLevel(level, "high");
    windy = true;
    drivers.push({ fil: `Malakas na hangin, ${Math.round(wind)} km/h`, en: `Strong wind, ${Math.round(wind)} km/h` });
  } else if (wind >= 40) {
    level = maxLevel(level, "moderate");
    windy = true;
    drivers.push({ fil: `Mahanging panahon, ${Math.round(wind)} km/h`, en: `Windy, ${Math.round(wind)} km/h` });
  }
  if (maxHigh >= 35) {
    level = maxLevel(level, "moderate");
    hot = true;
    drivers.push({ fil: `Matinding init, hanggang ${Math.round(maxHigh)}°C`, en: `Extreme heat, up to ${Math.round(maxHigh)}°C` });
  }
  if (drivers.length === 0) {
    drivers.push({ fil: "Walang malaking banta sa susunod na 3 araw", en: "No major threat in the next 3 days" });
  }

  const crops: ICropExposure[] = [];
  if (flood) {
    crops.push({
      ...CROPS.palay,
      impact: { fil: "Puwedeng malubog at humiga (lodging) ang palay", en: "Risk of submergence and lodging" },
    });
    crops.push({
      ...CROPS.gulay,
      impact: { fil: "Mabubulok ang ugat kapag binaha ang taniman", en: "Root rot if beds flood" },
    });
  }
  if (windy) {
    crops.push({
      ...CROPS.saging,
      impact: { fil: "Madaling mabuwal ang puno ng saging", en: "Banana plants easily toppled" },
    });
    crops.push({
      ...CROPS.mais,
      impact: { fil: "Puwedeng mabali ang tangkay ng mais", en: "Corn stalks may snap" },
    });
    if (level === "severe") {
      crops.push({
        ...CROPS.niyog,
        impact: { fil: "Puwedeng malagas ang bunga at dahon ng niyog", en: "Nut and frond loss" },
      });
    }
  }
  if (hot && !flood) {
    crops.push({
      ...CROPS.gulay,
      impact: { fil: "Malalanta ang gulay kapag kulang sa dilig", en: "Wilting without irrigation" },
    });
  }

  const cropAction: Record<ICropDamageRiskLevel, IBilingualText> = {
    low: {
      fil: "Ituloy ang normal na gawain sa bukid. I-check ang forecast araw-araw.",
      en: "Continue normal farm work. Check the forecast daily.",
    },
    moderate: {
      fil: "Linisin ang kanal ng palayan at ipagpaliban muna ang pag-spray at paglalagay ng abono.",
      en: "Clear field drainage and postpone spraying and fertilizer application.",
    },
    high: {
      fil: "Anihin na ang mga hinog (≥80% hinog na palay) at itaas ang naaning butil at binhi.",
      en: "Harvest mature crops now (≥80% ripe rice) and store grain and seeds on high ground.",
    },
    severe: {
      fil: "Huwag nang pumunta sa bukid. Unahin ang buhay — lumikas kasama ang pamilya at mga hayop.",
      en: "Stay away from the fields. Lives first — evacuate with family and animals.",
    },
  };

  const livestockByLevel: Record<ICropDamageRiskLevel, IBilingualText[]> = {
    low: [
      { fil: "Siguraduhing may malinis na tubig at lilim ang mga hayop.", en: "Keep clean water and shade for animals." },
    ],
    moderate: [
      { fil: "Ipasok ang mga hayop sa kulungan tuwing malakas ang ulan.", en: "Keep animals sheltered during heavy rain." },
      { fil: "Mag-imbak ng 3 araw na pakain at tubig.", en: "Stock 3 days of feed and water." },
    ],
    high: [
      { fil: "Ilipat ang kalabaw, baka at kambing sa mataas na lugar ngayon pa lang.", en: "Move carabao, cattle and goats to high ground now." },
      { fil: "Itaas ang kulungan ng manok at baboy; patibayin ang bubong.", en: "Raise poultry and pig pens; secure roofs." },
      { fil: "Itabi ang pakain sa tuyo at mataas na lugar.", en: "Store feed in a dry, elevated place." },
    ],
    severe: [
      { fil: "Kung hindi ligtas ilipat, kalagan ang mga hayop para makatakas sa baha — huwag itali.", en: "If you can't move them safely, untie animals so they can escape floods — never leave them tied." },
      { fil: "Huwag balikan ang hayop habang may bagyo o mataas ang baha.", en: "Do not go back for animals during the storm or deep flooding." },
      { fil: "Pagkatapos ng bagyo, i-report ang patay o nawawalang hayop sa City Agriculture Office.", en: "After the storm, report dead or missing animals to the City Agriculture Office." },
    ],
  };

  return {
    level,
    label: CROP_RISK_LABELS[level],
    drivers,
    crops,
    cropAction: cropAction[level],
    livestock: livestockByLevel[level],
    source: FARM_HAZARD_SOURCE,
  };
}

/** M4 farmer safety advisor content: crops, livestock, equipment. */
export const FARM_SAFETY_SECTIONS: IFarmSafetySection[] = [
  {
    id: "crops",
    title: { fil: "Proteksyon ng Pananim", en: "Crop Protection Steps" },
    subtitle: { fil: "Gawin bago dumating ang bagyo", en: "Do these before the storm arrives" },
    icon: "sprout",
    items: [
      { id: "c1", text: { fil: "Anihin agad ang palay na ≥80% hinog na", en: "Harvest rice that is ≥80% mature" } },
      { id: "c2", text: { fil: "Buksan at linisin ang kanal at daluyan ng tubig sa bukid", en: "Open and clear field canals and drainage" } },
      { id: "c3", text: { fil: "Ipagpaliban ang pag-spray, pag-abono at pagtatanim", en: "Postpone spraying, fertilizing and planting" } },
      { id: "c4", text: { fil: "Lagyan ng tukod ang saging, mais at matataas na halaman", en: "Prop up banana, corn and tall plants" } },
      { id: "c5", text: { fil: "Itaas at takpan ang naaning butil at mga binhi", en: "Elevate and cover harvested grain and seeds" } },
      { id: "c6", text: { fil: "Kunan ng litrato ang bukid para sa PCIC crop insurance claim", en: "Photograph your field for PCIC crop insurance claims" } },
    ],
  },
  {
    id: "livestock",
    title: { fil: "Gabay sa Paglikas ng Hayop", en: "Livestock Evacuation Guide" },
    subtitle: { fil: "Ligtas na paglipat ng alagang hayop", en: "Moving your animals safely" },
    icon: "home",
    items: [
      { id: "l1", text: { fil: "Alamin ang pinakamalapit na mataas na lugar para sa hayop", en: "Know the nearest high ground for animals" } },
      { id: "l2", text: { fil: "Ilipat ang kalabaw, baka at kambing bago lumakas ang ulan", en: "Move carabao, cattle and goats before rain intensifies" } },
      { id: "l3", text: { fil: "Ilagay sa kulungan na may bubong ang manok at itik", en: "Put poultry and ducks in roofed cages" } },
      { id: "l4", text: { fil: "Magdala ng 3 araw na pakain at malinis na tubig", en: "Bring 3 days of feed and clean water" } },
      { id: "l5", text: { fil: "Lagyan ng tag o marka ang bawat hayop", en: "Tag or mark each animal" } },
      { id: "l6", text: { fil: "Huwag itali ang hayop sa lugar na puwedeng bahain", en: "Never tie animals in flood-prone areas" } },
      { id: "l7", text: { fil: "Pagkatapos ng baha, bantayan ang sakit (hal. leptospirosis) at i-report sa vet", en: "After floods, watch for disease (e.g. leptospirosis) and report to a vet" } },
    ],
  },
  {
    id: "equipment",
    title: { fil: "Pag-secure ng Kagamitan sa Bukid", en: "Farm Equipment Securing Checklist" },
    subtitle: { fil: "Iwasang masira o maanod", en: "Prevent damage or loss" },
    icon: "warehouse",
    items: [
      { id: "e1", text: { fil: "Ipasok ang kuliglig, traktora at water pump sa matibay na kamalig", en: "Store hand tractors, tractors and water pumps in a sturdy shed" } },
      { id: "e2", text: { fil: "Patayin at tanggalin sa saksakan ang irrigation pump", en: "Switch off and unplug irrigation pumps" } },
      { id: "e3", text: { fil: "Itaas ang abono, pestisidyo at gasolina — malayo sa tubig", en: "Elevate fertilizer, pesticide and fuel — away from water" } },
      { id: "e4", text: { fil: "Itali o itabi ang mga trapal, yero at maluluwag na gamit", en: "Tie down or store tarps, roofing sheets and loose items" } },
      { id: "e5", text: { fil: "Patibayin ang bubong ng kamalig at kulungan", en: "Reinforce shed and pen roofs" } },
      { id: "e6", text: { fil: "Ilista ang mga kagamitan (may litrato) para sa damage report", en: "List equipment (with photos) for damage reports" } },
    ],
  },
];
