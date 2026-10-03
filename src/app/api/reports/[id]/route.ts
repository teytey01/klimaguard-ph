import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { canRespond, toPublicReport } from "@/lib/auth/scope";
import {
  cleanText,
  ERR_BAD_REQUEST,
  ERR_FORBIDDEN,
  ERR_SERVER,
  ERR_UNAUTHENTICATED,
  jsonError,
  readJson,
} from "@/lib/auth/http";

interface IRespondRequest {
  response?: unknown;
  status?: unknown;
}

/**
 * PATCH /api/reports/:id — an official responds to / resolves a report within
 * their scope (barangay official: own barangay; lgu: own municipality).
 * Out-of-scope reports return 404 so their existence isn't leaked.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError(ERR_UNAUTHENTICATED, 401);
    }
    if (user.role !== "barangay" && user.role !== "lgu") {
      return jsonError(ERR_FORBIDDEN, 403);
    }

    const { id } = await params;
    const report = await prisma.communityReport.findUnique({ where: { id } });
    if (!report || !canRespond(user, report)) {
      return jsonError("Hindi nahanap ang report.", 404);
    }

    const payload = await readJson<IRespondRequest>(request);
    const response = cleanText(payload?.response, 1000);
    const status = payload?.status === "resolved" ? "resolved" : "responded";
    if (response.length < 4) {
      return jsonError(ERR_BAD_REQUEST, 400);
    }

    const updated = await prisma.communityReport.update({
      where: { id },
      data: { response, status, responderId: user.id },
    });

    return NextResponse.json({ report: toPublicReport(updated, user) });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}
