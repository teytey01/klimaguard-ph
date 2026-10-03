import { NextResponse } from "next/server";

import { askKlimaAgent } from "@/lib/agent/quickClient";
import { CHAT_FALLBACK_MESSAGE } from "@/lib/constants";
import type { IChatResponse } from "@/types";

interface IChatRequestBody {
  message: string;
}

/**
 * Chat Route Handler — the stand-in for the Amazon Quick agent.
 *
 * The agent logic now lives in the server-only `askKlimaAgent` module. While
 * Amazon Quick is unconfigured it returns deterministic Filipino replies; the
 * real SigV4-signed server-side call (TODO(Amazon Quick)) drops into
 * `src/lib/agent/quickClient.ts` without touching this handler.
 */
export async function POST(request: Request): Promise<NextResponse<IChatResponse>> {
  try {
    const body = (await request.json()) as Partial<IChatRequestBody>;
    const message = typeof body.message === "string" ? body.message : "";

    const payload = await askKlimaAgent(message);

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ reply: CHAT_FALLBACK_MESSAGE }, { status: 500 });
  }
}
