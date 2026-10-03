import { getCropProfile, PH_CROPS } from "@/lib/agriculture/cropData";
import type {
  IAdvisoryInput,
  ICropAdvisory,
  ICropProfile,
  ICropSuitability,
  ICurrentWeather,
  IEnsoPhase,
  IPlantingVerdict,
  ISprayVerdict,
} from "@/types";

// Pure advisory derivation — NO fetch, NO React, NO console. Operates on the
// normalized Open-Meteo fields (temperatureC, weatherCode, humidity,
// rainChance, windSpeedKmh + forecast[].rainChance) so the exact same logic
// runs on the server (chat path) and the client (AgriculturePanel).
// Tone: practical, direct, farmer-to-farmer Filipino.

const SUITABILITY_LABEL: Record<ICropSuitability, string> = {
  good: "Mainam",
  caution: "Mag-ingat",
  bad: "Huwag muna",
};

/** How many forecast days ahead the planting check looks at. */
const PLANTING_LOOKAHEAD_DAYS = 3;

/** Generic high-humidity fungal-watch threshold for non-rice crops. */
const FUNGAL_HUMIDITY = 90;

/**
 * Spray window: safe only when wind is low AND rain chance is low.
 * `ideal` → calm + dry; `marginal` → borderline; `avoid` → windy or wet.
 */
export function deriveSprayWindow(current: ICurrentWeather): {
  verdict: ISprayVerdict;
  message: string;
} {
  const { windSpeedKmh, rainChance } = current;

  if (windSpeedKmh < 15 && rainChance < 30) {
    return {
      verdict: "ideal",
      message:
        "Mainam mag-spray — mahina ang hangin at mababa ang tsansa ng ulan.",
    };
  }

  if (windSpeedKmh <= 25 && rainChance < 50) {
    return {
      verdict: "marginal",
      message:
        "Pwede mag-spray pero mag-ingat — tumataas ang hangin o tsansa ng ulan.",
    };
  }

  return {
    verdict: "avoid",
    message:
      "Iwas muna sa pag-spray — malakas ang hangin o malaki ang tsansa ng ulan.",
  };
}

/**
 * Planting verdict from the next few days' max rain chance. `wait` when any of
 * the next days exceeds the crop's heavy-rain threshold; else `go`.
 */
export function derivePlanting(
  crop: ICropProfile,
  input: IAdvisoryInput,
): { verdict: IPlantingVerdict; message: string } {
  const upcoming = input.forecast.slice(0, PLANTING_LOOKAHEAD_DAYS);
  const maxRain = upcoming.reduce((max, d) => Math.max(max, d.rainChance), 0);

  if (maxRain > crop.heavyRainChance) {
    return {
      verdict: "wait",
      message: "Hintayin — malakas ang ulan sa mga susunod na araw.",
    };
  }

  return {
    verdict: "go",
    message: `Okay na magtanim ng ${crop.shortName}.`,
  };
}

/**
 * Pest/disease triggers from current conditions. Rice-blast for palay on high
 * humidity; generic fungal watch for other crops at very high humidity.
 */
export function derivePestWarnings(
  crop: ICropProfile,
  current: ICurrentWeather,
): string[] {
  const warnings: string[] = [];

  if (
    crop.blastHumidity !== undefined &&
    current.humidity >= crop.blastHumidity
  ) {
    warnings.push("Mataas ang humidity — bantayan ang blast sa palay.");
  } else if (current.humidity >= FUNGAL_HUMIDITY) {
    warnings.push(
      `Mataas ang humidity — bantayan ang fungal na sakit sa ${crop.shortName}.`,
    );
  }

  return warnings;
}

/**
 * El Niño / La Niña impact warning. Returns undefined on a neutral phase so the
 * card only surfaces ENSO text when it is actually relevant.
 */
export function deriveEnsoWarning(
  crop: ICropProfile,
  phase: IEnsoPhase,
): string | undefined {
  if (phase === "el-nino") {
    return `El Niño: aasahan ang tagtuyot — tipirin ang tubig para sa ${crop.shortName}.`;
  }
  if (phase === "la-nina") {
    return `La Niña: aasahan ang sobrang ulan at baha — ihanda ang drainage ng ${crop.shortName}.`;
  }
  return undefined;
}

function isTempOutsideIdeal(
  crop: ICropProfile,
  current: ICurrentWeather,
): boolean {
  return (
    current.temperatureC < crop.idealTempC.min ||
    current.temperatureC > crop.idealTempC.max
  );
}

/**
 * Overall suitability: `bad` when planting must wait AND temperature is off;
 * `caution` when any pest warning / planting wait / spray avoid; else `good`.
 */
export function deriveSuitability(
  crop: ICropProfile,
  input: IAdvisoryInput,
  planting: { verdict: IPlantingVerdict },
  spray: { verdict: ISprayVerdict },
  pestWarnings: string[],
): ICropSuitability {
  const tempOff = isTempOutsideIdeal(crop, input.current);

  if (planting.verdict === "wait" && tempOff) {
    return "bad";
  }

  if (
    pestWarnings.length > 0 ||
    planting.verdict === "wait" ||
    spray.verdict === "avoid"
  ) {
    return "caution";
  }

  return "good";
}

function buildAction(
  suitability: ICropSuitability,
  crop: ICropProfile,
  planting: { verdict: IPlantingVerdict },
): string {
  if (suitability === "good") {
    return `Magandang panahon para sa ${crop.shortName} — sulitin ang araw.`;
  }
  if (suitability === "caution") {
    return planting.verdict === "wait"
      ? `Antabayanan muna ang panahon bago magtanim ng ${crop.shortName}.`
      : `Ituloy ang ${crop.shortName} pero bantayan ang kondisyon.`;
  }
  return `Ipagpaliban muna ang ${crop.shortName} hanggang bumuti ang panahon.`;
}

/** Compose a full advisory for one crop from the weather input. */
export function buildCropAdvisory(
  crop: ICropProfile,
  input: IAdvisoryInput,
): ICropAdvisory {
  const spray = deriveSprayWindow(input.current);
  const planting = derivePlanting(crop, input);
  const pestWarnings = derivePestWarnings(crop, input.current);
  const suitability = deriveSuitability(
    crop,
    input,
    planting,
    spray,
    pestWarnings,
  );
  const ensoWarning = deriveEnsoWarning(crop, input.ensoPhase);

  return {
    crop: crop.name,
    emoji: crop.emoji,
    suitability,
    suitabilityLabel: SUITABILITY_LABEL[suitability],
    action: buildAction(suitability, crop, planting),
    planting,
    spray,
    pestWarnings,
    ensoWarning,
    source: crop.source,
  };
}

/** Build advisories for the full common PH crop set. */
export function buildCropAdvisories(input: IAdvisoryInput): ICropAdvisory[] {
  return PH_CROPS.map((crop) => buildCropAdvisory(crop, input));
}

/** Build a single advisory by crop id (defaults to palay). */
export function buildCropAdvisoryById(
  cropId: string,
  input: IAdvisoryInput,
): ICropAdvisory {
  return buildCropAdvisory(getCropProfile(cropId), input);
}
