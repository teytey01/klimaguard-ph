import { NextResponse } from "next/server";

import { getLocalProjects, LOCAL_PROJECTS_ERROR } from "@/lib/transparency";
import type { ILocalProjectsResponse } from "@/types";

// M11 per-project transparency for the locality (Calamba, Laguna). Serves
// typed DEMO data — no live LGU/COA feed is wired yet. Optional filters:
// ?barangay=Real&status=ongoing. Factual figures only (G03). 15-min cache.
export const revalidate = 900;

export async function GET(
  request: Request,
): Promise<NextResponse<ILocalProjectsResponse> | NextResponse<{ error: string }>> {
  try {
    const params = new URL(request.url).searchParams;
    const data = getLocalProjects({
      barangay: params.get("barangay"),
      status: params.get("status"),
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({ error: LOCAL_PROJECTS_ERROR }, { status: 503 });
  }
}
