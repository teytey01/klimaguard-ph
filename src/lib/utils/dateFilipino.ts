// Filipino date formatting. date-fns ships no `fil`/Tagalog locale, so the day
// and month names are hand-rolled here; date-fns is used only for safe parsing
// and index extraction.
import { getDate, getDay, getMonth, isValid, parseISO } from "date-fns";

/** Filipino day names, Sunday-first to match date-fns `getDay` (0 = Sunday). */
export const ARAW = [
  "Linggo",
  "Lunes",
  "Martes",
  "Miyerkules",
  "Huwebes",
  "Biyernes",
  "Sabado",
] as const;

/** Short Filipino day labels for the compact forecast strip. */
export const ARAW_MAIKLI = [
  "Lin",
  "Lun",
  "Mar",
  "Miy",
  "Huw",
  "Biy",
  "Sab",
] as const;

/** Filipino month names, January-first to match date-fns `getMonth` (0 = Enero). */
export const BUWAN = [
  "Enero",
  "Pebrero",
  "Marso",
  "Abril",
  "Mayo",
  "Hunyo",
  "Hulyo",
  "Agosto",
  "Setyembre",
  "Oktubre",
  "Nobyembre",
  "Disyembre",
] as const;

/** Short Filipino month labels for the compact forecast strip. */
export const BUWAN_MAIKLI = [
  "Ene",
  "Peb",
  "Mar",
  "Abr",
  "May",
  "Hun",
  "Hul",
  "Ago",
  "Set",
  "Okt",
  "Nob",
  "Dis",
] as const;

const INVALID_DATE = "Petsa";

/**
 * Formats an ISO date (yyyy-MM-dd) as a full Filipino date, e.g.
 * "Biyernes, Oktubre 3". Returns a safe fallback for invalid input.
 */
export function formatFilipinoDate(iso: string): string {
  const date = parseISO(iso);
  if (!isValid(date)) {
    return INVALID_DATE;
  }
  const day = ARAW[getDay(date)];
  const month = BUWAN[getMonth(date)];
  return `${day}, ${month} ${getDate(date)}`;
}

/**
 * Formats an ISO date as a short two-line-friendly label for the forecast
 * strip, e.g. "Biy, Okt 3". Returns a safe fallback for invalid input.
 */
export function formatFilipinoShortDay(iso: string): string {
  const date = parseISO(iso);
  if (!isValid(date)) {
    return INVALID_DATE;
  }
  const day = ARAW_MAIKLI[getDay(date)];
  const month = BUWAN_MAIKLI[getMonth(date)];
  return `${day}, ${month} ${getDate(date)}`;
}
