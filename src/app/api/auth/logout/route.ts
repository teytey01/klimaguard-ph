import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth/session";
import { ERR_SERVER, jsonError } from "@/lib/auth/http";

/** POST /api/auth/logout — delete the session row and clear the cookie. */
export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}
