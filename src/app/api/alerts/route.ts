import { NextResponse } from "next/server";

// Hazard alerts (M3) — mock data for the Eastern Visayas hackathon demo. No
// live NDRRMC/PAGASA feed is wired yet, so this serves a typed, deterministic
// typhoon-signal scenario. All user-facing text is Filipino-first, and the
// shape is stable so the AlertBanner / EvacuationCard components can bind to it.
// Degrades gracefully to a Filipino error on failure. 15-minute minimum cache.
export const revalidate = 900;

const DEFAULT_REGION = "Eastern Visayas";
const ALERTS_ERROR = "Hindi makuha ang mga alerto ngayon. Pakisubukan ulit.";

/** One evacuation center attached to an alert. */
export interface IEvacuationCenter {
  name: string;
  address: string;
  /** Human-readable distance from the user, e.g. "1.2 km". */
  distance: string;
  capacity: number;
  contactNumber: string;
}

/** Severity tiers used for alert styling (emergency = Alert Red). */
export type IAlertSeverity = "info" | "watch" | "warning" | "emergency";

/** A single hazard alert. */
export interface IHazardAlert {
  id: string;
  type: "typhoon" | "flood" | "landslide" | "earthquake" | "heat";
  severity: IAlertSeverity;
  /** PAGASA tropical cyclone wind signal number, when applicable. */
  signalNumber?: number;
  /** Filipino-first headline (emoji allowed). */
  title: string;
  /** Filipino description of the hazard. */
  description: string;
  affectedAreas: string[];
  evacuationCenters: IEvacuationCenter[];
  /** ISO timestamp of when the alert was issued. */
  issuedAt: string;
  /** Attribution — REQUIRED on every data surface. */
  source: string;
}

/** Response shape of the /api/alerts Route Handler. */
export interface IAlertsResponse {
  success: true;
  alerts: IHazardAlert[];
  activeAlertCount: number;
}

/** Error response shape (never leaks internals — Filipino message only). */
export interface IAlertsErrorResponse {
  success: false;
  error: string;
}

/**
 * Builds the demo alert set for a region. Only "Eastern Visayas" has a scripted
 * scenario; other regions return an empty (but successful) alert list so the UI
 * shows its calm/no-active-alerts state.
 */
function buildAlerts(region: string): IHazardAlert[] {
  if (region !== DEFAULT_REGION) {
    return [];
  }

  return [
    {
      id: "alert-001",
      type: "typhoon",
      severity: "warning",
      signalNumber: 2,
      title: "⚠️ Typhoon Signal #2 — Leyte",
      description:
        "May papalapit na bagyo. Signal #2 ang Leyte at Samar.",
      affectedAreas: [
        "Leyte",
        "Southern Leyte",
        "Samar",
        "Eastern Samar",
        "Biliran",
      ],
      evacuationCenters: [
        {
          name: "Tacloban City Astrodome",
          address: "Justice Romualdez St",
          distance: "1.2 km",
          capacity: 5000,
          contactNumber: "(053) 321-2345",
        },
        {
          name: "Palo Municipal Hall",
          address: "Palo, Leyte",
          distance: "3.5 km",
          capacity: 2000,
          contactNumber: "(053) 323-4567",
        },
      ],
      issuedAt: new Date().toISOString(),
      source: "NDRRMC / PAGASA",
    },
  ];
}

export async function GET(
  request: Request,
): Promise<NextResponse<IAlertsResponse> | NextResponse<IAlertsErrorResponse>> {
  try {
    const region =
      new URL(request.url).searchParams.get("region")?.trim() ||
      DEFAULT_REGION;

    const alerts = buildAlerts(region);

    return NextResponse.json({
      success: true,
      alerts,
      activeAlertCount: alerts.length,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: ALERTS_ERROR },
      { status: 503 },
    );
  }
}
