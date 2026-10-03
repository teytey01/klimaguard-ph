// api clients
export { fetchGeocoding } from "@/lib/api/geocoding";
export { fetchOpenMeteoWeather } from "@/lib/api/weather";
export { fetchPagasaWeather } from "@/lib/api/pagasa";
export {
  buildTenDayWeather,
  getPagasaTenDayDays,
  isCoveredByTenDay,
  manilaToday,
  mergeTenDay,
  PAGASA_TENDAY_META,
} from "@/lib/api/pagasaTenDay";
