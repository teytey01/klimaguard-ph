// Server-only: `next/headers` throws if this module is ever bundled client-side.
import { cookies } from "next/headers";
import type { User } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { randomToken, sha256 } from "@/lib/auth/crypto";
import type { IAuthSession } from "@/types";

// Server session: an opaque random token lives in an HTTP-only cookie; only its
// SHA-256 is stored (Session.tokenHash), so a leaked DB can't be replayed.

export const SESSION_COOKIE = "kg_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Create a DB session for a user and set the cookie (Route Handlers only). */
export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Resolve the signed-in user from the cookie, or null. Expired rows are purged. */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session) {
    return null;
  }
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

/** Delete the current session row and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: sha256(token) } })
      .catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

/**
 * The client-safe view of a user. Never includes mobileHash/passwordHash; the
 * mobile number is only the masked display copy.
 */
export function toPublicSession(user: User): IAuthSession {
  return {
    id: user.id,
    name: user.name ?? "",
    mobile: user.mobileMasked ?? "",
    role: user.role,
    verified: true,
    verifiedAt: user.createdAt.toISOString(),
    onboarded: user.onboarded,
    username: user.username ?? undefined,
    position: user.position ?? undefined,
    department: user.department ?? undefined,
    location: {
      region: user.region,
      province: user.province,
      municipality: user.municipality,
      barangay: user.barangay ?? "",
    },
  };
}
