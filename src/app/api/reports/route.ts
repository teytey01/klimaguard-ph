import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { isOfficial, reportScope, toPublicReport } from "@/lib/auth/scope";
import {
  cleanText,
  ERR_FORBIDDEN,
  ERR_SERVER,
  ERR_UNAUTHENTICATED,
  jsonError,
  readJson,
} from "@/lib/auth/http";
import type { IReportsResponse } from "@/types";

/** GET /api/reports — reports within the viewer's role + location scope. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError(ERR_UNAUTHENTICATED, 401);
    }

    const rows = await prisma.communityReport.findMany({
      where: reportScope(user),
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const body: IReportsResponse = {
      reports: rows.map((r) => toPublicReport(r, user)),
      canRespond: isOfficial(user),
      scopeLabel:
        user.role === "lgu"
          ? `${user.municipality}, ${user.province}`
          : `Brgy. ${user.barangay ?? "—"}, ${user.municipality}`,
    };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}

interface ICreateReportRequest {
  title?: unknown;
  body?: unknown;
}

/**
 * POST /api/reports — submit a community report. Location is always taken from
 * the signed-in user's own profile (never the request body), so nobody can
 * file into another barangay or municipality. Municipal officials have no
 * single barangay and submit via their own channels, so they're excluded.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError(ERR_UNAUTHENTICATED, 401);
    }
    if (user.role === "lgu" || !user.barangay) {
      return jsonError(ERR_FORBIDDEN, 403);
    }

    const payload = await readJson<ICreateReportRequest>(request);
    const title = cleanText(payload?.title, 120);
    const body = cleanText(payload?.body, 1000);
    if (title.length < 4 || body.length < 10) {
      return jsonError(
        "Lagyan ng maikling pamagat (4+ letra) at detalye (10+ letra).",
        400,
      );
    }

    const created = await prisma.communityReport.create({
      data: {
        title,
        body,
        region: user.region,
        province: user.province,
        municipality: user.municipality,
        barangay: user.barangay,
        authorId: user.id,
      },
    });

    return NextResponse.json({ report: toPublicReport(created, user) }, { status: 201 });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}
