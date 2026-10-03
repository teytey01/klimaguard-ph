// Shared Tailwind class strings for the Municipal Command Center (theme-aware
// tokens only; 44px touch targets). Kept as literals so Tailwind's scanner
// emits them.

export const MUN_BTN_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:opacity-60";

export const MUN_BTN_OUTLINE =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-teal/50 px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-60";

export const MUN_BTN_ALERT =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-alert px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-alert focus-visible:ring-offset-2 disabled:opacity-60";

export const MUN_BTN_SMALL =
  "inline-flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-black/10 bg-cmd-tile px-3 py-1.5 text-xs font-semibold text-cmd-heading hover:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-60 dark:border-white/15";

export const MUN_FIELD =
  "min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 py-2 text-sm text-cmd-heading placeholder:text-cmd-muted/70 focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15";

export const MUN_LABEL = "block text-xs font-semibold text-cmd-muted";

export const MUN_TH = "px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-cmd-muted";

export const MUN_TD = "px-2 py-2 align-top text-sm text-cmd-heading";

export const MUN_TABLE_WRAP = "overflow-x-auto rounded-lg border border-black/10 dark:border-white/10";

export const MUN_CHIP = "inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide";

export const MUN_TONE_CHIP: Record<"good" | "caution" | "critical" | "info", string> = {
  good: "bg-teal/15 text-teal",
  caution: "bg-cmd-accent/20 text-cmd-heading",
  critical: "bg-alert text-white",
  info: "bg-cmd-tile text-cmd-heading",
};
