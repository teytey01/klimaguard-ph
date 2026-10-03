import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { ERR_SERVER, ERR_UNAUTHENTICATED, jsonError } from "@/lib/auth/http";
import type { ITransparencyData } from "@/types";

/**
 * GET /api/db/transparency — the DRRM budget for the signed-in user's OWN
 * municipality. There is deliberately no municipality query param: the docs
 * forbid viewing another municipality's data, so scope comes from the session.
 * View-only for every role here (editing is a separate, official-only flow).
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError(ERR_UNAUTHENTICATED, 401);
    }

    const budget = await prisma.municipalBudget.findFirst({
      where: { province: user.province, municipality: user.municipality },
      orderBy: { fiscalYear: "desc" },
      include: { lines: true },
    });
    if (!budget) {
      return jsonError(
        `Wala pang datos ng DRRM fund para sa ${user.municipality}.`,
        404,
      );
    }

    const data: ITransparencyData = {
      province: `${budget.municipality}, ${budget.province}`,
      fiscalYear: budget.fiscalYear,
      totalAllocated: budget.totalAllocated,
      totalSpent: budget.totalSpent,
      lines: budget.lines.map((l) => ({
        category: l.category,
        label: l.label,
        allocated: l.allocated,
        spent: l.spent,
      })),
      timeline: [],
      source: budget.source,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}
