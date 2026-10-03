import type { SVGProps } from "react";

/** Every icon the app renders. Keep names stable — they double as data keys. */
export type IconName =
  | "shield"
  | "leaf"
  | "radio"
  | "command"
  | "location"
  | "translate"
  | "check"
  | "chevron-down"
  | "chevron-right"
  | "arrow-left"
  | "arrow-right"
  | "phone"
  | "water"
  | "map"
  | "alert-triangle"
  | "sun"
  | "moon"
  | "cloud"
  | "boat"
  | "warehouse"
  | "box"
  | "ambulance"
  | "link"
  | "scroll"
  | "broadcast"
  | "users"
  | "home"
  | "chart"
  | "building"
  | "wifi"
  | "lock"
  | "fish"
  | "log-out"
  | "settings"
  | "printer"
  | "truck"
  | "calendar"
  | "sprout";

export interface IIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Pixel size for width and height. Defaults to 20. */
  size?: number;
  /** Accessible label. When omitted the icon is aria-hidden (decorative). */
  title?: string;
}

/**
 * Inline SVG path data for each icon. Single source of truth — no external
 * icon package (per tech.md: no new icon dependencies). Paths use
 * `currentColor` strokes so icons inherit text color and theme tokens.
 */
const PATHS: Record<IconName, React.ReactNode> = {
  shield: <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" />,
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15 5 17 3 19 3c0 2 .5 11-7 15" />
      <path d="M5 21c2-4 6-7 11-9" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-7" />
      <path d="M12 14c0-3-2-5-6-5 0 4 2 5 6 5z" />
      <path d="M12 11c0-3 2-5 6-5 0 4-2 5-6 5z" />
    </>
  ),
  radio: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M5 5a9 9 0 0 0 0 14M19 5a9 9 0 0 1 0 14" />
    </>
  ),
  broadcast: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <path d="M9 9a4.2 4.2 0 0 0 0 6M15 9a4.2 4.2 0 0 1 0 6" />
      <path d="M12 13.6V21" />
    </>
  ),
  command: (
    <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" />
  ),
  location: (
    <>
      <path d="M12 21s-7-6-7-11a7 7 0 1 1 14 0c0 5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  translate: (
    <>
      <path d="M4 5h8M8 3v2c0 4-2 7-5 8" />
      <path d="M6 9c0 2 2 4 6 5" />
      <path d="M13 21l4-9 4 9M14.5 18h5" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" />,
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5m6-7l-7 7 7 7" />,
  "arrow-right": <path d="M5 12h14m-7-7l7 7-7 7" />,
  phone: (
    <path d="M5 4h3l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  ),
  water: (
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
  ),
  map: (
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  "alert-triangle": (
    <>
      <path d="M12 3L2 20h20L12 3z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </>
  ),
  moon: <path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z" />,
  cloud: (
    <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1A3.5 3.5 0 0 1 17 18H7z" />
  ),
  boat: (
    <>
      <path d="M3 15l9-3 9 3-2 5H5l-2-5z" />
      <path d="M12 12V5l5 3-5 1" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3 21V8l9-4 9 4v13" />
      <path d="M7 21v-7h10v7" />
    </>
  ),
  box: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </>
  ),
  ambulance: (
    <>
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17" cy="17" r="1.6" />
      <path d="M7 9v3M5.5 10.5h3" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 1 0-5.7-5.7L11 7.3" />
      <path d="M14 10a4 4 0 0 0-5.7 0L6 12.3a4 4 0 1 0 5.7 5.7L13 16.7" />
    </>
  ),
  scroll: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V4z" />
      <path d="M9 8h7M9 12h7M9 16h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 6a3 3 0 0 1 0 6M18 20a6 6 0 0 0-3-5" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7M6 10v10h12V10" />,
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </>
  ),
  building: (
    <>
      <path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17" />
      <path d="M15 9h3a1 1 0 0 1 1 1v11" />
      <path d="M8 7h3M8 11h3M8 15h3" />
    </>
  ),
  wifi: (
    <>
      <path d="M4 9a14 14 0 0 1 16 0M7 12.5a9 9 0 0 1 10 0M10 16a4 4 0 0 1 4 0" />
      <path d="M12 20h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  "log-out": (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  fish: (
    <>
      <path d="M3 12c4-5 11-6 16-2-2 4-2 4 0 8-5 2-12 1-16-6z" />
      <path d="M16 10l5-4M16 14l5 4" />
      <circle cx="8" cy="11" r="0.8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </>
  ),
  printer: (
    <>
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="1.5" />
      <path d="M6 14h12v7H6z" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
};

/**
 * Theme-aware inline SVG icon. Replaces emoji usage across the app. Inherits
 * `currentColor`, so color it with text utilities (e.g. `text-teal`).
 */
export default function Icon({
  name,
  size = 20,
  title,
  ...rest
}: IIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
