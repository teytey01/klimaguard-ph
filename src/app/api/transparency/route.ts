import { NextResponse } from "next/server";

import {
  DEFAULT_TRANSPARENCY_PROVINCE,
  getTransparencyData,
  TRANSPARENCY_ERROR,
} from "@/lib/transparency";
import type { ITransparencyData } from "@/types";

// DRRM (Disaster Risk Reduction and Management) fund transparency for M11.
// No live COA/DBM/DILG feed is wired yet, so this serves typed demo data for
// the requested province (defaults to Leyte). 15-minute minimum cache.
// Degrades gracefully to a Filipino error on failure. Factual figures only —
// no political commentary (G03).
export const revalidate = 900;

export async function GET(
  request: Request,
): Promise<NextResponse<ITransparencyData> | NextResponse<{ error: string }>> {
  try {
    const params = new URL(request.url).searchParams;
    const province =
      params.get("province")?.trim() || DEFAULT_TRANSPARENCY_PROVINCE;

    const data = getTransparencyData(province);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: TRANSPARENCY_ERROR }, { status: 503 });
  }
}
