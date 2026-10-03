import { NextResponse } from "next/server";

import { getSessionUser, toPublicSession } from "@/lib/auth/session";
import type { IAuthMeResponse } from "@/types";

/** GET /api/auth/me — the current client-safe session, or null when signed out. */
export async function GET() {
  try {
    const user = await getSessionUser();
    const body: IAuthMeResponse = { session: user ? toPublicSession(user) : null };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Fail closed: a broken session lookup reads as signed out.
    const body: IAuthMeResponse = { session: null };
    return NextResponse.json(body, { status: 200 });
  }
}
