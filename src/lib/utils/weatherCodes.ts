// WMO weather code → Filipino label + emoji.
// Reference codes required by the spec: 0 = "Maaraw ☀️", 61 = "Umuulan 🌧️",
// 95 = "May bagyo ⛈️". All standard WMO codes are mapped below.

/** A human-readable weather description in Filipino. */
export interface IWeatherDescription {
  label: string;
  emoji: string;
}

/** WMO code → Filipino description. */
export const WMO_FILIPINO: Record<number, IWeatherDescription> = {
  0: { label: "Maaraw", emoji: "☀️" },
  1: { label: "Halos maaraw", emoji: "🌤️" },
  2: { label: "Bahagyang maulap", emoji: "⛅" },
  3: { label: "Maulap", emoji: "☁️" },
  45: { label: "Maulap na hamog", emoji: "🌫️" },
  48: { label: "Namumuong hamog", emoji: "🌫️" },
  51: { label: "Mahinang ambon", emoji: "🌦️" },
  53: { label: "Katamtamang ambon", emoji: "🌦️" },
  55: { label: "Malakas na ambon", emoji: "🌦️" },
  56: { label: "Mahinang nagyeyelong ambon", emoji: "🌨️" },
  57: { label: "Malakas na nagyeyelong ambon", emoji: "🌨️" },
  61: { label: "Umuulan", emoji: "🌧️" },
  63: { label: "Katamtamang ulan", emoji: "🌧️" },
  65: { label: "Malakas na ulan", emoji: "🌧️" },
  66: { label: "Mahinang nagyeyelong ulan", emoji: "🌨️" },
  67: { label: "Malakas na nagyeyelong ulan", emoji: "🌨️" },
  71: { label: "Mahinang niyebe", emoji: "🌨️" },
  73: { label: "Katamtamang niyebe", emoji: "🌨️" },
  75: { label: "Malakas na niyebe", emoji: "❄️" },
  77: { label: "Mga butil ng niyebe", emoji: "🌨️" },
  80: { label: "Pabugso-bugsong ulan", emoji: "🌦️" },
  81: { label: "Katamtamang pabugso na ulan", emoji: "🌧️" },
  82: { label: "Malakas na pabugso na ulan", emoji: "⛈️" },
  85: { label: "Mahinang pabugso na niyebe", emoji: "🌨️" },
  86: { label: "Malakas na pabugso na niyebe", emoji: "❄️" },
  95: { label: "May bagyo", emoji: "⛈️" },
  96: { label: "Bagyong may yelo", emoji: "⛈️" },
  99: { label: "Malakas na bagyong may yelo", emoji: "⛈️" },
};

const UNKNOWN_WEATHER: IWeatherDescription = {
  label: "Hindi matukoy",
  emoji: "❓",
};

/**
 * Returns the Filipino description for a WMO code, or a safe Filipino default
 * for codes outside the standard set.
 */
export function describeWeather(code: number): IWeatherDescription {
  return WMO_FILIPINO[code] ?? UNKNOWN_WEATHER;
}
