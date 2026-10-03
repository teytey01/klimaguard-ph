import type { IAlertState, IHotline } from "@/types";

// 15-minute cache (static literal required under the no-Cache-Components model).
export const revalidate = 900;

const HOTLINES: IHotline[] = [
  { label: "Emergency Hotline", number: "911", tel: "tel:911" },
  { label: "Philippine Red Cross", number: "143", tel: "tel:143" },
  {
    label: "NDRRMC",
    number: "(02) 8911-1406 / 911-5061",
    tel: "tel:+6328911406",
  },
];

export async function GET() {
  try {
    // TODO: replace the mock below with a real NDRRMC/PAGASA fetch, e.g.
    //   const res = await fetch(FEED_URL, { next: { revalidate: 900 } });
    // keeping this handler's shape (typed IAlertState) and fallback intact.
    const state: IAlertState = {
      hasActiveHazard: true,
      alert: {
        signalLevel: 3,
        typhoonName: "Bagyong Pepito",
        affectedAreas: ["Calamba, Laguna", "CALABARZON", "Metro Manila"],
        timestamp: new Date().toISOString(),
        severity: "warning",
      },
      evacuationCenters: [
        {
          name: "Calamba City Evacuation Center",
          distance: "2.4 km",
          capacity: "500 katao",
          directionsUrl:
            "https://www.google.com/maps/dir/?api=1&destination=Calamba+City+Evacuation+Center",
        },
        {
          name: "Barangay Parian Covered Court",
          distance: "3.1 km",
          capacity: "300 katao",
          directionsUrl:
            "https://www.google.com/maps/dir/?api=1&destination=Barangay+Parian+Covered+Court+Calamba",
        },
      ],
      hotlines: HOTLINES,
      source: "mock",
      fetchedAt: new Date().toISOString(),
    };

    return Response.json(state);
  } catch {
    // Safe fallback so the client never breaks (status 200, no active hazard).
    const fallback: IAlertState = {
      hasActiveHazard: false,
      alert: null,
      evacuationCenters: [],
      hotlines: HOTLINES,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
    };

    return Response.json(fallback, { status: 200 });
  }
}
