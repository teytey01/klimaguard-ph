/**
 * Map a 0–100 percentage to a static Tailwind width class.
 *
 * Dynamic `w-[${pct}%]` strings are never emitted by Tailwind v4's static
 * scanner, so we snap to the nearest 5% and keep every class a literal the
 * scanner can see (listed below). No inline styles.
 *
 * w-0 w-[5%] w-[10%] w-[15%] w-[20%] w-[25%] w-[30%] w-[35%] w-[40%] w-[45%]
 * w-[50%] w-[55%] w-[60%] w-[65%] w-[70%] w-[75%] w-[80%] w-[85%] w-[90%]
 * w-[95%] w-full
 */
export function progressWidthClass(pct: number): string {
  const snapped = Math.round(pct / 5) * 5;
  if (snapped <= 0) {
    return "w-0";
  }
  if (snapped >= 100) {
    return "w-full";
  }
  return `w-[${snapped}%]`;
}
