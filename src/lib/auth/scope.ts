import type { CommunityReport, Prisma, User } from "@prisma/client";

import type { ICommunityReport } from "@/types";

// Single source of truth for role + location access rules (v6 matrix, M11):
// - resident / farmer: read + submit reports in their OWN barangay only.
// - barangay official: read + respond in their own barangay.
// - municipal official (lgu): read + respond across their whole municipality.
// - Nobody crosses municipalities. Enforced here, in the query `where`.

const OFFICIAL_ROLES = new Set(["barangay", "lgu"]);

export function isOfficial(user: User): boolean {
  return OFFICIAL_ROLES.has(user.role);
}

/** Prisma filter limiting reports to what this user may see. */
export function reportScope(user: User): Prisma.CommunityReportWhereInput {
  const municipal = {
    province: user.province,
    municipality: user.municipality,
  };
  if (user.role === "lgu") {
    return municipal;
  }
  // Residents, farmers, and barangay officials are barangay-scoped. A missing
  // barangay must match nothing rather than the whole municipality.
  return { ...municipal, barangay: user.barangay ?? "__none__" };
}

/** May this user respond to / resolve this report? */
export function canRespond(user: User, report: CommunityReport): boolean {
  if (report.province !== user.province || report.municipality !== user.municipality) {
    return false;
  }
  if (user.role === "lgu") {
    return true;
  }
  return user.role === "barangay" && report.barangay === user.barangay;
}

/**
 * Client-safe report view. authorId/responderId are never exposed — residents
 * report anonymously. `mine` lets the author recognize their own report.
 */
export function toPublicReport(report: CommunityReport, viewer: User): ICommunityReport {
  return {
    id: report.id,
    title: report.title,
    body: report.body,
    status: report.status,
    barangay: report.barangay,
    municipality: report.municipality,
    response: report.response ?? undefined,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    mine: report.authorId === viewer.id,
  };
}
