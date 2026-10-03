import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/crypto";
import { createSession, toPublicSession } from "@/lib/auth/session";
import { cleanText, ERR_SERVER, jsonError, readJson } from "@/lib/auth/http";

interface ILoginRequest {
  username?: unknown;
  password?: unknown;
}

const INVALID_CREDENTIALS = "Mali ang username o password.";

/**
 * POST /api/auth/login — official sign-in (Barangay / Municipal). Accounts are
 * pre-created by an admin per the docs; there is no self-registration here.
 * Residents cannot use this route (they have no password).
 */
export async function POST(request: Request) {
  try {
    const body = await readJson<ILoginRequest>(request);
    const username = cleanText(body?.username, 64).toLowerCase();
    const password = typeof body?.password === "string" ? body.password : "";
    if (!username || !password) {
      return jsonError("Ilagay ang username at password.", 400);
    }

    const user = await prisma.user.findUnique({ where: { username } });
    // Same message for unknown user / wrong password (no account enumeration).
    if (
      !user ||
      !user.passwordHash ||
      (user.role !== "barangay" && user.role !== "lgu") ||
      !verifyPassword(password, user.passwordHash)
    ) {
      return jsonError(INVALID_CREDENTIALS, 401);
    }

    await createSession(user.id);
    return NextResponse.json({ session: toPublicSession(user) });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}
