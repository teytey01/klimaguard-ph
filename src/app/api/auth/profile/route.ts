import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getSessionUser, toPublicSession } from "@/lib/auth/session";
import {
  cleanText,
  ERR_BAD_REQUEST,
  ERR_FORBIDDEN,
  ERR_SERVER,
  ERR_UNAUTHENTICATED,
  jsonError,
  readJson,
} from "@/lib/auth/http";
import { PH_REGIONS } from "@/lib/onboarding/onboardingData";

interface IProfileRequest {
  role?: unknown;
  region?: unknown;
  province?: unknown;
  municipality?: unknown;
  barangay?: unknown;
  primaryCrop?: unknown;
}

const ALLOWED_CROPS = new Set(["rice", "corn", "vegetable", "aquaculture"]);

/** True when the location exists in the cascading dataset. */
function isKnownLocation(
  region: string,
  province: string,
  municipality: string,
  barangay: string,
): boolean {
  const r = PH_REGIONS.find((x) => x.name === region);
  const p = r?.provinces.find((x) => x.name === province);
  const m = p?.municipalities.find((x) => x.name === municipality);
  return Boolean(m?.barangays.includes(barangay));
}

/**
 * PATCH /api/auth/profile — save a resident's onboarding (location + optional
 * farmer add-on). Residents may only switch between "resident" and "farmer";
 * official roles are admin-assigned and can never be self-granted here.
 */
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError(ERR_UNAUTHENTICATED, 401);
    }
    if (user.role !== "resident" && user.role !== "farmer") {
      // Officials' scope is pre-assigned; they don't onboard.
      return jsonError(ERR_FORBIDDEN, 403);
    }

    const body = await readJson<IProfileRequest>(request);
    if (!body) {
      return jsonError(ERR_BAD_REQUEST, 400);
    }

    const requestedRole = body.role === "farmer" ? "farmer" : "resident";
    if (body.role !== undefined && body.role !== "resident" && body.role !== "farmer") {
      return jsonError(ERR_FORBIDDEN, 403);
    }

    const region = cleanText(body.region, 80);
    const province = cleanText(body.province, 80);
    const municipality = cleanText(body.municipality, 80);
    const barangay = cleanText(body.barangay, 80);
    if (!isKnownLocation(region, province, municipality, barangay)) {
      return jsonError("Hindi kilala ang napiling lokasyon.", 400);
    }

    const crop = cleanText(body.primaryCrop, 20);
    const isFarmer = requestedRole === "farmer";
    if (isFarmer && !ALLOWED_CROPS.has(crop)) {
      return jsonError("Pumili ng pangunahing pananim.", 400);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: requestedRole,
        isFarmer,
        primaryCrop: isFarmer ? crop : null,
        region,
        province,
        municipality,
        barangay,
        onboarded: true,
      },
    });

    return NextResponse.json({ session: toPublicSession(updated) });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}
